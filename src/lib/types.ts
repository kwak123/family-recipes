export interface User {
  id: string; // Google OAuth ID
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
  householdIds: string[];
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
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
  createdBy: string;
  createdAt: string; // ISO string for JSON compatibility
  isArchived: boolean;
}

export interface Household {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string; // User ID of owner
  memberIds: string[]; // Array of user IDs
  settings: {
    defaultServings: number;
    preferences: string[];
  };
  favoriteIngredients: string[];
  favoriteRecipeIds: string[];
}

export interface WeekPlanRecipe {
  recipeId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  addedBy: string;
  addedAt: string; // ISO string
}

export interface GroceryItem {
  name: string;
  totalQuantity: number;
  unit: string;
  checkedOff?: boolean;
}

export interface WeekPlan {
  id: string;
  householdId: string;
  weekStartDate: string; // "2026-02-10"
  weekEndDate: string; // "2026-02-16"
  recipes: WeekPlanRecipe[];
  generatedGroceryList: GroceryItem[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Database collections structure
export interface Database {
  users: { [id: string]: User };
  households: { [id: string]: Household };
  recipes: { [id: string]: Recipe };
  weekPlans: { [id: string]: WeekPlan };
}
