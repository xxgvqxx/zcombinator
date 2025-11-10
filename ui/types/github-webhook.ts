/**
 * Type definitions for GitHub webhook integration
 */

/**
 * GitHub Issue Webhook Payload
 * Represents the data structure sent by GitHub when an issue event occurs
 */
export interface GitHubIssuePayload {
  /** Action type (e.g., "opened", "closed", "edited") */
  action: string;

  /** Issue details */
  issue: {
    /** Issue number */
    number: number;

    /** Issue title */
    title: string;

    /** Issue description/body (can be null if empty) */
    body: string | null;

    /** URL to view issue on GitHub */
    html_url: string;

    /** User who created the issue */
    user: {
      /** GitHub username */
      login: string;

      /** User avatar URL */
      avatar_url: string;
    };

    /** Array of labels applied to the issue */
    labels: Array<{
      /** Label name */
      name: string;

      /** Label color (hex code) */
      color: string;
    }>;
  };

  /** Repository information */
  repository: {
    /** Repository name */
    name: string;

    /** Full repository name (owner/repo) */
    full_name: string;
  };
}

/**
 * GitHub Webhook Request Headers
 * Headers sent by GitHub with webhook requests
 */
export interface GitHubWebhookHeaders {
  /** HMAC SHA-256 signature for payload verification */
  'x-hub-signature-256': string;

  /** GitHub event type */
  'x-github-event': string;

  /** Unique delivery ID */
  'x-github-delivery': string;

  /** Content type (usually application/json) */
  'content-type': string;
}

/**
 * Discord Thread Response
 * Response from Discord API when creating a forum thread
 */
export interface DiscordThreadResponse {
  /** Thread/channel ID */
  id: string;

  /** Thread name */
  name: string;

  /** Thread type */
  type: number;

  /** Parent forum channel ID */
  parent_id: string;

  /** Guild (server) ID */
  guild_id?: string;
}

/**
 * Process Webhook Result
 * Result returned by processGitHubWebhook service function
 */
export interface ProcessWebhookResult {
  /** Whether the operation was successful */
  success: boolean;

  /** Created Discord thread (only present on success) */
  thread?: {
    /** Thread ID */
    id: string;

    /** Thread name */
    name: string;
  };

  /** Success or informational message */
  message?: string;

  /** Error message (only present on failure) */
  error?: string;

  /** Detailed error information (only present on failure) */
  details?: string;
}

/**
 * Environment Validation Result
 * Result of validating required environment variables
 */
export interface EnvironmentValidation {
  /** Whether all required variables are present */
  valid: boolean;

  /** Array of missing environment variable names */
  missing: string[];
}

/**
 * Type guard to check if result is an error
 */
export function isWebhookError(result: ProcessWebhookResult): boolean {
  return !result.success && !!result.error;
}

/**
 * Type guard to check if result contains a thread
 */
export function hasThread(result: ProcessWebhookResult): result is ProcessWebhookResult & { thread: { id: string; name: string } } {
  return result.success && !!result.thread;
}
