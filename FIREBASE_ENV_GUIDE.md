# Firebase Environment Variables - Quick Reference

## Current Project Values

Your Firebase service account is already set up:

```bash
FIREBASE_PROJECT_ID=family-recipes-486716
FIREBASE_CLIENT_EMAIL=family-recipes-main@family-recipes-486716.iam.gserviceaccount.com
FIRESTORE_ENV=dev  # or 'prod' for production
```

### Collection Naming Strategy

Collections are automatically suffixed with the environment:

| Environment | Collections |
|-------------|-------------|
| **Local (dev)** | `users_dev`, `households_dev`, `recipes_dev`, `weekPlans_dev` |
| **Production (prod)** | `users_prod`, `households_prod`, `recipes_prod`, `weekPlans_prod` |

This keeps development and production data completely separate in the same Firebase project!

## Getting Your Private Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **family-recipes-486716**
3. Click ⚙️ Settings > **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

The JSON file contains all three values:
```json
{
  "project_id": "family-recipes-486716",
  "client_email": "family-recipes-main@family-recipes-486716.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
}
```

## Setting the Private Key

### Local Development (.env.local)

**Format:** Single line with `\n` as literal characters (backslash + n)

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
```

**How to format:**
1. Open the downloaded JSON file
2. Copy the `private_key` value (it's already formatted correctly)
3. Paste it into `.env.local` with the quotes

**Your .env.local should have:**
```bash
FIREBASE_PROJECT_ID=family-recipes-486716
FIREBASE_CLIENT_EMAIL=family-recipes-main@family-recipes-486716.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...paste the full key here...\n-----END PRIVATE KEY-----\n"
FIRESTORE_ENV=dev
```

### Vercel Deployment

**Format:** Paste the multi-line key WITH actual newlines

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

**FIREBASE_PROJECT_ID**: `family-recipes-486716`
**FIREBASE_CLIENT_EMAIL**: `family-recipes-main@family-recipes-486716.iam.gserviceaccount.com`
**FIRESTORE_ENV**: `prod` (⚠️ Use "prod" for production!)
**FIREBASE_PRIVATE_KEY**: Paste the key with actual line breaks:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
...multiple lines here...
...the actual key content...
-----END PRIVATE KEY-----
```

**DO NOT** use `\n` in Vercel - paste it with real newlines!

Vercel will automatically escape it properly.

### GitHub Actions (CI/CD)

**Format:** Same as `.env.local` - single line with `\n`

1. Go to your GitHub repo
2. **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_PRIVATE_KEY`
5. Value: Single line with `\n` (same format as .env.local)

```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

## Testing Your Configuration

### Test Local Setup

```bash
npm run firestore:test
```

Expected output:
```
✅ Firebase initialized successfully
✅ Firestore connection successful
```

### Test in Code

```typescript
import { getFirestore } from '@/lib/firestore-db';

// This should not throw an error
const db = getFirestore();
```

## Troubleshooting

### Error: "Missing Firebase credentials"

✅ Check all three env vars are set
✅ Verify variable names are exact (case-sensitive)
✅ Check for typos in project ID and email

### Error: "Invalid private key"

✅ Ensure key starts with `"-----BEGIN PRIVATE KEY-----`
✅ Ensure key ends with `-----END PRIVATE KEY-----\n"`
✅ In .env.local: Use `\n` (backslash + n)
✅ In Vercel: Use actual newlines (no `\n`)

### Error: "Permission denied" in Firestore

✅ Verify service account has correct roles
✅ Check Firestore is enabled in Firebase Console
✅ Ensure you're using the right project

## Security Checklist

- [ ] Private key is in `.env.local` (local dev)
- [ ] Private key is in Vercel env vars (production)
- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit the private key to git
- [ ] Downloaded JSON file is stored securely (or deleted after use)
- [ ] Service account has minimum required permissions

## Quick Commands

```bash
# Test Firestore connection
npm run firestore:test

# Migrate data from JSON to Firestore
npm run firestore:migrate

# Run dev server (will use .env.local)
npm run dev

# Build for production (will validate env vars)
npm run build
```

## Environment Variables Summary

| Variable | Local (.env.local) | Vercel | GitHub Actions |
|----------|-------------------|--------|----------------|
| Format | Single line with `\n` | Multi-line | Single line with `\n` |
| Quotes | Required | Optional | Required |
| Newlines | Use `\n` | Use real newlines | Use `\n` |

## Next Steps

1. ✅ Download service account JSON from Firebase
2. ✅ Add `FIREBASE_PRIVATE_KEY` to `.env.local`
3. ✅ Run `npm run firestore:test` to verify
4. ✅ Add all Firebase vars to Vercel (when ready to deploy)
5. ✅ Add to GitHub Secrets (if using CI/CD)

---

**Project:** family-recipes-486716
**Service Account:** family-recipes-main@family-recipes-486716.iam.gserviceaccount.com
