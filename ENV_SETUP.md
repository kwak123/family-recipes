# Environment Variables Setup Guide

This document provides detailed instructions for configuring environment variables for development and production environments.

## Overview

The Family Recipes app requires several environment variables for authentication, database access, and AI features. These must be configured differently for local development vs. production deployment.

## Environment Variables Reference

### Required for All Environments

#### NextAuth Configuration

**`NEXTAUTH_SECRET`**
- **Purpose:** Encryption key for NextAuth.js sessions and tokens
- **Format:** Random string, minimum 32 characters
- **How to generate:**
  ```bash
  openssl rand -base64 32
  ```
- **Development:** Can use a fixed value for consistency
- **Production:** Must be a strong, unique, randomly generated secret
- **Example:** `4J8kP9mN2vL3xQ6rT8yU1wE5sA7dF0gH9jK2mN5pQ8rT1uW4xZ7aC0eF3gH6jK9m`

**`NEXTAUTH_URL`**
- **Purpose:** Base URL for NextAuth callbacks and redirects
- **Format:** Full URL including protocol
- **Development:** `http://localhost:3000`
- **Production:** Your deployed URL (e.g., `https://family-recipes.vercel.app`)
- **Note:** Vercel automatically sets this for production deployments, but you can override it

#### Google OAuth

**`GOOGLE_CLIENT_ID`**
- **Purpose:** Google OAuth application client ID
- **Format:** String ending in `.apps.googleusercontent.com`
- **How to obtain:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create or select a project
  3. Navigate to "APIs & Services" > "Credentials"
  4. Create OAuth 2.0 Client ID (Web application)
  5. Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://your-domain.vercel.app/api/auth/callback/google`
- **Example:** `919052489169-c0jgkhosgrrspcq3msrrl4igepettehb.apps.googleusercontent.com`

**`GOOGLE_CLIENT_SECRET`**
- **Purpose:** Google OAuth application client secret
- **Format:** String starting with `GOCSPX-`
- **How to obtain:** Generated with the Client ID (see above)
- **Security:** Keep this secret! Never commit to version control
- **Example:** `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`

#### Google Gemini API

**`GEMINI_API_KEY`**
- **Purpose:** API key for Google Gemini AI (recipe generation feature)
- **Format:** String starting with `AIza`
- **How to obtain:**
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create an API key
  3. Enable the Gemini API for your project
- **Example:** `AIzaSyCCHLUuLemCV1LAsomf5x_BelbsJGz6jtU`

### Optional (Firebase/Firestore Integration)

If you're using the Firestore backend from the `kwak123-firestore-backend` worktree:

**`FIREBASE_PROJECT_ID`**
- **Purpose:** Your Firebase project identifier
- **Format:** Lowercase string with hyphens
- **How to obtain:** Firebase Console > Project Settings
- **Example:** `family-recipes-app-12345`

**`FIREBASE_CLIENT_EMAIL`**
- **Purpose:** Service account email for Firebase Admin SDK
- **Format:** Email address ending in `.iam.gserviceaccount.com`
- **How to obtain:**
  1. Firebase Console > Project Settings > Service Accounts
  2. Click "Generate new private key"
  3. The email is included in the downloaded JSON file
- **Example:** `firebase-adminsdk-abc12@family-recipes-app.iam.gserviceaccount.com`

**`FIREBASE_PRIVATE_KEY`**
- **Purpose:** Private key for Firebase Admin SDK authentication
- **Format:** Multi-line RSA private key
- **How to obtain:** Downloaded with service account JSON (see above)
- **Important formatting notes:**
  - In `.env.local`: Must be on a single line with `\n` for line breaks
  - In Vercel: Can paste the actual multi-line key (Vercel handles escaping)
  - Must include the full key including header and footer
- **Example format for .env.local:**
  ```
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
  ```

## Setup Instructions

### 1. Local Development Setup

**Create `.env.local` file:**

```bash
cd /Users/samuelkwak/Desktop/personal-projects/family-recipes/kwak123-next-deploy
cp .env.local.example .env.local  # If example exists
# OR create new file:
touch .env.local
```

**Edit `.env.local` with your values:**

```env
# NextAuth Configuration
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# Google Gemini API
GEMINI_API_KEY=AIza-your-api-key

# Firebase (optional - if using Firestore backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

**Test the configuration:**

```bash
npm run dev
```

Visit `http://localhost:3000` and try signing in with Google.

### 2. Vercel Dashboard Setup

**Add environment variables to Vercel:**

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to "Settings" > "Environment Variables"
3. Add each variable:
   - **Key:** Variable name (e.g., `NEXTAUTH_SECRET`)
   - **Value:** Variable value
   - **Environments:** Select which environments to apply to:
     - Production (main branch deployments)
     - Preview (pull request deployments)
     - Development (local development with `vercel dev`)

**Recommended environment selections:**

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXTAUTH_SECRET` | Yes | Yes | Yes |
| `NEXTAUTH_URL` | Yes | No* | No* |
| `GOOGLE_CLIENT_ID` | Yes | Yes | Yes |
| `GOOGLE_CLIENT_SECRET` | Yes | Yes | Yes |
| `GEMINI_API_KEY` | Yes | Yes | Yes |
| `FIREBASE_PROJECT_ID` | Yes | Yes | Yes |
| `FIREBASE_CLIENT_EMAIL` | Yes | Yes | Yes |
| `FIREBASE_PRIVATE_KEY` | Yes | Yes | Yes |

*Vercel automatically sets `NEXTAUTH_URL` for production and preview deployments based on the deployment URL.

**Special notes for Firebase Private Key in Vercel:**
- Paste the multi-line key directly (including BEGIN/END markers)
- Vercel automatically handles escaping
- No need to convert to single line with `\n`

### 3. GitHub Secrets Setup (for CI/CD)

If using GitHub Actions for CI/CD, add secrets to GitHub:

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each variable as a secret

**Required secrets for CI:**

For type checking and building (CI workflow):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GEMINI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (can use dummy value like `http://localhost:3000` for builds)

Optional for Firestore:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Note:** The CI workflow doesn't actually use these values at runtime; they're needed for TypeScript compilation and build validation.

## Environment Variable Security Checklist

- [ ] Never commit `.env.local` to version control
- [ ] Add `.env.local` to `.gitignore` (should already be there)
- [ ] Use different `NEXTAUTH_SECRET` for production vs development
- [ ] Use production Google OAuth credentials for production deployment
- [ ] Rotate secrets if they are ever exposed
- [ ] Use strong, randomly generated values for `NEXTAUTH_SECRET`
- [ ] Keep Firebase private keys secure and never share them
- [ ] Review Vercel access logs periodically
- [ ] Use environment-specific Firebase projects if possible (dev vs prod)

## Updating Environment Variables

### In Vercel

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Find the variable you want to update
3. Click the three dots menu > "Edit"
4. Update the value
5. **Important:** You must redeploy for changes to take effect
   - Go to "Deployments" tab
   - Click the three dots on latest deployment > "Redeploy"

### In GitHub Secrets

1. Go to GitHub repo > Settings > Secrets and variables > Actions
2. Find the secret you want to update
3. Click "Update"
4. Enter new value and save

## Troubleshooting

### "Invalid client_id" error during Google sign-in

- Verify `GOOGLE_CLIENT_ID` is correct
- Check that authorized redirect URIs include your deployment URL
- Ensure OAuth consent screen is configured

### "NextAuth session undefined" errors

- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your deployment URL
- Clear browser cookies and try again

### Firebase/Firestore connection errors

- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check that `FIREBASE_PRIVATE_KEY` is properly formatted (with newlines)
- Ensure service account has necessary permissions in Firebase

### Build fails in Vercel

- Check Vercel build logs for specific errors
- Verify all required environment variables are set
- Ensure TypeScript types are correct (`npm run build` locally)
- Check that dependencies are correctly listed in `package.json`

## Reference: .env.local Template

Create this file locally (never commit it):

```env
# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"

# Google Gemini API
GEMINI_API_KEY=AIza-your-api-key

# Optional: Firebase/Firestore (if using backend from other worktree)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## Reference Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Configuration](https://authjs.dev/getting-started/deployment)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Firebase Console](https://console.firebase.google.com/)
