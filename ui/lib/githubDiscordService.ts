/*
 * Z Combinator - Solana Token Launchpad
 * Copyright (C) 2025 Z Combinator
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// ============================================================================
// Imports
// ============================================================================
import crypto from 'crypto';
import { REST } from '@discordjs/rest';
import { Routes, APIThreadChannel } from 'discord-api-types/v10';
import type {
  GitHubIssuePayload,
  DiscordThreadResponse,
  ProcessWebhookResult,
  EnvironmentValidation,
} from '@/types/github-webhook';

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validates all required environment variables for the service
 *
 * @returns Validation result with list of missing variables
 */
export function validateEnvironment(): EnvironmentValidation {
  const missing: string[] = [];

  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    missing.push('GITHUB_WEBHOOK_SECRET');
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    missing.push('DISCORD_BOT_TOKEN');
  }

  if (!process.env.DISCORD_FORUM_CHANNEL_ID) {
    missing.push('DISCORD_FORUM_CHANNEL_ID');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// GitHub Webhook Verification
// ============================================================================

/**
 * Verifies GitHub webhook signature using HMAC SHA-256
 * Implements timing-safe comparison to prevent timing attacks
 *
 * @param payload - Raw request body as string
 * @param signature - Value from x-hub-signature-256 header
 * @param secret - GitHub webhook secret
 * @returns True if signature is valid
 */
export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    const signatureHash = signature.substring(7);
    const hmac = crypto.createHmac('sha256', secret);
    const expectedHash = hmac.update(payload, 'utf8').digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (error) {
    console.error('Error verifying GitHub signature:', error);
    return false;
  }
}

/**
 * Checks if webhook payload is for an "opened" issue event
 *
 * @param payload - Parsed webhook payload
 * @returns True if this is an opened issue event
 */
function isOpenedIssueEvent(payload: GitHubIssuePayload): boolean {
  return payload.action === 'opened' && !!payload.issue;
}

// ============================================================================
// Discord Integration
// ============================================================================

/**
 * Initialize Discord REST client with environment token
 *
 * @throws Error if DISCORD_BOT_TOKEN is not set
 */
function getDiscordClient(): REST {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN environment variable is not set');
  }

  return new REST({ version: '10' }).setToken(token);
}

/**
 * Truncates thread name to Discord's 100 character limit
 *
 * @param name - Thread name to truncate
 * @returns Truncated name (max 100 chars)
 */
function truncateThreadName(name: string): string {
  const MAX_LENGTH = 100;
  if (name.length <= MAX_LENGTH) {
    return name;
  }
  return name.substring(0, MAX_LENGTH - 3) + '...';
}

/**
 * Formats GitHub issue data into Discord message
 * Handles description truncation for Discord's 2000 char message limit
 *
 * @param payload - GitHub webhook payload
 * @returns Formatted Discord message content (max 2000 chars)
 */
export function formatIssueMessage(payload: GitHubIssuePayload): string {
  const { issue, repository } = payload;

  // Format labels
  const labelsText =
    issue.labels.length > 0
      ? issue.labels.map((label) => `\`${label.name}\``).join(', ')
      : '_No labels_';

  // Truncate description if too long (Discord messages have 2000 char limit)
  // Reserve space for the rest of the message content
  const maxDescriptionLength = 1500;
  let description = issue.body || '_No description provided_';
  if (description.length > maxDescriptionLength) {
    description =
      description.substring(0, maxDescriptionLength) +
      '...\n\n_[Description truncated]_';
  }

  // Build formatted message
  return `## New Issue in ${repository.name}

**Issue #${issue.number}: ${issue.title}**

**Repository:** ${repository.full_name}
**Author:** @${issue.user.login}
**Labels:** ${labelsText}

**Description:**
${description}

**View on GitHub:** ${issue.html_url}`;
}

/**
 * Creates Discord forum thread for GitHub issue with retry logic
 * Implements exponential backoff for transient Discord API failures
 *
 * @param payload - GitHub webhook payload
 * @returns Created thread metadata
 * @throws Error if all retry attempts fail
 */
export async function createForumThread(
  payload: GitHubIssuePayload
): Promise<DiscordThreadResponse> {
  const forumChannelId = process.env.DISCORD_FORUM_CHANNEL_ID;

  if (!forumChannelId) {
    throw new Error('DISCORD_FORUM_CHANNEL_ID environment variable is not set');
  }

  const rest = getDiscordClient();

  const threadName = truncateThreadName(
    `[#${payload.issue.number}] ${payload.issue.title}`
  );

  const messageContent = formatIssueMessage(payload);

  // Retry configuration
  const maxAttempts = 3;
  const baseDelayMs = 1000; // 1 second
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    try {
      console.log(
        `Attempt ${attempts + 1}/${maxAttempts}: Creating Discord forum thread for issue #${payload.issue.number}`
      );

      const thread = (await rest.post(Routes.threads(forumChannelId), {
        body: {
          name: threadName,
          message: {
            content: messageContent,
          },
          auto_archive_duration: 1440, // 24 hours
        },
      })) as APIThreadChannel;

      console.log(
        `Successfully created Discord forum thread: ${threadName} (ID: ${thread.id})`
      );

      return {
        id: thread.id,
        name: thread.name || threadName,
        type: thread.type,
        parent_id: thread.parent_id || forumChannelId,
        guild_id: thread.guild_id,
      };
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(
        `Attempt ${attempts}/${maxAttempts} failed to create Discord forum thread:`,
        lastError.message
      );

      // If this was the last attempt, don't wait
      if (attempts >= maxAttempts) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = baseDelayMs * Math.pow(2, attempts - 1);
      console.log(`Retrying in ${delayMs}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retry attempts failed
  const errorMessage = lastError
    ? lastError.message
    : 'Unknown error';

  throw new Error(
    `Failed to create Discord forum thread after ${maxAttempts} attempts: ${errorMessage}`
  );
}

// ============================================================================
// Core Service Function
// ============================================================================

/**
 * Process GitHub webhook and create Discord forum thread
 * Main orchestration function that combines all service operations
 *
 * @param payload - Raw webhook payload string
 * @param signature - GitHub signature header (x-hub-signature-256)
 * @returns Processing result with thread info or error
 */
export async function processGitHubWebhook(
  payload: string,
  signature: string
): Promise<ProcessWebhookResult> {
  // 1. Validate environment
  const envValidation = validateEnvironment();
  if (!envValidation.valid) {
    console.error(
      'Missing required environment variables:',
      envValidation.missing
    );
    return {
      success: false,
      error: 'Server configuration error',
      details: `Missing environment variables: ${envValidation.missing.join(', ')}`,
    };
  }

  // 2. Verify signature
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;
  if (!verifyGitHubSignature(payload, signature, webhookSecret)) {
    console.warn('Invalid GitHub webhook signature detected');
    return {
      success: false,
      error: 'Invalid signature',
    };
  }

  // 3. Parse payload
  let data: GitHubIssuePayload;
  try {
    data = JSON.parse(payload);
  } catch (error) {
    console.error('Failed to parse webhook payload:', error);
    return {
      success: false,
      error: 'Invalid JSON payload',
      details: error instanceof Error ? error.message : 'JSON parse error',
    };
  }

  // 4. Check event type
  if (!isOpenedIssueEvent(data)) {
    console.log(
      `Ignoring webhook event: ${data.action} (only processing "opened" events)`
    );
    return {
      success: true,
      message: `Event ignored: ${data.action}`,
    };
  }

  // 5. Create Discord thread
  try {
    console.log(
      `Processing new GitHub issue: ${data.repository.full_name}#${data.issue.number}`
    );

    const thread = await createForumThread(data);

    console.log(
      `Successfully processed GitHub issue #${data.issue.number} → Discord thread ${thread.id}`
    );

    return {
      success: true,
      thread: {
        id: thread.id,
        name: thread.name,
      },
      message: 'Discord forum thread created successfully',
    };
  } catch (error) {
    console.error('GitHub webhook processing error:', error);
    return {
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
