# Updated Schema: Multi-Home User Model

## Key Changes

### Before:
- Households contained member info
- No separate user identity
- Simple household-centric model

### After:
- **Users** are first-class entities (Google OAuth)
- Users can belong to multiple households
- Households reference users by ID
- Favorites stored per-household (not per-user)

---

## New Collections Structure

### 1. **users** (or dev-users)

Stores authenticated user information from Google OAuth.

```typescript
{
  id: string;                    // Google OAuth user ID
  email: string;                 // Google email
  name: string;                  // Google display name
  picture?: string;              // Google profile picture URL
  createdAt: string;             // ISO string
  lastLoginAt: string;           // ISO string
  householdIds: string[];        // Array of household IDs user belongs to
}
```

**Example:**
```json
{
  "id": "google-oauth-123456",
  "email": "kwak123@gmail.com",
  "name": "Samuel Kwak",
  "picture": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-02-07T12:00:00Z",
  "lastLoginAt": "2026-02-07T18:30:00Z",
  "householdIds": ["household-abc123", "household-def456"]
}
```

---

### 2. **households** (UPDATED)

```typescript
{
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;               // CHANGED: Single owner user ID
  memberIds: string[];           // CHANGED: Array of user IDs
  settings: {
    defaultServings: number;
    preferences: string[];
  };
  favoriteIngredients: string[]; // Household-level (shared by all members)
  favoriteRecipeIds: string[];   // Household-level (shared by all members)
}
```

**Example:**
```json
{
  "id": "household-abc123",
  "name": "Kwak Family",
  "createdAt": "2026-02-07T12:00:00Z",
  "updatedAt": "2026-02-07T18:00:00Z",
  "ownerId": "google-oauth-123456",
  "memberIds": ["google-oauth-123456", "google-oauth-789012"],
  "settings": {
    "defaultServings": 4,
    "preferences": ["healthy", "quick meals"]
  },
  "favoriteIngredients": ["chicken", "broccoli", "garlic"],
  "favoriteRecipeIds": ["recipe-xyz789"]
}
```

---

### 3. **recipes** (UNCHANGED)

```typescript
{
  id: string;
  householdId: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  source: 'ai' | 'manual';
  createdBy: string;             // User ID who created it
  createdAt: string;
  isArchived: boolean;
}
```

---

### 4. **weekPlans** (UNCHANGED)

```typescript
{
  id: string;
  householdId: string;
  weekStartDate: string;
  weekEndDate: string;
  recipes: Array<{
    recipeId: string;
    dayOfWeek: string;
    mealType: string;
    addedBy: string;             // User ID who added it
    addedAt: string;
  }>;
  generatedGroceryList: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}
```

---

## User Flows

### First-Time Login
1. User signs in with Google OAuth
2. `users` record created with OAuth info
3. No households exist yet → show "Create Household" screen
4. User creates first household
5. User becomes owner, added to `memberIds`
6. Household ID added to user's `householdIds`

### Multi-Home User
1. User signs in with Google OAuth
2. App shows household selector: "Which home?"
3. User selects a household
4. Session stores `currentHouseholdId`
5. All operations use that household context
6. User can switch households anytime

### Inviting Members
1. Owner goes to household settings
2. Enters email of user to invite
3. System sends invite link (or just adds them)
4. When invited user logs in:
   - Their user ID added to household's `memberIds`
   - Household ID added to their `householdIds`

---

## TypeScript Interfaces (Updated)

```typescript
// New User interface
export interface User {
  id: string;                    // Google OAuth ID
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
  householdIds: string[];
}

// Updated Household interface
export interface Household {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;               // CHANGED from members object
  memberIds: string[];           // CHANGED: just IDs
  settings: {
    defaultServings: number;
    preferences: string[];
  };
  favoriteIngredients: string[];
  favoriteRecipeIds: string[];
}

// Database structure
export interface Database {
  users: { [id: string]: User };           // NEW
  households: { [id: string]: Household };
  recipes: { [id: string]: Recipe };
  weekPlans: { [id: string]: WeekPlan };
}
```

---

## Session Management

Using NextAuth.js with Google provider:

```typescript
// Session structure
{
  user: {
    id: string;              // Google OAuth ID
    email: string;
    name: string;
    image?: string;
  },
  currentHouseholdId?: string; // Selected household
}
```

---

## UI Components Needed

### 1. **HouseholdSelector Component**
- Dropdown showing all user's households
- "Create New Household" button
- Switch household → updates session

### 2. **AuthGuard Component**
- Wraps protected pages
- Redirects to login if not authenticated
- Shows household selector if no household selected

### 3. **UserMenu Component**
- Shows user profile picture
- Dropdown with:
  - Switch Household
  - Account Settings
  - Sign Out

### 4. **InviteMembers Component**
- Input for email address
- Shows current members
- Owner can remove members

---

## API Changes

### Authentication Required
All API routes now need:
```typescript
import { getServerSession } from 'next-auth';

const session = await getServerSession();
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const userId = session.user.id;
const householdId = session.currentHouseholdId;
```

### New Endpoints

```typescript
// User management
GET  /api/users/me                    // Get current user
POST /api/users/households            // Get user's households

// Household management
POST /api/households                  // Create household
GET  /api/households/:id              // Get household details
PUT  /api/households/:id              // Update household (owner only)
POST /api/households/:id/members      // Add member (owner only)
DELETE /api/households/:id/members/:userId  // Remove member (owner only)

// Session management
POST /api/session/household           // Switch current household
```

---

## Database Operations (Updated)

```typescript
// Create user on first login
export function createUser(
  googleId: string,
  email: string,
  name: string,
  picture?: string
): User {
  const db = readDatabase();
  const user: User = {
    id: googleId,
    email,
    name,
    picture,
    createdAt: now(),
    lastLoginAt: now(),
    householdIds: []
  };
  db.users[user.id] = user;
  writeDatabase(db);
  return user;
}

// Create household (simplified)
export function createHousehold(
  name: string,
  ownerId: string
): Household {
  const db = readDatabase();
  const household: Household = {
    id: generateId('household'),
    name,
    createdAt: now(),
    updatedAt: now(),
    ownerId,
    memberIds: [ownerId],  // Owner is first member
    settings: {
      defaultServings: 4,
      preferences: []
    },
    favoriteIngredients: [],
    favoriteRecipeIds: []
  };

  db.households[household.id] = household;

  // Add household to user's list
  if (db.users[ownerId]) {
    db.users[ownerId].householdIds.push(household.id);
  }

  writeDatabase(db);
  return household;
}

// Add member to household
export function addHouseholdMember(
  householdId: string,
  userId: string
): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  const user = db.users[userId];

  if (!household || !user) {
    throw new Error('Household or user not found');
  }

  if (!household.memberIds.includes(userId)) {
    household.memberIds.push(userId);
    household.updatedAt = now();
  }

  if (!user.householdIds.includes(householdId)) {
    user.householdIds.push(householdId);
  }

  writeDatabase(db);
  return household;
}

// Check if user is owner
export function isHouseholdOwner(
  householdId: string,
  userId: string
): boolean {
  const db = readDatabase();
  const household = db.households[householdId];
  return household?.ownerId === userId;
}

// Check if user is member
export function isHouseholdMember(
  householdId: string,
  userId: string
): boolean {
  const db = readDatabase();
  const household = db.households[householdId];
  return household?.memberIds.includes(userId) || false;
}
```

---

## Migration Notes

### Existing Data
Current `default-household` and `default-user` approach will be replaced with:
1. First real user to log in becomes owner of existing data
2. Or: Dev purge and start fresh with auth

### Development Flow
1. Install and configure NextAuth
2. Set up Google OAuth credentials
3. Update types and database operations
4. Add authentication to API routes
5. Build UI components (HouseholdSelector, UserMenu)
6. Test multi-household switching

---

## Security Considerations

✅ Users can only access households they're members of
✅ Only owners can add/remove members
✅ Only owners can delete households
✅ All members can create recipes and edit week plans
✅ Favorites are household-level (not user-level)
✅ Session validates household access on every request

---

## Next Steps

1. Install NextAuth: `npm install next-auth`
2. Create Google OAuth credentials
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
4. Update `src/lib/types.ts` with User interface
5. Update `src/lib/json-db.ts` with user operations
6. Create NextAuth configuration
7. Add authentication to all API routes
8. Build household selector UI
9. Add user menu with sign out
10. Test multi-household flow
