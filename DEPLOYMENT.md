# Deployment Guide - Family Recipes App

## Overview

This document outlines the deployment strategy for the Family Recipes application using Vercel's hobby tier hosting.

## Deployment Options

### Vercel (Recommended)

**Why Vercel?**
- Built by the creators of Next.js for optimal Next.js performance
- Zero-configuration deployment for Next.js applications
- Automatic HTTPS, global CDN, and edge network
- Seamless integration with GitHub for automatic deployments
- Generous hobby tier limits for personal projects

**Vercel Hobby Tier Features:**

**Pricing:**
- **FREE** for personal, non-commercial projects

**Limits:**
- **Bandwidth:** 100 GB/month
- **Build execution:** 100 hours/month
- **Serverless function execution:** 100 GB-hours/month
- **Serverless function size:** 250 MB compressed
- **Serverless function duration:** 10 seconds max
- **Edge function execution:** 500,000 requests/month
- **Concurrent builds:** 1
- **Team members:** 1 (hobby tier is for individual use)
- **Custom domains:** Unlimited
- **Preview deployments:** Unlimited

**Features Included:**
- Automatic SSL certificates
- Global CDN (edge network)
- Preview deployments for pull requests
- GitHub/GitLab/Bitbucket integration
- Environment variables management
- Deployment rollbacks
- Analytics (limited)
- Web vitals monitoring
- Automatic image optimization
- Edge and serverless functions
- Custom domains with automatic HTTPS

**Limitations:**
- No commercial use allowed (must upgrade to Pro)
- Single team member (no collaboration features)
- Limited analytics compared to Pro tier
- No SLA guarantees
- Logs retention: 1 hour
- No password protection for preview deployments
- No SAML SSO
- No priority support

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account:** For repository hosting and CI/CD
2. **Vercel Account:** Sign up at https://vercel.com (use GitHub to sign in)
3. **Google Cloud Project:** For OAuth credentials
   - Google OAuth Client ID and Secret configured for production domain
4. **Firebase Project:** (if using Firestore backend from other worktree)
   - Firebase Admin SDK credentials
   - Firestore database set up
5. **Gemini API Key:** For AI-powered recipe generation

## Deployment Requirements

### Environment Variables

The following environment variables must be configured in Vercel:

**Required:**
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `NEXTAUTH_URL` - Production URL (e.g., https://your-app.vercel.app)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GEMINI_API_KEY` - Google Gemini API key for recipe generation

**Optional (if using Firestore):**
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

### Build Configuration

The application uses standard Next.js build commands:
- **Build command:** `npm run build` (or `next build`)
- **Output directory:** `.next`
- **Install command:** `npm install`
- **Development command:** `npm run dev`

No special Vercel configuration is required; `next.config.ts` is minimal and works out-of-the-box.

## Vercel Configuration

### vercel.json

A `vercel.json` file is included for build and runtime configuration. It specifies:
- Build output directory
- Environment variable requirements
- Function regions and runtime settings
- Header configurations for security

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to the `main` branch
- **Preview:** Every push to pull requests and other branches

You can customize this behavior in the Vercel project settings.

## CI/CD with GitHub Actions

Two workflows are configured:

### 1. Continuous Integration (`.github/workflows/ci.yml`)

Runs on pull requests and pushes to main:
- Install dependencies
- Run ESLint for code quality
- Run TypeScript type checking
- Build the application to verify it succeeds

This ensures code quality before merging.

### 2. Deployment (Optional)

Vercel handles deployments automatically through its GitHub integration. A separate deployment workflow is not strictly necessary but can be added for custom deployment logic if needed.

## Security Considerations

1. **Environment Variables:** Never commit `.env.local` or any file containing secrets
2. **OAuth Redirect URIs:** Update Google OAuth configuration to include production domain
3. **CORS:** Configure allowed origins if using external APIs
4. **Rate Limiting:** Consider implementing rate limiting for API routes in production
5. **Session Security:** Ensure `NEXTAUTH_SECRET` is a strong, randomly generated value

## Performance Optimization

The application is optimized for Vercel deployment:
- Next.js 15 with App Router for optimal performance
- Automatic code splitting
- Server-side rendering for initial page loads
- API routes as serverless functions
- Image optimization (if Next.js Image component is used)
- SCSS modules for scoped, optimized styles

## Monitoring

Vercel provides basic monitoring on the hobby tier:
- Deployment logs (1 hour retention)
- Function logs (real-time during deployment)
- Web vitals in the Vercel dashboard
- Bandwidth and execution time usage

For more advanced monitoring, consider:
- Sentry for error tracking
- LogTail or similar for longer log retention
- Google Analytics for user analytics

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **NextAuth.js Documentation:** https://authjs.dev
- **Vercel Community:** https://github.com/vercel/vercel/discussions

## Next Steps

1. Review [ENV_SETUP.md](./ENV_SETUP.md) for environment variable configuration
2. Follow [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) for step-by-step deployment
3. Configure GitHub Actions for CI/CD (optional but recommended)
4. Test the deployment thoroughly before sharing with users
