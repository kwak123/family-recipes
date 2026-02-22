# Quick Deploy Guide

## First-Time Setup (30 minutes)

### 1. Prerequisites
```bash
# Verify you have these accounts:
- GitHub account ✓
- Vercel account (signup: vercel.com)
- Google Cloud project (console.cloud.google.com)
```

### 2. Get Credentials
```bash
# Generate NextAuth secret:
openssl rand -base64 32

# Obtain from Google Cloud Console:
- Google OAuth Client ID
- Google OAuth Client Secret

# Get from Google AI Studio:
- Gemini API Key
```

### 3. Test Locally
```bash
cd /Users/samuelkwak/Desktop/personal-projects/family-recipes/kwak123-next-deploy
npm run build
npm run start
# Visit http://localhost:3000
```

### 4. Deploy to Vercel
1. Go to vercel.com/dashboard
2. Click "Add New Project"
3. Import "family-recipes" repo
4. Add environment variables (see below)
5. Click "Deploy"

### 5. Configure OAuth
```
Add to Google OAuth redirect URIs:
https://your-app.vercel.app/api/auth/callback/google
```

## Environment Variables (Vercel Dashboard)

### Required
```
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GEMINI_API_KEY=<your-api-key>
```

### Optional (Firestore)
```
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<private-key-with-newlines>
```

## Update Deployment

### Auto-deploy (Recommended)
```bash
git add .
git commit -m "Your changes"
git push origin kwak123/next-deploy
# Vercel deploys automatically
```

### Manual Redeploy
```
Vercel Dashboard → Deployments → "..." → Redeploy
```

## Rollback
```
Vercel Dashboard → Deployments →
Find last good deployment → "..." → Promote to Production
```

## Common Issues

### Build fails
```bash
# Test locally first:
npm run build
# Fix errors, then push
```

### Auth not working
```
1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches deployment URL
3. Confirm OAuth redirect URIs include Vercel URL
```

### Environment variable not found
```
1. Add/update in Vercel Dashboard
2. Redeploy (changes require redeploy)
```

## Files Created
- `vercel.json` - Deployment config
- `.env.example` - Environment template
- `.github/workflows/ci.yml` - CI workflow
- `DEPLOYMENT.md` - Full guide
- `ENV_SETUP.md` - Environment variables
- `DEPLOY_CHECKLIST.md` - Step-by-step

## Resources
- Full Guide: [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
- Environment Setup: [ENV_SETUP.md](./ENV_SETUP.md)
- Vercel Docs: https://vercel.com/docs
- Support: https://github.com/vercel/vercel/discussions

---

**Need detailed help?** See [DEPLOYMENT_SETUP_COMPLETE.md](./DEPLOYMENT_SETUP_COMPLETE.md)
