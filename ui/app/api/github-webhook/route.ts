import { NextRequest, NextResponse } from 'next/server';
import { processGitHubWebhook } from '@/lib/githubDiscordService';

/**
 * GitHub Webhook Handler
 *
 * Receives GitHub webhook events for issues and creates corresponding
 * Discord forum threads for "opened" issue events.
 *
 * Required environment variables:
 * - GITHUB_WEBHOOK_SECRET: Secret used to verify webhook signatures
 * - DISCORD_BOT_TOKEN: Discord bot token for API access
 * - DISCORD_FORUM_CHANNEL_ID: ID of the Discord forum channel
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw request body for signature verification
    const payload = await request.text();

    // Get GitHub webhook signature header
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      console.warn('Webhook request missing x-hub-signature-256 header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // Delegate all business logic to service
    const result = await processGitHubWebhook(payload, signature);

    // Map service result to HTTP response
    if (!result.success) {
      // Determine appropriate status code based on error type
      const statusCode = result.error === 'Invalid signature' ? 401 : 500;

      return NextResponse.json(
        {
          error: result.error,
          details: result.details,
        },
        { status: statusCode }
      );
    }

    // Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Catch any unexpected errors at the route level
    console.error('Unexpected error in GitHub webhook route:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle non-POST requests
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests.' },
    { status: 405 }
  );
}
