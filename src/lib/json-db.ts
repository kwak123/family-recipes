import fs from 'fs';
import path from 'path';
import { Database, User, Household, Recipe, WeekPlan, GroceryItem } from './types';
import { aggregateIngredients } from '@/utils/grocery';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

/**
 * Initialize empty database structure
 */
function getEmptyDatabase(): Database {
  return {
    users: {},
    households: {},
    recipes: {},
    weekPlans: {}
  };
}

/**
 * Read database from JSON file
 */
function readDatabase(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const emptyDb = getEmptyDatabase();
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb, null, 2));
      return emptyDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as Database;
  } catch (error) {
    console.error('Error reading database:', error);
    return getEmptyDatabase();
  }
}

/**
 * Write database to JSON file
 */
function writeDatabase(db: Database): void {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw new Error('Failed to write to database');
  }
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function now(): string {
  return new Date().toISOString();
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export function getUser(userId: string): User | null {
  const db = readDatabase();
  if (!db.users) {
    console.error('Database users collection is undefined');
    return null;
  }
  return db.users[userId] || null;
}

export function createUser(
  googleId: string,
  email: string,
  name: string,
  picture?: string
): User {
  const db = readDatabase();

  // Ensure users collection exists
  if (!db.users) {
    db.users = {};
  }

  const user: User = {
    id: googleId,
    email,
    name,
    picture,
    createdAt: now(),
    lastLoginAt: now(),
    householdIds: [],
    homeInvites: []
  };

  db.users[user.id] = user;
  writeDatabase(db);
  return user;
}

export function updateUserLastLogin(userId: string): User {
  const db = readDatabase();
  const user = db.users[userId];
  if (!user) {
    throw new Error('User not found');
  }

  user.lastLoginAt = now();
  writeDatabase(db);
  return user;
}

export function getUserHouseholds(userId: string): Household[] {
  const db = readDatabase();
  const user = db.users[userId];
  if (!user) return [];

  return user.householdIds
    .map(id => db.households[id])
    .filter(h => h !== undefined);
}

export function getUserByEmail(email: string): User | null {
  const db = readDatabase();
  return Object.values(db.users).find(user => user.email === email) || null;
}

export function setCurrentHome(userId: string, homeId: string): User {
  const db = readDatabase();
  const user = db.users[userId];
  if (!user) {
    throw new Error('User not found');
  }

  // Verify user has access to this home
  if (!user.householdIds.includes(homeId)) {
    throw new Error('User does not have access to this home');
  }

  user.currentHomeId = homeId;
  writeDatabase(db);
  return user;
}

export function sendHomeInvite(homeId: string, invitedByUserId: string, inviteeEmail: string): { success: boolean; message: string } {
  const db = readDatabase();
  const home = db.households[homeId];
  const invitedByUser = db.users[invitedByUserId];

  if (!home || !invitedByUser) {
    throw new Error('Home or user not found');
  }

  // Verify inviter has access to the home
  if (!home.memberIds.includes(invitedByUserId)) {
    throw new Error('You do not have permission to invite users to this home');
  }

  // Find user by email
  const invitee = getUserByEmail(inviteeEmail);
  if (!invitee) {
    return { success: false, message: 'No user found with that email address' };
  }

  // Check if already a member
  if (home.memberIds.includes(invitee.id)) {
    return { success: false, message: 'User is already a member of this home' };
  }

  // Check if already invited
  if (!invitee.homeInvites) {
    invitee.homeInvites = [];
  }

  if (invitee.homeInvites.includes(homeId)) {
    return { success: false, message: 'User has already been invited to this home' };
  }

  // Add invite
  invitee.homeInvites.push(homeId);
  writeDatabase(db);

  return { success: true, message: `Invite sent to ${invitee.name}` };
}

export function getUserInvites(userId: string): Household[] {
  const db = readDatabase();
  const user = db.users[userId];
  if (!user || !user.homeInvites) return [];

  return user.homeInvites
    .map(id => db.households[id])
    .filter(h => h !== undefined);
}

export function acceptHomeInvite(userId: string, homeId: string): Household {
  const db = readDatabase();
  const user = db.users[userId];
  const home = db.households[homeId];

  if (!user || !home) {
    throw new Error('User or home not found');
  }

  // Verify user has been invited
  if (!user.homeInvites || !user.homeInvites.includes(homeId)) {
    throw new Error('No invite found for this home');
  }

  // Add user to home
  if (!home.memberIds.includes(userId)) {
    home.memberIds.push(userId);
    home.updatedAt = now();
  }

  // Add home to user's list
  if (!user.householdIds.includes(homeId)) {
    user.householdIds.push(homeId);
  }

  // Remove invite
  user.homeInvites = user.homeInvites.filter(id => id !== homeId);

  writeDatabase(db);
  return home;
}

export function declineHomeInvite(userId: string, homeId: string): void {
  const db = readDatabase();
  const user = db.users[userId];

  if (!user) {
    throw new Error('User not found');
  }

  if (user.homeInvites) {
    user.homeInvites = user.homeInvites.filter(id => id !== homeId);
    writeDatabase(db);
  }
}

// ============================================================================
// HOUSEHOLD OPERATIONS
// ============================================================================

export function getHousehold(householdId: string): Household | null {
  const db = readDatabase();
  return db.households[householdId] || null;
}

export function createHousehold(name: string, ownerId: string): Household {
  const db = readDatabase();
  const household: Household = {
    id: generateId('household'),
    name,
    createdAt: now(),
    updatedAt: now(),
    ownerId,
    memberIds: [ownerId],
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

export function updateHousehold(householdId: string, updates: Partial<Household>): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  if (!household) {
    throw new Error('Household not found');
  }

  db.households[householdId] = {
    ...household,
    ...updates,
    updatedAt: now()
  };

  writeDatabase(db);
  return db.households[householdId];
}

export function addFavoriteRecipe(householdId: string, recipeId: string): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  if (!household) {
    throw new Error('Household not found');
  }

  if (!household.favoriteRecipeIds.includes(recipeId)) {
    household.favoriteRecipeIds.push(recipeId);
    household.updatedAt = now();
    writeDatabase(db);
  }

  return household;
}

export function removeFavoriteRecipe(householdId: string, recipeId: string): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  if (!household) {
    throw new Error('Household not found');
  }

  household.favoriteRecipeIds = household.favoriteRecipeIds.filter(id => id !== recipeId);
  household.updatedAt = now();
  writeDatabase(db);
  return household;
}

export function addFavoriteIngredient(householdId: string, ingredient: string): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  if (!household) {
    throw new Error('Household not found');
  }

  const normalizedIngredient = ingredient.toLowerCase().trim();
  if (!household.favoriteIngredients.includes(normalizedIngredient)) {
    household.favoriteIngredients.push(normalizedIngredient);
    household.updatedAt = now();
    writeDatabase(db);
  }

  return household;
}

export function removeFavoriteIngredient(householdId: string, ingredient: string): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  if (!household) {
    throw new Error('Household not found');
  }

  const normalizedIngredient = ingredient.toLowerCase().trim();
  household.favoriteIngredients = household.favoriteIngredients.filter(
    i => i !== normalizedIngredient
  );
  household.updatedAt = now();
  writeDatabase(db);
  return household;
}

export function addHouseholdMember(householdId: string, userId: string): Household {
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

export function removeHouseholdMember(householdId: string, userId: string): Household {
  const db = readDatabase();
  const household = db.households[householdId];
  const user = db.users[userId];

  if (!household) {
    throw new Error('Household not found');
  }

  // Can't remove owner
  if (household.ownerId === userId) {
    throw new Error('Cannot remove household owner');
  }

  household.memberIds = household.memberIds.filter(id => id !== userId);
  household.updatedAt = now();

  if (user) {
    user.householdIds = user.householdIds.filter(id => id !== householdId);
  }

  writeDatabase(db);
  return household;
}

export function isHouseholdOwner(householdId: string, userId: string): boolean {
  const db = readDatabase();
  const household = db.households[householdId];
  return household?.ownerId === userId;
}

export function isHouseholdMember(householdId: string, userId: string): boolean {
  const db = readDatabase();
  const household = db.households[householdId];
  return household?.memberIds.includes(userId) || false;
}

// ============================================================================
// RECIPE OPERATIONS
// ============================================================================

export function getRecipe(recipeId: string): Recipe | null {
  const db = readDatabase();
  return db.recipes[recipeId] || null;
}

export function getRecipesByHousehold(householdId: string, includeArchived = false): Recipe[] {
  const db = readDatabase();
  return Object.values(db.recipes)
    .filter(recipe =>
      recipe.householdId === householdId &&
      (includeArchived || !recipe.isArchived)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFavoriteRecipes(householdId: string): Recipe[] {
  const household = getHousehold(householdId);
  if (!household) return [];

  const db = readDatabase();
  return household.favoriteRecipeIds
    .map(id => db.recipes[id])
    .filter(recipe => recipe && !recipe.isArchived);
}

export function saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Recipe {
  const db = readDatabase();
  const newRecipe: Recipe = {
    ...recipe,
    id: generateId('recipe'),
    createdAt: now()
  };

  db.recipes[newRecipe.id] = newRecipe;
  writeDatabase(db);
  return newRecipe;
}

export function saveRecipes(recipes: Omit<Recipe, 'createdAt'>[]): Recipe[] {
  const db = readDatabase();
  const savedRecipes: Recipe[] = [];

  for (const recipe of recipes) {
    const newRecipe: Recipe = {
      ...recipe,
      createdAt: now()
    };
    db.recipes[newRecipe.id] = newRecipe;
    savedRecipes.push(newRecipe);
  }

  writeDatabase(db);
  return savedRecipes;
}

export function updateRecipe(recipeId: string, updates: Partial<Recipe>): Recipe {
  const db = readDatabase();
  const recipe = db.recipes[recipeId];
  if (!recipe) {
    throw new Error('Recipe not found');
  }

  db.recipes[recipeId] = {
    ...recipe,
    ...updates
  };

  writeDatabase(db);
  return db.recipes[recipeId];
}

export function archiveRecipe(recipeId: string): Recipe {
  return updateRecipe(recipeId, { isArchived: true });
}

// ============================================================================
// WEEK PLAN OPERATIONS
// ============================================================================

export function getWeekPlan(householdId: string, weekStartDate: string): WeekPlan | null {
  const db = readDatabase();
  return Object.values(db.weekPlans).find(
    plan => plan.householdId === householdId && plan.weekStartDate === weekStartDate
  ) || null;
}

export function getCurrentWeekPlan(householdId: string): WeekPlan | null {
  const weekStart = getCurrentWeekStart();
  return getWeekPlan(householdId, weekStart);
}

export function createWeekPlan(householdId: string, weekStartDate: string): WeekPlan {
  const db = readDatabase();
  const weekEndDate = getWeekEnd(weekStartDate);

  const weekPlan: WeekPlan = {
    id: generateId('weekplan'),
    householdId,
    weekStartDate,
    weekEndDate,
    recipes: [],
    generatedGroceryList: [],
    createdAt: now(),
    updatedAt: now()
  };

  db.weekPlans[weekPlan.id] = weekPlan;
  writeDatabase(db);
  return weekPlan;
}

export function addRecipeToWeekPlan(
  householdId: string,
  recipeId: string,
  dayOfWeek: WeekPlanRecipe['dayOfWeek'],
  mealType: WeekPlanRecipe['mealType'],
  addedBy: string
): WeekPlan {
  const weekStart = getCurrentWeekStart();
  let weekPlan = getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    weekPlan = createWeekPlan(householdId, weekStart);
  }

  // Check if recipe exists
  const recipe = getRecipe(recipeId);
  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Add recipe to week plan
  weekPlan.recipes.push({
    recipeId,
    dayOfWeek,
    mealType,
    addedBy,
    addedAt: now()
  });

  // Regenerate grocery list
  const recipeIds = weekPlan.recipes.map(r => r.recipeId);
  const recipes = recipeIds.map(id => getRecipe(id)).filter(r => r !== null) as Recipe[];
  weekPlan.generatedGroceryList = aggregateIngredients(recipes);

  weekPlan.updatedAt = now();

  const db = readDatabase();
  db.weekPlans[weekPlan.id] = weekPlan;
  writeDatabase(db);

  return weekPlan;
}

export function removeRecipeFromWeekPlan(
  householdId: string,
  recipeId: string
): WeekPlan {
  const weekStart = getCurrentWeekStart();
  const weekPlan = getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    throw new Error('Week plan not found');
  }

  // Remove recipe
  weekPlan.recipes = weekPlan.recipes.filter(r => r.recipeId !== recipeId);

  // Regenerate grocery list
  const recipeIds = weekPlan.recipes.map(r => r.recipeId);
  const recipes = recipeIds.map(id => getRecipe(id)).filter(r => r !== null) as Recipe[];
  weekPlan.generatedGroceryList = aggregateIngredients(recipes);

  weekPlan.updatedAt = now();

  const db = readDatabase();
  db.weekPlans[weekPlan.id] = weekPlan;
  writeDatabase(db);

  return weekPlan;
}

export function updateGroceryItemChecked(
  householdId: string,
  ingredientName: string,
  checked: boolean
): WeekPlan {
  const weekStart = getCurrentWeekStart();
  const weekPlan = getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    throw new Error('Week plan not found');
  }

  const item = weekPlan.generatedGroceryList.find(
    i => i.name.toLowerCase() === ingredientName.toLowerCase()
  );

  if (item) {
    item.checkedOff = checked;
    weekPlan.updatedAt = now();

    const db = readDatabase();
    db.weekPlans[weekPlan.id] = weekPlan;
    writeDatabase(db);
  }

  return weekPlan;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}

// ============================================================================
// DEV OPERATIONS
// ============================================================================

export function purgeDatabase(): void {
  const emptyDb = getEmptyDatabase();
  writeDatabase(emptyDb);
}

export function getDatabaseStats() {
  const db = readDatabase();
  return {
    users: Object.keys(db.users).length,
    households: Object.keys(db.households).length,
    recipes: Object.keys(db.recipes).length,
    weekPlans: Object.keys(db.weekPlans).length
  };
}
