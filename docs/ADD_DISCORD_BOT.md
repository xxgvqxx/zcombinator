# Complete Guide: Setting Up Discord Bot for GitHub Webhook Integration

This comprehensive guide walks you through setting up a Discord bot that automatically posts GitHub issue notifications to a Discord channel.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Part 1: Discord Bot Setup](#part-1-discord-bot-setup)
- [Part 2: Discord Server Configuration](#part-2-discord-server-configuration)
- [Part 3: GitHub Webhook Configuration](#part-3-github-webhook-configuration)
- [Part 4: Application Setup](#part-4-application-setup)
- [Part 5: Testing](#part-5-testing)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Quick Reference](#quick-reference)

---

## Overview

This integration automatically posts GitHub issue events to a Discord channel. When a new issue is opened in your GitHub repository, the webhook sends the issue details to your Discord server.

### What You'll Set Up

1. **Discord Bot** - A bot application that can post messages to your Discord server
2. **GitHub Webhook** - Configuration to send issue events to your application
3. **Server/Application** - The middleware that receives GitHub webhooks and sends Discord messages

---

## Prerequisites

### Required Accounts

- [ ] GitHub account with **admin access** to the repository
- [ ] Discord account with **admin permissions** on your Discord server
- [ ] Server/hosting environment (Vercel, local development with ngrok, etc.)

### Technical Requirements

- [ ] Node.js 18+ installed (for local development)
- [ ] Git installed
- [ ] Text editor or IDE
- [ ] Terminal/command line access

### Estimated Time

- **First-time setup**: 30-45 minutes
- **Subsequent setups**: 10-15 minutes

---

## Part 1: Discord Bot Setup

### Step 1.1: Create Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** button (top right)
3. Enter a name for your bot (e.g., "GitHub Issues Bot")
4. Accept Discord's Developer Terms of Service
5. Click **"Create"**

> **Note**: The application name is what users will see when the bot is mentioned or posts messages.

### Step 1.2: Configure Bot Settings

1. In your application dashboard, click **"Bot"** in the left sidebar
2. Click **"Add Bot"** button
3. Click **"Yes, do it!"** to confirm

#### Bot Configuration Options

Configure these settings in the Bot section:

**Authorization Flow**:
- ✅ **Public Bot** - Enable if you want others to invite your bot (optional)
- **Requires OAuth2 Code Grant** - Leave disabled (not needed)

**Privileged Gateway Intents** (Important!):
- **Presence Intent** - Leave disabled (not needed)
- **Server Members Intent** - Leave disabled (not needed)
- **Message Content Intent** - Leave disabled (not needed for this integration)

> **Why these settings?** Our bot only posts messages; it doesn't read messages or monitor user activity. Following the principle of least privilege, we disable all unnecessary intents.

### Step 1.3: Get Bot Token

1. In the **Bot** section, find **"TOKEN"**
2. Click **"Reset Token"** (first time) or **"Copy"** (subsequent times)
3. Click **"Yes, do it!"** to confirm reset
4. Click **"Copy"** to copy the token to your clipboard

⚠️ **CRITICAL SECURITY WARNING**:
- **Save this token immediately** in a secure location (password manager recommended)
- **Never share this token** or commit it to version control
- **Never expose it** in client-side code or screenshots
- If compromised, immediately regenerate the token from the Developer Portal
- Treat it like a password - anyone with this token can control your bot

**Save as**: `DISCORD_BOT_TOKEN` - you'll need this later

### Step 1.4: Configure Bot Permissions

1. In the left sidebar, click **"OAuth2"** → **"URL Generator"**

2. In the **SCOPES** section, select:
   - ✅ `bot`

3. In the **BOT PERMISSIONS** section that appears below, select:
   - ✅ **Text Permissions**:
     - `Send Messages` - Required to post messages
     - `Send Messages in Threads` - Required if using forum channels or threads
     - `Create Public Threads` - Optional, only if using forum channels
     - `Manage Threads` - Optional, only if using forum channels
     - `Embed Links` - Recommended for rich message formatting
     - `Read Message History` - Optional, for context

> **Recommended Minimal Permissions**: For basic channel messages, you only need `Send Messages` and `Embed Links`.

4. **Copy** the generated URL at the bottom of the page

### Step 1.5: Invite Bot to Your Server

1. Open the URL you copied in your browser
2. Select the Discord server where you want to add the bot
3. Click **"Continue"**
4. Review the permissions (they match what you selected)
5. Click **"Authorize"**
6. Complete the CAPTCHA if prompted

✅ **Success!** Your bot should now appear in your Discord server's member list (offline status is normal).

---

## Part 2: Discord Server Configuration

### Step 2.1: Enable Developer Mode

Developer Mode allows you to copy IDs for channels, users, servers, and messages.

#### On Desktop/Web:

1. Click the **gear icon** (⚙️) next to your username (bottom left)
2. Navigate to **"App Settings"** → **"Advanced"**
3. Toggle **"Developer Mode"** to **ON** (blue)
4. Close settings

#### On Mobile:

1. Tap your **profile picture** (bottom right)
2. Tap **"Behavior"**
3. Toggle **"Developer Mode"** to **ON**
4. Go back

### Step 2.2: Create or Choose a Channel

You need to decide where the bot will post messages:

**Option A: Regular Text Channel** (Recommended for simple setups)
- Messages appear in a normal chat channel
- Easy to set up and use
- Good for low-volume notifications

**Option B: Forum Channel** (Better for organization)
- Each issue creates a separate thread
- Better for high-volume repositories
- Keeps discussions organized
- Requires additional bot permissions (`Create Public Threads`, `Send Messages in Threads`)

#### To Create a New Text Channel:

1. Right-click on your server name
2. Select **"Create Channel"**
3. Choose **"Text"** channel type
4. Enter channel name (e.g., "github-issues")
5. Set permissions (ensure your bot has access)
6. Click **"Create Channel"**

#### To Create a New Forum Channel:

1. Right-click on your server name
2. Select **"Create Channel"**
3. Choose **"Forum"** channel type
4. Enter channel name (e.g., "github-issues")
5. Set permissions (ensure your bot has `Create Public Threads` and `Send Messages in Threads`)
6. Click **"Create Channel"**

### Step 2.3: Get Channel ID

1. **Right-click** on the channel name
2. Click **"Copy Channel ID"** (this option only appears with Developer Mode enabled)
3. Save this ID - you'll need it as `DISCORD_CHANNEL_ID`

Example Channel ID: `1437519514794197042`

### Step 2.4: Verify Bot Permissions

Ensure your bot can actually post in the channel:

1. Right-click the channel → **"Edit Channel"**
2. Go to **"Permissions"** tab
3. Click **"+"** next to **"Roles/Members"**
4. Select your bot
5. Ensure these permissions are **GREEN** (allowed):
   - ✅ View Channel
   - ✅ Send Messages
   - ✅ Embed Links (recommended)
   - ✅ Send Messages in Threads (if using forum)
   - ✅ Create Public Threads (if using forum)
6. Click **"Save Changes"**

> **Tip**: If you can't find your bot in the permissions list, make sure it was successfully added to the server in Step 1.5.

---

## Part 3: GitHub Webhook Configuration

### Step 3.1: Generate Webhook Secret

The webhook secret is used to verify that requests are actually coming from GitHub and haven't been tampered with.

#### Generate a Secure Secret:

**Option A - Using Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B - Using OpenSSL**:
```bash
openssl rand -hex 32
```

**Option C - Using Online Generator**:
Visit [randomkeygen.com](https://randomkeygen.com/) and use a "CodeIgniter Encryption Key"

⚠️ **Security Requirements**:
- Minimum 32 characters
- Mix of letters, numbers, and special characters
- Truly random (don't use dictionary words or patterns)
- **Never use "test" or "secret" in production!**

Example: `a3f7c2e9b4d8f6e1c9a2b7d4e3f8c1a9b5d2e7f4c3a6b9d1e8f7c2a5b4d3e6f1`

**Save as**: `GITHUB_WEBHOOK_SECRET` - you'll need this in two places (GitHub and your app).

### Step 3.2: Configure GitHub Webhook

1. Go to your GitHub repository
2. Click **"Settings"** tab (you need admin access)
3. In the left sidebar, click **"Webhooks"**
4. Click **"Add webhook"** button
5. Enter your GitHub password if prompted

### Step 3.3: Webhook Configuration

Fill out the webhook form:

#### Payload URL

**For Local Development (with ngrok)**:
```
https://your-ngrok-id.ngrok-free.app/api/github-webhook
```
Example: `https://a1b2c3d4.ngrok-free.app/api/github-webhook`

**For Vercel Deployment**:
```
https://your-app.vercel.app/api/github-webhook
```
Example: `https://zcombinator.vercel.app/api/github-webhook`

**For Custom Domain**:
```
https://yourdomain.com/api/github-webhook
```
Example: `https://zcombinator.io/api/github-webhook`

> **Important**: The path `/api/github-webhook` must match your API route exactly.

#### Content Type

Select: **`application/json`**

> Why JSON? It's the modern standard and easier to parse than form-encoded data.

#### Secret

Paste the webhook secret you generated in Step 3.1.

> This must **exactly match** the `GITHUB_WEBHOOK_SECRET` in your application's environment variables.

#### SSL Verification

Select: **"Enable SSL verification"** (default)

> ⚠️ **Never disable SSL verification in production!** This protects against man-in-the-middle attacks. Only disable for local testing if you have self-signed certificates.

#### Which events would you like to trigger this webhook?

Select: **"Let me select individual events"**

Then check:
- ✅ **Issues**

Uncheck all others (Push, Pull requests, etc.) unless you specifically want them.

> **Why only Issues?** Our current implementation only processes issue events. The webhook will ignore other event types, but it's cleaner to only subscribe to what you need.

#### Active

Ensure the **"Active"** checkbox is ✅ **checked**

> This determines whether GitHub will actually send webhook events. You can temporarily disable a webhook without deleting it by unchecking this.

### Step 3.4: Create Webhook

1. Click **"Add webhook"**
2. GitHub will immediately send a test "ping" event

### Step 3.5: Verify Webhook

1. On the webhook details page, scroll down to **"Recent Deliveries"**
2. Click on the first delivery (the ping event)
3. Check the **Response** tab:
   - ✅ **Status**: 200 OK (green) = Success
   - ❌ **Status**: 4xx or 5xx (red) = Error

**Common Initial Failures**:
- **404 Not Found**: Your app isn't deployed yet or URL is wrong
- **500 Internal Server Error**: Your app crashed (check logs)
- **Timed out**: Your app didn't respond within 10 seconds

> It's OK if the initial ping fails if you haven't deployed your app yet. You can redeliver it later.

---

## Part 4: Application Setup

### Step 4.1: Environment Variables

Create or update your environment variables file:

**Local Development** (`ui/.env` or `ui/.env.local`):
```bash
# GitHub Webhook Integration
GITHUB_WEBHOOK_SECRET='your-generated-secret-from-step-3.1'

# Discord Bot Integration
DISCORD_BOT_TOKEN='your-bot-token-from-step-1.3'
DISCORD_CHANNEL_ID='your-channel-id-from-step-2.3'
```

**Vercel Production**:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `GITHUB_WEBHOOK_SECRET`
   - Value: Your secret
   - Environment: **Production** (and optionally Preview, Development)
   - Click **Save**
5. Repeat for `DISCORD_BOT_TOKEN` and `DISCORD_CHANNEL_ID`

> **Important**: After adding environment variables to Vercel, you must redeploy for them to take effect.

### Step 4.2: Local Development Setup

If testing locally with ngrok:

1. **Install ngrok**:
   ```bash
   # macOS
   brew install ngrok

   # Windows
   choco install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start your development server**:
   ```bash
   cd ui
   npm run dev
   ```

   Ensure it's running on `http://localhost:3000`

3. **Start ngrok tunnel** (in a new terminal):
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL**:
   ```
   Forwarding https://a1b2c3d4.ngrok-free.app -> http://localhost:3000
   ```

5. **Update GitHub webhook URL** with the ngrok URL (see Step 3.3)

> **Note**: ngrok free tier generates a new URL each time you restart it. You'll need to update the GitHub webhook URL each time.

### Step 4.3: Production Deployment (Vercel)

1. **Ensure environment variables are set** (Step 4.1)

2. **Deploy via Git** (recommended):
   ```bash
   git add .
   git commit -m "Add Discord bot integration"
   git push
   ```

   Vercel will automatically deploy when you push to your main branch.

3. **Or deploy via Vercel CLI**:
   ```bash
   npm i -g vercel  # Install Vercel CLI if not already
   vercel --prod
   ```

4. **Verify deployment**:
   - Check Vercel dashboard for deployment status
   - Visit `https://your-app.vercel.app/api/github-webhook` in browser
   - Should see: `{"error": "Method not allowed. This endpoint only accepts POST requests."}`
   - ✅ This means the endpoint is live!

5. **Update GitHub webhook URL** to your production domain (Step 3.3)

---

## Part 5: Testing

### Step 5.1: Test Webhook Delivery

1. Go to your GitHub repository
2. Create a **new issue**:
   - Click **"Issues"** tab
   - Click **"New issue"**
   - Title: "Test Discord Integration"
   - Description: "Testing webhook to Discord. This should appear in the Discord channel."
   - Click **"Submit new issue"**

### Step 5.2: Verify Discord Message

1. Open your Discord server
2. Navigate to the channel you configured
3. You should see a new message from your bot with:
   - Issue title
   - Issue number
   - Repository name
   - Author
   - Labels (if any)
   - Description
   - Link to GitHub issue

### Step 5.3: Check GitHub Webhook Delivery

1. Go to GitHub → Your Repository → Settings → Webhooks
2. Click on your webhook
3. Scroll to **"Recent Deliveries"**
4. Find the delivery with event type "issues"
5. Check:
   - **Request**: Verify payload contains your issue data
   - **Response**: Should be `200 OK` with success message
   - **Headers**: Check `X-Hub-Signature-256` is present

### Step 5.4: Check Application Logs

**Vercel**:
1. Vercel Dashboard → Your Project → **Logs**
2. Filter by function: `/api/github-webhook`
3. Look for:
   ```
   Processing new GitHub issue: owner/repo#123
   Successfully sent Discord message for issue #123
   ```

**Local Development**:
Check your terminal where `npm run dev` is running for similar log messages.

---

## Troubleshooting

### Discord Bot Not Posting

#### Issue: "Bot is offline" or "No messages appearing"

**Possible Causes**:

1. **Bot not invited to server**
   - Solution: Re-invite using OAuth2 URL from Step 1.4

2. **Bot lacks permissions**
   - Solution: Check channel permissions (Step 2.4)
   - Ensure bot role is higher than channel restrictions

3. **Wrong Channel ID**
   - Solution: Re-copy Channel ID with Developer Mode enabled (Step 2.3)
   - Verify `DISCORD_CHANNEL_ID` in environment variables

4. **Invalid Bot Token**
   - Solution: Regenerate token in Developer Portal (Step 1.3)
   - Update `DISCORD_BOT_TOKEN` in environment variables
   - Redeploy application

5. **Channel is forum, but code expects text channel (or vice versa)**
   - Solution: Match your code implementation to your channel type
   - Current implementation uses regular channel messages

**Debug Steps**:
```bash
# Test Discord token validity
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
  https://discord.com/api/v10/users/@me

# Should return bot user data if token is valid
```

### GitHub Webhook Failures

#### Issue: "404 Not Found"

**Cause**: Webhook URL doesn't match deployed endpoint

**Solutions**:
- Verify URL exactly matches: `https://your-domain/api/github-webhook`
- Check if deployment succeeded
- Try accessing URL in browser (should return 405 Method Not Allowed)

#### Issue: "401 Unauthorized" or "Invalid signature"

**Cause**: Webhook signature verification failed

**Solutions**:
- Verify `GITHUB_WEBHOOK_SECRET` matches in both:
  - GitHub webhook configuration
  - Application environment variables
- Ensure secret is exactly the same (no extra spaces)
- Redeploy after changing environment variables
- Try regenerating secret and updating both places

**Debug**:
```javascript
// Check if secret is being read correctly (add to your API route temporarily)
console.log('Webhook secret exists:', !!process.env.GITHUB_WEBHOOK_SECRET);
console.log('Webhook secret length:', process.env.GITHUB_WEBHOOK_SECRET?.length);
```

#### Issue: "500 Internal Server Error"

**Cause**: Application code crashed

**Solutions**:
- Check application logs (Vercel Logs or terminal)
- Common causes:
  - Missing environment variables
  - Discord API rate limiting
  - Invalid Channel ID
  - Network issues

#### Issue: "Delivery timed out"

**Cause**: Application took longer than 10 seconds to respond

**Solutions**:
- Optimize Discord API calls
- Check for infinite loops in code
- Verify Discord API is responding (check status.discord.com)
- Consider responding to GitHub immediately and processing webhook asynchronously

### Environment Variable Issues

#### Issue: Changes not taking effect

**Solutions**:
- **Vercel**: Redeploy after adding/changing environment variables
- **Local**: Restart `npm run dev` after changing `.env` file
- Verify variable names exactly match (case-sensitive)
- Check for typos in variable names

#### Issue: "Missing environment variables" error

**Solutions**:
- Verify all three variables are set:
  - `GITHUB_WEBHOOK_SECRET`
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_CHANNEL_ID`
- Check for extra spaces or quotes in values
- On Vercel, ensure variables are set for correct environment (Production/Preview/Development)

### ngrok Issues

#### Issue: "ngrok URL keeps changing"

**Cause**: Free tier generates new URL on each restart

**Solutions**:
- Keep ngrok running during development
- Upgrade to ngrok paid plan for static URLs
- Use Vercel or other deployment for stable testing

#### Issue: "Connection refused" or "502 Bad Gateway"

**Cause**: Local dev server not running

**Solutions**:
- Ensure `npm run dev` is running
- Verify it's on port 3000
- Check ngrok is pointing to port 3000: `ngrok http 3000`

---

## Security Best Practices

### Webhook Security

1. **Use Strong Secrets**
   - ✅ Minimum 32 characters
   - ✅ Truly random (use crypto.randomBytes)
   - ❌ Never use "test", "secret", "password"

2. **Always Verify Signatures**
   - ✅ Use timing-safe comparison (`crypto.timingSafeEqual`)
   - ❌ Never use `==` or `===` for signature comparison
   - ✅ Verify before processing any webhook data

3. **Enable SSL Verification**
   - ✅ Always enabled in production
   - ✅ Use valid SSL certificates
   - ❌ Never disable SSL verification except for local testing

4. **Validate Event Types**
   - ✅ Only process expected events ("issues" in this case)
   - ✅ Ignore or log unexpected events
   - ✅ Validate payload structure before processing

### Bot Token Security

1. **Protect Your Token**
   - ❌ Never commit tokens to Git
   - ❌ Never share tokens in screenshots or logs
   - ❌ Never expose tokens in client-side code
   - ✅ Use environment variables only
   - ✅ Store in password manager
   - ✅ Rotate tokens periodically (e.g., every 90 days)

2. **If Token is Compromised**
   - Immediately regenerate token in Discord Developer Portal
   - Update environment variables
   - Redeploy application
   - Review Discord server audit logs for unauthorized activity

3. **Access Control**
   - Only give bot necessary permissions (principle of least privilege)
   - Review bot permissions regularly
   - Remove unused permissions

### Discord Channel Security

1. **Channel Permissions**
   - Restrict who can see the channel
   - Prevent @everyone from posting (bot-only channel)
   - Use Discord's verification levels

2. **Rate Limiting**
   - Monitor for unusual activity
   - Discord has built-in rate limits (5-10 messages/sec)
   - Implement exponential backoff for retries

3. **Content Validation**
   - Sanitize issue content before posting
   - Truncate long messages (Discord 2000 char limit)
   - Be aware of Discord's content policy

### Environment Variables

1. **Local Development**
   - Use `.env.local` (never commit this)
   - Add `.env*.local` to `.gitignore`
   - Provide `.env.example` template (with dummy values)

2. **Production**
   - Use secure environment variable management (Vercel, AWS Secrets Manager, etc.)
   - Never log environment variables
   - Rotate secrets periodically

### Monitoring and Logging

1. **Log Important Events**
   - ✅ Webhook received and processed
   - ✅ Discord message sent successfully
   - ❌ Don't log sensitive data (tokens, secrets, full payloads)

2. **Monitor Failures**
   - Set up alerts for repeated webhook failures
   - Monitor Discord API rate limiting
   - Track GitHub webhook delivery success rate

3. **Audit Trail**
   - Review GitHub webhook delivery logs regularly
   - Check Discord server audit logs
   - Monitor bot activity in Discord

---

## Quick Reference

### Required IDs and Tokens

| Variable | Where to Find | Format Example |
|----------|---------------|----------------|
| `DISCORD_BOT_TOKEN` | Discord Developer Portal → Bot → Token | `MTQzNzU1OTY0Njg1NTYzMDkwOA.GgIZYm.1jmpnrdiHVrp4_...` |
| `DISCORD_CHANNEL_ID` | Discord → Right-click channel → Copy Channel ID | `1437519514794197042` |
| `GITHUB_WEBHOOK_SECRET` | Generate with crypto.randomBytes(32) | `a3f7c2e9b4d8f6e1c9a2b7d4e3f8c1a9...` |

### Environment Variables Template

```bash
# .env.example - Commit this template with dummy values
# .env.local - Use for real values (never commit)

# GitHub Webhook Integration
GITHUB_WEBHOOK_SECRET='your-secret-here'

# Discord Bot Integration
DISCORD_BOT_TOKEN='your-bot-token-here'
DISCORD_CHANNEL_ID='your-channel-id-here'
```

### Useful Links

- **Discord Developer Portal**: https://discord.com/developers/applications
- **Discord Developer Docs**: https://discord.com/developers/docs
- **GitHub Webhooks Docs**: https://docs.github.com/en/webhooks
- **Discord API Status**: https://discordstatus.com
- **GitHub Status**: https://www.githubstatus.com
- **ngrok**: https://ngrok.com
- **Vercel**: https://vercel.com

### Common Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/github-webhook` | POST | Receive GitHub webhook events |
| `/api/github-webhook` | GET | Health check (returns 405) |

### Permissions Checklist

**Discord Bot Permissions Required**:
- [x] Send Messages
- [x] Embed Links
- [ ] Send Messages in Threads (optional, for forum channels)
- [ ] Create Public Threads (optional, for forum channels)

**GitHub Repository Access**:
- [x] Admin access (to create webhooks)
- [x] Issues enabled

**Discord Server Access**:
- [x] Admin or "Manage Server" permission
- [x] Ability to invite bots

---

## Support and Troubleshooting

If you encounter issues not covered in this guide:

1. **Check Application Logs** (Vercel Logs or terminal output)
2. **Check GitHub Webhook Deliveries** (Recent Deliveries section)
3. **Verify Environment Variables** (all three are set correctly)
4. **Test Bot Token**: Use Discord API to verify token is valid
5. **Check Discord Status**: Visit https://discordstatus.com
6. **Review Code**: Ensure implementation matches this guide

### Common Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | Success | Everything worked! |
| 401 | Unauthorized | Invalid webhook signature or bot token |
| 403 | Forbidden | Bot lacks permissions in Discord |
| 404 | Not Found | Wrong webhook URL or endpoint not deployed |
| 405 | Method Not Allowed | Sending GET instead of POST |
| 429 | Too Many Requests | Rate limited by Discord |
| 500 | Internal Server Error | Application crashed, check logs |

---

## Next Steps

Once your integration is working:

1. **Customize Message Format**
   - Edit `formatIssueMessage()` in `lib/githubDiscordService.ts`
   - Adjust what information is included
   - Change message styling

2. **Add More Events**
   - Process other webhook events (pull requests, comments, etc.)
   - Update GitHub webhook configuration to include more events
   - Add event handlers in your code

3. **Enhance Features**
   - Add Discord slash commands
   - Implement two-way sync (Discord → GitHub)
   - Add reaction-based workflows
   - Create issue templates based on Discord messages

4. **Scale Up**
   - Implement queue system for high-volume repos
   - Add database for tracking webhook deliveries
   - Implement retry logic with exponential backoff
   - Add metrics and monitoring

---

## Changelog

- **2025-01-12**: Initial comprehensive guide created
  - Complete Discord bot setup instructions
  - GitHub webhook configuration
  - Security best practices
  - Troubleshooting section

---

**Questions or Issues?** Check the troubleshooting section or review application logs for detailed error messages.
