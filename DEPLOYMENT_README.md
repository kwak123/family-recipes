# Deployment Configuration - Family Recipes App

This directory contains all the configuration and documentation needed to deploy the Family Recipes application to Vercel's hobby tier.

## Quick Start

1. **Read the deployment guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Set up environment variables:** [ENV_SETUP.md](./ENV_SETUP.md)
3. **Follow the deployment checklist:** [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

## Documentation Files

### [DEPLOYMENT.md](./DEPLOYMENT.md)
Comprehensive deployment guide covering:
- Why Vercel was chosen
- Hobby tier features, limits, and pricing
- Prerequisites and requirements
- Security and performance considerations
- Support resources

### [ENV_SETUP.md](./ENV_SETUP.md)
Complete environment variables reference:
- All required and optional environment variables
- How to obtain credentials (Google OAuth, Gemini API, Firebase)
- Setup instructions for local development, Vercel, and GitHub Actions
- Troubleshooting common environment variable issues
- Security best practices

### [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
Step-by-step deployment checklist:
- First-time deployment (10 steps)
- Subsequent deployments (3 methods)
- Updating environment variables
- Rollback procedures
- Monitoring and maintenance
- Troubleshooting guide
- Security checklist

## Configuration Files

### [vercel.json](./vercel.json)
Vercel project configuration:
- Build commands and output directory
- Function timeout settings (10 seconds max for hobby tier)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Region configuration (iad1 - US East)

### [.env.example](./.env.example)
Template for environment variables:
- All required variables with placeholder values
- Comments explaining where to obtain each credential
- Proper formatting examples (especially for Firebase private key)

### [.github/workflows/ci.yml](./.github/workflows/ci.yml)
GitHub Actions CI workflow:
- Runs on pull requests and pushes to main
- Lints code with ESLint
- Type checks with TypeScript
- Builds application to verify success
- Uploads build artifacts

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub Repo                          │
│  (family-recipes repository, kwak123/next-deploy branch)    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Push/PR triggers
                  │
      ┌───────────▼──────────┐         ┌──────────────────────┐
      │  GitHub Actions CI   │         │   Vercel Platform    │
      │  - Lint              │         │  - Auto-deploy       │
      │  - Type check        │◄────────┤  - Build             │
      │  - Build test        │         │  - Host              │
      └──────────────────────┘         │  - CDN               │
                                        └──────────┬───────────┘
                                                   │
                                                   │ Deployed to
                                                   │
                                        ┌──────────▼───────────┐
                                        │   Production URL     │
                                        │  (Vercel subdomain   │
                                        │   or custom domain)  │
                                        └──────────────────────┘
```

## Technology Stack

- **Frontend Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** SCSS Modules
- **Authentication:** NextAuth.js 5 (beta)
- **OAuth Provider:** Google
- **Database:** In-memory (with option for Firestore)
- **AI Integration:** Google Gemini API
- **Hosting:** Vercel (Hobby tier)
- **CI/CD:** GitHub Actions

## Environment Variables Summary

### Required for All Deployments
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - Application URL
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `GEMINI_API_KEY` - AI API key

### Optional (Firestore Integration)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key

See [ENV_SETUP.md](./ENV_SETUP.md) for complete details.

## Deployment Workflow

### Automatic (Recommended)
1. Push code to GitHub
2. Vercel automatically detects changes
3. Builds and deploys to production
4. Preview deployments created for PRs

### Manual (Via Vercel Dashboard)
1. Go to Vercel Dashboard
2. Select project
3. Click "Redeploy" on latest deployment

### CLI (For advanced users)
```bash
vercel --prod
```

## Vercel Hobby Tier Limits

- **Cost:** FREE
- **Bandwidth:** 100 GB/month
- **Build time:** 100 hours/month
- **Function execution:** 100 GB-hours/month
- **Function timeout:** 10 seconds
- **Deployments:** Unlimited
- **Team size:** 1 (individual only)

Perfect for personal projects and portfolios.

## Security Features

Implemented security measures:
- ✅ Environment variables for all secrets
- ✅ `.env.local` in `.gitignore`
- ✅ HTTPS enforced (automatic with Vercel)
- ✅ Security headers configured (vercel.json)
- ✅ OAuth with Google (secure authentication)
- ✅ NextAuth.js session encryption
- ✅ No sensitive data in client-side code

## Performance Optimizations

- Server-side rendering (Next.js App Router)
- Automatic code splitting
- Edge network deployment via Vercel CDN
- Optimized builds with Next.js 15
- SCSS modules for scoped styles
- Serverless API routes for scalability

## Monitoring

Available on Vercel hobby tier:
- Deployment logs (1 hour retention)
- Real-time function logs during deployment
- Web vitals dashboard
- Bandwidth and execution time tracking

For more advanced monitoring, consider:
- Sentry for error tracking
- LogTail for log retention
- Google Analytics for user analytics

## Troubleshooting

Common issues and solutions:

### Build Failures
- Check Vercel build logs
- Verify dependencies in `package.json`
- Test build locally: `npm run build`

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches deployment URL
- Confirm Google OAuth redirect URIs

### Environment Variable Problems
- Ensure all required variables are set in Vercel
- Redeploy after updating variables
- Check variable formatting (especially Firebase private key)

See [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) for detailed troubleshooting.

## Next Steps

1. ✅ Review all documentation files
2. ✅ Gather all required credentials (see ENV_SETUP.md)
3. ✅ Test build locally
4. ✅ Follow DEPLOY_CHECKLIST.md for deployment
5. ✅ Set up custom domain (optional)
6. ✅ Configure GitHub Actions CI (optional but recommended)

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **NextAuth.js Docs:** https://authjs.dev
- **Vercel Community:** https://github.com/vercel/vercel/discussions

## Notes

- This deployment configuration is for the `kwak123-next-deploy` worktree
- The main branch contains the production-ready code
- The `kwak123-firestore-backend` worktree contains optional Firestore integration
- Vercel automatically detects Next.js and configures optimal settings

---

**Ready to deploy?** Start with [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)!
