# Google Identity Services (GIS) Setup Guide

## Modern Google Sign-In with GIS

Google Identity Services (GIS) is the new standard for Google authentication, replacing the older OAuth flow.

---

## Steps to Get Google Client ID

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (or select existing)
- Click on the project dropdown at the top
- Click "New Project"
- Name it: "Family Recipes"
- Click "Create"

### 3. Enable Required APIs
- Go to "APIs & Services" → "Library"
- Search for "Google Identity Services API" and enable it
- (Note: You may also see "Google Sign-In" or just enable credential creation directly)

### 4. Configure OAuth Consent Screen
- Go to "APIs & Services" → "OAuth consent screen"
- Select "External" user type
- Click "Create"

**Fill in the required fields:**
- App name: `Family Recipes`
- User support email: `your-email@gmail.com`
- App domain (optional for development)
- Developer contact email: `your-email@gmail.com`
- Click "Save and Continue"

**Scopes (Default is fine for GIS):**
- The basic profile and email scopes are automatically included
- Click "Save and Continue"

**Test users (for development):**
- Add your Gmail address
- Add any other testers
- Click "Save and Continue"

### 5. Create Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- Application type: **"Web application"**
- Name: `Family Recipes Web Client`

**Authorized JavaScript origins:**
Add these URLs (one per line):
```
http://localhost:3000
```

**Authorized redirect URIs:**
For NextAuth with GIS, use:
```
http://localhost:3000/api/auth/callback/google
```

- Click "Create"

### 6. Copy Your Client ID

You'll see a popup with:
- **Client ID**: `123456789-abc...apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-...`

Copy both values!

### 7. Update .env.local

Replace the placeholder values:

```bash
# Google Identity Services
GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### 8. Generate NextAuth Secret

```bash
# macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:
```bash
NEXTAUTH_SECRET=your-generated-secret-here
```

### 9. Verify .env.local

Your complete `.env.local` should look like:

```bash
# Google Gemini API Key
GEMINI_API_KEY=AIzaSyCCHLUuLemCV1LAsomf5x_BelbsJGz6jtU

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-32-byte-base64-string
NEXTAUTH_URL=http://localhost:3000

# Google Identity Services
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

### 10. Restart Dev Server

Stop the current server (Ctrl+C) and restart:
```bash
npm run dev
```

---

## Testing Authentication

1. Go to http://localhost:3000/auth/signin
2. Click "Continue with Google"
3. Select your Google account
4. Grant permissions (email, profile)
5. You should be redirected back to the app

---

## Key Differences: GIS vs Old OAuth

| Feature | Old OAuth | GIS (New) |
|---------|-----------|-----------|
| API | Google+ API | Google Identity Services |
| Button | Custom HTML | Native Google button |
| UX | Multi-step redirect | One-click sign-in |
| Security | OAuth 2.0 | OAuth 2.0 + improved security |
| Maintenance | Deprecated | Actively maintained |

---

## Troubleshooting

### "Popup closed" or "Popup blocked"
- Make sure popups are allowed for localhost:3000
- Try using redirect flow instead of popup

### "Invalid client" error
- Double-check `GOOGLE_CLIENT_ID` has no extra spaces
- Verify it ends with `.apps.googleusercontent.com`
- Ensure `GOOGLE_CLIENT_SECRET` is correct

### "Redirect URI mismatch"
- Verify `http://localhost:3000/api/auth/callback/google` is in authorized redirect URIs
- Check for typos (http vs https, trailing slashes)
- Make sure you're testing on `localhost:3000` not `127.0.0.1:3000`

### "Access blocked: This app's request is invalid"
- Add your email as a test user in OAuth consent screen
- Make sure the OAuth consent screen is configured
- Check that required scopes are not excessive

### Not redirected after sign-in
- Check browser console for errors
- Verify `NEXTAUTH_URL=http://localhost:3000` is set
- Restart dev server after changing .env.local

---

## Production Setup

When deploying to production (e.g., Vercel, Netlify):

### 1. Add Production URLs to Google Cloud Console

Go to your OAuth client credentials and add:

**Authorized JavaScript origins:**
```
https://your-domain.com
```

**Authorized redirect URIs:**
```
https://your-domain.com/api/auth/callback/google
```

### 2. Update Environment Variables

Set these in your hosting platform:
```bash
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=same-secret-as-development
GOOGLE_CLIENT_ID=same-as-development
GOOGLE_CLIENT_SECRET=same-as-development
GEMINI_API_KEY=your-gemini-key
```

### 3. Publish OAuth Consent Screen (Optional)

If you want anyone to sign in (not just test users):
- Go to OAuth consent screen
- Click "Publish App"
- Submit for verification (if needed)

---

## Security Best Practices

✅ **Never commit .env.local to git** (it's already in .gitignore)
✅ **Use different secrets for dev/production**
✅ **Rotate secrets if exposed**
✅ **Restrict OAuth scopes to minimum needed** (email, profile)
✅ **Add only necessary redirect URIs**
✅ **Monitor usage in Google Cloud Console**

---

## NextAuth + GIS Works Seamlessly

NextAuth v5 has built-in support for Google Identity Services. The configuration we've set up automatically uses GIS under the hood when you use the Google provider.

No additional client-side JavaScript libraries needed!
