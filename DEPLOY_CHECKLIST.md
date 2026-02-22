# Deployment Checklist

This checklist guides you through deploying the Family Recipes app to Vercel for the first time and for subsequent updates.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account (sign up at https://vercel.com using GitHub)
- [ ] Google Cloud project with OAuth credentials configured
- [ ] Google Gemini API key
- [ ] (Optional) Firebase project with Admin SDK credentials
- [ ] All environment variables documented (see [ENV_SETUP.md](./ENV_SETUP.md))

## First-Time Deployment

### Step 1: Prepare Your Repository

- [ ] Ensure all code is committed to the `kwak123/next-deploy` branch
- [ ] Verify `.env.local` is in `.gitignore` (should already be there)
- [ ] Review `package.json` to ensure all dependencies are listed
- [ ] Test the build locally:
  ```bash
  cd /Users/samuelkwak/Desktop/personal-projects/family-recipes/kwak123-next-deploy
  npm run build
  npm run start
  ```
- [ ] Confirm the app works at `http://localhost:3000`

### Step 2: Configure Google OAuth for Production

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to your project > "APIs & Services" > "Credentials"
- [ ] Edit your OAuth 2.0 Client ID
- [ ] Add authorized redirect URIs:
  - [ ] `https://your-app-name.vercel.app/api/auth/callback/google`
  - [ ] Note: You'll update this with the actual Vercel URL after deployment
- [ ] Save changes

### Step 3: Push to GitHub

- [ ] Merge `kwak123/next-deploy` branch to `main` (or deploy from branch):
  ```bash
  cd /Users/samuelkwak/Desktop/personal-projects/family-recipes/kwak123-next-deploy
  git push origin kwak123/next-deploy
  ```

### Step 4: Create Vercel Project

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New..." > "Project"
- [ ] Import your GitHub repository:
  - [ ] Select "family-recipes" repository
  - [ ] Choose the branch to deploy (e.g., `main` or `kwak123/next-deploy`)
- [ ] Configure project settings:
  - [ ] Project Name: `family-recipes` (or your preferred name)
  - [ ] Framework Preset: Next.js (should auto-detect)
  - [ ] Root Directory: `./` (or specify worktree path if needed)
  - [ ] Build Command: `npm run build` (should auto-fill)
  - [ ] Output Directory: `.next` (should auto-fill)
  - [ ] Install Command: `npm install` (should auto-fill)

### Step 5: Configure Environment Variables in Vercel

- [ ] In project settings, go to "Environment Variables"
- [ ] Add each variable (see [ENV_SETUP.md](./ENV_SETUP.md) for details):

**Required variables:**
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://family-recipes.vercel.app`)
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GEMINI_API_KEY` - From Google AI Studio

**Optional (if using Firestore):**
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY` - Paste multi-line key directly

- [ ] For each variable, select environments:
  - [ ] Production (for main branch)
  - [ ] Preview (for pull requests, if desired)

### Step 6: Deploy

- [ ] Click "Deploy" button
- [ ] Wait for build to complete (2-5 minutes typically)
- [ ] Monitor build logs for errors
- [ ] Note your deployment URL (e.g., `https://family-recipes.vercel.app`)

### Step 7: Update Google OAuth with Production URL

- [ ] Return to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to "APIs & Services" > "Credentials"
- [ ] Edit OAuth 2.0 Client ID
- [ ] Update authorized redirect URI with actual Vercel URL:
  - [ ] `https://[your-actual-url].vercel.app/api/auth/callback/google`
- [ ] Save changes

### Step 8: Verify Deployment

- [ ] Visit your Vercel deployment URL
- [ ] Test Google sign-in:
  - [ ] Click "Sign in with Google"
  - [ ] Verify OAuth flow works correctly
  - [ ] Confirm you're redirected back after authentication
- [ ] Test core features:
  - [ ] Browse recipes
  - [ ] Add recipe to favorites
  - [ ] Generate recipe with AI (if implemented)
  - [ ] Test multi-home features (if implemented)
- [ ] Check Vercel logs for any errors:
  - [ ] Go to Vercel Dashboard > Your Project > Deployments
  - [ ] Click on the deployment > "Logs" tab

### Step 9: Configure Custom Domain (Optional)

- [ ] Go to Vercel Dashboard > Your Project > "Settings" > "Domains"
- [ ] Add your custom domain
- [ ] Follow Vercel's instructions to configure DNS
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Update `NEXTAUTH_URL` environment variable to use custom domain
- [ ] Update Google OAuth redirect URIs to include custom domain
- [ ] Redeploy to apply changes

### Step 10: Set Up GitHub Actions CI (Optional but Recommended)

- [ ] Go to GitHub repository > "Settings" > "Secrets and variables" > "Actions"
- [ ] Add repository secrets (see [ENV_SETUP.md](./ENV_SETUP.md)):
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GEMINI_API_KEY`
  - [ ] (Optional) Firebase credentials
- [ ] Push changes to trigger CI workflow
- [ ] Verify workflow runs successfully in "Actions" tab

## Subsequent Deployments

For updates after initial deployment:

### Option A: Automatic Deployment (Recommended)

Vercel automatically deploys when you push to your configured branch:

- [ ] Make code changes in your worktree
- [ ] Commit changes:
  ```bash
  git add .
  git commit -m "Description of changes"
  ```
- [ ] Push to GitHub:
  ```bash
  git push origin kwak123/next-deploy
  ```
- [ ] Vercel automatically detects the push and deploys
- [ ] Monitor deployment in Vercel Dashboard > Deployments
- [ ] Test the new deployment

### Option B: Manual Deployment via Vercel Dashboard

- [ ] Go to Vercel Dashboard > Your Project > "Deployments"
- [ ] Click "..." menu on latest deployment
- [ ] Select "Redeploy"
- [ ] Confirm redeployment

### Option C: Deploy from CLI

- [ ] Install Vercel CLI:
  ```bash
  npm i -g vercel
  ```
- [ ] Link project (first time only):
  ```bash
  cd /Users/samuelkwak/Desktop/personal-projects/family-recipes/kwak123-next-deploy
  vercel link
  ```
- [ ] Deploy to preview:
  ```bash
  vercel
  ```
- [ ] Deploy to production:
  ```bash
  vercel --prod
  ```

## Updating Environment Variables

When you need to change environment variables:

- [ ] Go to Vercel Dashboard > Your Project > "Settings" > "Environment Variables"
- [ ] Find the variable to update
- [ ] Click "..." > "Edit"
- [ ] Enter new value
- [ ] Save
- [ ] **Important:** Redeploy for changes to take effect:
  - [ ] Go to "Deployments" tab
  - [ ] Click "..." on latest deployment > "Redeploy"

## Rollback Procedures

If a deployment introduces issues:

### Method 1: Instant Rollback via Vercel Dashboard

- [ ] Go to Vercel Dashboard > Your Project > "Deployments"
- [ ] Find the last known good deployment
- [ ] Click "..." menu > "Promote to Production"
- [ ] Confirm promotion
- [ ] Verify rollback by visiting your site

### Method 2: Redeploy Previous Git Commit

- [ ] Identify the last good commit hash:
  ```bash
  git log --oneline
  ```
- [ ] Go to Vercel Dashboard > Deployments
- [ ] Find deployment of that commit
- [ ] Click "..." > "Promote to Production"

### Method 3: Git Revert

- [ ] Revert the problematic commit:
  ```bash
  git revert <commit-hash>
  ```
- [ ] Push to GitHub:
  ```bash
  git push origin kwak123/next-deploy
  ```
- [ ] Vercel automatically deploys the revert

## Monitoring and Maintenance

### Regular Checks

- [ ] Weekly: Review Vercel usage dashboard
  - [ ] Check bandwidth usage (hobby tier: 100 GB/month)
  - [ ] Monitor build execution time (hobby tier: 100 hours/month)
  - [ ] Review function execution time
- [ ] Monthly: Check for dependency updates:
  ```bash
  npm outdated
  npm update
  ```
- [ ] Review Vercel logs for errors or warnings
- [ ] Test critical user flows

### Performance Optimization

- [ ] Enable Vercel Analytics (Settings > Analytics)
- [ ] Review Web Vitals in Vercel dashboard
- [ ] Optimize images if needed (use Next.js Image component)
- [ ] Review bundle size in build logs

## Troubleshooting Common Issues

### Build Fails

**Issue:** Build fails with TypeScript errors
- [ ] Run `npm run build` locally to reproduce
- [ ] Fix TypeScript errors
- [ ] Commit and push

**Issue:** Build fails with missing dependencies
- [ ] Verify all dependencies are in `package.json`
- [ ] Check that `node_modules` is in `.gitignore`
- [ ] Commit updated `package.json` and `package-lock.json`

### Runtime Errors

**Issue:** "Authentication error" on sign-in
- [ ] Verify `NEXTAUTH_SECRET` is set in Vercel
- [ ] Check `NEXTAUTH_URL` matches your deployment URL
- [ ] Confirm Google OAuth redirect URIs include your Vercel URL
- [ ] Check Vercel function logs for detailed errors

**Issue:** API routes timeout
- [ ] Check function execution time in logs (max 10 seconds on hobby tier)
- [ ] Optimize slow API routes
- [ ] Consider moving long-running tasks to background jobs

**Issue:** Environment variable not found
- [ ] Verify variable is set in Vercel dashboard
- [ ] Confirm variable is set for the correct environment (Production/Preview)
- [ ] Redeploy after adding/updating variables

### Preview Deployments

**Issue:** Preview deployment fails
- [ ] Check if environment variables are set for "Preview" environment
- [ ] Verify branch builds locally
- [ ] Check Vercel build logs for specific errors

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Google OAuth is configured with correct redirect URIs only
- [ ] Firebase rules are set up (if using Firestore)
- [ ] CORS is properly configured for production domain
- [ ] No sensitive data in client-side code
- [ ] HTTPS is enforced (automatic with Vercel)

## Support and Resources

If you encounter issues:

- [ ] Check Vercel documentation: https://vercel.com/docs
- [ ] Review Next.js deployment docs: https://nextjs.org/docs/deployment
- [ ] Search Vercel community: https://github.com/vercel/vercel/discussions
- [ ] Check application logs in Vercel dashboard
- [ ] Review this project's documentation files

## Completion

Once deployment is successful:

- [ ] Document your deployment URL
- [ ] Share with intended users (if applicable)
- [ ] Set up monitoring/alerting (if needed)
- [ ] Schedule regular maintenance checks
- [ ] Celebrate your deployment!

---

**Note:** This checklist is comprehensive for first-time deployment. For subsequent deployments, you'll typically only need to push code changes to GitHub, and Vercel will handle the rest automatically.
