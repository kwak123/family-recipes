# Invite-Only User Access System Setup

This document explains how to bootstrap and use the invite-only user access system.

## Overview

The Family Recipes app now restricts access to invited users only. Admin users control who can join the app by sending invites.

## Features

- **Invite-Only Access**: Only users with pending invites can create accounts
- **Admin Control**: Admin users send and manage invites
- **Not Allowed Page**: Non-invited users see a clear message explaining access is restricted
- **Automatic Registration**: Invited users are automatically registered when they sign in

## First-Time Setup: Creating Your First Admin

When you first deploy the app, you'll need to manually create at least one admin user. Follow these steps:

### Method 1: Manual Database Edit (Recommended for Local Development)

1. **Sign in with your Google account** (this will create a user record, but you won't have access yet due to no invite)

2. **Stop the development server** (Ctrl+C)

3. **Edit the database file** at `data/db.json`:
   ```json
   {
     "users": {
       "your-google-id": {
         "id": "your-google-id",
         "email": "your-email@gmail.com",
         "name": "Your Name",
         "isAdmin": true,  // ← Add this line
         "createdAt": "2026-02-22T...",
         "lastLoginAt": "2026-02-22T...",
         "householdIds": [],
         "homeInvites": []
       }
     }
   }
   ```

4. **Restart the development server**:
   ```bash
   npm run dev
   ```

5. **Verify admin access** by visiting:
   ```
   http://localhost:3000/admin/invites
   ```

### Method 2: Bootstrap Script (Alternative)

If you prefer automation, create a script to bootstrap the admin:

```bash
# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create bootstrap-admin.ts
cat > scripts/bootstrap-admin.ts << 'EOF'
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@gmail.com';

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// Find user by email
const user = Object.values(db.users).find((u: any) => u.email === ADMIN_EMAIL);

if (!user) {
  console.error(`User with email ${ADMIN_EMAIL} not found. Sign in first.`);
  process.exit(1);
}

// Set isAdmin flag
(user as any).isAdmin = true;

// Write back to database
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log(`✓ Admin privileges granted to ${ADMIN_EMAIL}`);
EOF

# Run the script
ADMIN_EMAIL="your-email@gmail.com" npx tsx scripts/bootstrap-admin.ts
```

### Method 3: Firestore (Production)

For Firestore deployments:

1. **Sign in once** to create your user document in Firestore

2. **Open Firebase Console**:
   - Go to https://console.firebase.google.com/
   - Select your project
   - Navigate to Firestore Database

3. **Find your user document**:
   - Collection: `users_prod` (or `users_dev` for development)
   - Find your document by email

4. **Add the `isAdmin` field**:
   - Click on your user document
   - Click "Add field"
   - Field name: `isAdmin`
   - Type: boolean
   - Value: true
   - Click "Add"

5. **Verify admin access** by visiting `/admin/invites`

## Using the Invite System

### Sending Invites (Admin Users)

1. **Navigate to the admin panel**:
   ```
   /admin/invites
   ```

2. **Enter the email address** of the user you want to invite

3. **Click "Send Invite"**

4. **The user will now be able to sign in** using that email address

### Inviting Multiple Users

You can send multiple invites. Each invite is independent:

- Invites are stored by email address
- One pending invite per email address
- Duplicate invites are prevented
- Invites cannot be sent to existing users

### Revoking Invites

1. **Go to `/admin/invites`**

2. **Find the invite** in the "Pending Invites" list

3. **Click "Revoke"** next to the invite

4. **Confirm** the action

The user will no longer be able to sign in with that email.

### User Sign-In Flow

**For Invited Users:**
1. User clicks "Sign in with Google"
2. User authenticates with Google
3. System checks for pending invite
4. If invite exists: user account created, invite marked as accepted
5. User gains access to the app

**For Non-Invited Users:**
1. User clicks "Sign in with Google"
2. User authenticates with Google
3. System checks for pending invite
4. If no invite: redirected to `/auth/not-allowed`
5. User sees message explaining access is restricted

## Security Notes

- **New users are never admin**: The `isAdmin` flag is always `false` for new signups
- **Admin privilege escalation**: Only manual database edits can create new admins
- **Email verification**: Handled automatically by Google OAuth
- **Invite enumeration**: Pending invites are only visible to admin users

## Troubleshooting

### "Access Restricted" page after first sign-in

This is expected behavior. You need to:
1. Stop the server
2. Edit the database to add `isAdmin: true` to your user
3. Restart the server

### Can't access `/admin/invites` after setting isAdmin

1. Clear your browser cookies/cache
2. Sign out completely
3. Sign back in
4. Verify `isAdmin: true` in the database

### User with invite sees "Access Restricted"

Check that:
- The invite email matches the Google account email exactly
- The invite status is `pending` (not `accepted` or `declined`)
- The invite exists in the database (`userInvites` collection)

### Database migration for existing users

If you have existing users before implementing the invite system:

**JSON DB:**
```json
{
  "users": {
    "existing-user-id": {
      // ... existing fields
      "isAdmin": false  // Add this to all existing users
    }
  }
}
```

All existing users will be able to continue signing in (they're already in the database). Only NEW users will need invites.

## API Reference

### GET /api/admin/invites
List all pending invites (admin only)

**Response:**
```json
[
  {
    "id": "user@example.com",
    "email": "user@example.com",
    "invitedBy": "admin-user-id",
    "invitedAt": "2026-02-22T12:00:00.000Z",
    "status": "pending",
    "inviterName": "Admin Name"
  }
]
```

### POST /api/admin/invites
Send a new invite (admin only)

**Request:**
```json
{
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "invite": {
    "id": "newuser@example.com",
    "email": "newuser@example.com",
    "invitedBy": "admin-user-id",
    "invitedAt": "2026-02-22T12:00:00.000Z",
    "status": "pending"
  }
}
```

### DELETE /api/admin/invites
Revoke an invite (admin only)

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invite revoked"
}
```

## Database Schema

### UserInvite Type
```typescript
interface UserInvite {
  id: string;           // email address (unique)
  email: string;
  invitedBy: string;    // admin user ID
  invitedAt: string;    // ISO timestamp
  status: 'pending' | 'accepted' | 'declined';
  acceptedAt?: string;
}
```

### User Type (Updated)
```typescript
interface User {
  // ... existing fields
  isAdmin?: boolean;  // Admin permission flag
}
```

### Database Collections
- **JSON DB**: `data/db.json` → `userInvites` object
- **Firestore**: `userInvites_dev` / `userInvites_prod` collection

## Rollback Instructions

If you need to disable the invite system and allow open signup:

1. **Edit `src/lib/auth.ts`**:
   ```typescript
   // Around line 13-44, replace the signIn callback with:
   async signIn({ user, account, profile }) {
     if (!user.email || !account?.providerAccountId) {
       return false;
     }

     const userId = account.providerAccountId;
     let dbUser = getUser(userId);

     if (!dbUser) {
       dbUser = createUser(
         userId,
         user.email,
         user.name || user.email,
         user.image || undefined
       );
     } else {
       updateUserLastLogin(dbUser.id);
     }

     return true;
   }
   ```

2. **Restart the server**

This will restore the original behavior where any Google user can sign in and create an account.
