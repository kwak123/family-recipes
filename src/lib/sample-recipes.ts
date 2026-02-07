import { Recipe } from './types';

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Quick Veggie Stir-Fry',
    description: 'A fast and healthy vegetarian stir-fry with colorful vegetables and savory sauce.',
    cookTimeMinutes: 20,
    servings: 4,
    ingredients: [
      { name: 'broccoli', quantity: 2, unit: 'cups' },
      { name: 'bell pepper', quantity: 2, unit: 'whole' },
      { name: 'carrots', quantity: 2, unit: 'whole' },
      { name: 'soy sauce', quantity: 3, unit: 'tbsp' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
      { name: 'ginger', quantity: 1, unit: 'tbsp' },
      { name: 'rice', quantity: 2, unit: 'cups' },
      { name: 'sesame oil', quantity: 1, unit: 'tbsp' }
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Chop all vegetables into bite-sized pieces.',
      'Heat sesame oil in a large wok or skillet over high heat.',
      'Add minced garlic and ginger, stir for 30 seconds.',
      'Add harder vegetables (carrots, broccoli) and cook 3-4 minutes.',
      'Add bell peppers and cook 2 more minutes.',
      'Pour in soy sauce, toss everything together.',
      'Serve hot over rice.'
    ],
    tags: ['vegetarian', 'quick', 'healthy', 'Asian']
  },
  {
    id: '2',
    name: 'Classic Spaghetti Bolognese',
    description: 'Rich and hearty Italian meat sauce served over pasta.',
    cookTimeMinutes: 45,
    servings: 6,
    ingredients: [
      { name: 'ground beef', quantity: 1, unit: 'lb' },
      { name: 'spaghetti', quantity: 1, unit: 'lb' },
      { name: 'onion', quantity: 1, unit: 'whole' },
      { name: 'garlic', quantity: 4, unit: 'cloves' },
      { name: 'crushed tomatoes', quantity: 28, unit: 'oz' },
      { name: 'tomato paste', quantity: 2, unit: 'tbsp' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { name: 'dried basil', quantity: 1, unit: 'tsp' },
      { name: 'dried oregano', quantity: 1, unit: 'tsp' },
      { name: 'parmesan cheese', quantity: 1, unit: 'cup' }
    ],
    instructions: [
      'Heat olive oil in a large pot over medium heat.',
      'Add diced onion and cook until soft, about 5 minutes.',
      'Add minced garlic and cook 1 minute.',
      'Add ground beef, breaking it up with a spoon. Cook until browned.',
      'Stir in tomato paste, crushed tomatoes, basil, and oregano.',
      'Simmer on low heat for 30 minutes, stirring occasionally.',
      'Meanwhile, cook spaghetti according to package directions.',
      'Serve sauce over pasta, topped with parmesan cheese.'
    ],
    tags: ['Italian', 'meat', 'comfort-food']
  },
  {
    id: '3',
    name: 'Sheet Pan Lemon Herb Chicken',
    description: 'Easy one-pan chicken with roasted vegetables.',
    cookTimeMinutes: 40,
    servings: 4,
    ingredients: [
      { name: 'chicken thighs', quantity: 8, unit: 'pieces' },
      { name: 'potatoes', quantity: 4, unit: 'whole' },
      { name: 'lemon', quantity: 2, unit: 'whole' },
      { name: 'green beans', quantity: 1, unit: 'lb' },
      { name: 'olive oil', quantity: 3, unit: 'tbsp' },
      { name: 'garlic', quantity: 4, unit: 'cloves' },
      { name: 'fresh rosemary', quantity: 2, unit: 'tbsp' },
      { name: 'fresh thyme', quantity: 1, unit: 'tbsp' }
    ],
    instructions: [
      'Preheat oven to 425°F.',
      'Cut potatoes into quarters.',
      'Arrange chicken and vegetables on a large sheet pan.',
      'Drizzle with olive oil and lemon juice.',
      'Sprinkle with minced garlic, rosemary, thyme, salt, and pepper.',
      'Roast for 35-40 minutes until chicken is cooked through.',
      'Serve hot with lemon wedges.'
    ],
    tags: ['meat', 'easy', 'healthy', 'one-pan']
  },
  {
    id: '4',
    name: 'Creamy Tomato Basil Soup',
    description: 'Comforting vegetarian soup perfect with grilled cheese.',
    cookTimeMinutes: 30,
    servings: 6,
    ingredients: [
      { name: 'crushed tomatoes', quantity: 28, unit: 'oz' },
      { name: 'onion', quantity: 1, unit: 'whole' },
      { name: 'garlic', quantity: 4, unit: 'cloves' },
      { name: 'vegetable broth', quantity: 2, unit: 'cups' },
      { name: 'heavy cream', quantity: 1, unit: 'cup' },
      { name: 'fresh basil', quantity: 1, unit: 'cup' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { name: 'butter', quantity: 2, unit: 'tbsp' }
    ],
    instructions: [
      'Heat olive oil and butter in a large pot over medium heat.',
      'Add diced onion and cook until soft, 5-7 minutes.',
      'Add minced garlic and cook 1 minute.',
      'Pour in crushed tomatoes and vegetable broth.',
      'Simmer for 15 minutes.',
      'Add fresh basil leaves.',
      'Use an immersion blender to puree until smooth.',
      'Stir in heavy cream and season with salt and pepper.',
      'Serve hot with crusty bread.'
    ],
    tags: ['vegetarian', 'soup', 'comfort-food']
  },
  {
    id: '5',
    name: 'Teriyaki Salmon Bowl',
    description: 'Healthy glazed salmon with rice and vegetables.',
    cookTimeMinutes: 25,
    servings: 4,
    ingredients: [
      { name: 'salmon fillets', quantity: 4, unit: 'pieces' },
      { name: 'soy sauce', quantity: 4, unit: 'tbsp' },
      { name: 'honey', quantity: 2, unit: 'tbsp' },
      { name: 'rice vinegar', quantity: 1, unit: 'tbsp' },
      { name: 'rice', quantity: 2, unit: 'cups' },
      { name: 'broccoli', quantity: 2, unit: 'cups' },
      { name: 'carrots', quantity: 2, unit: 'whole' },
      { name: 'sesame seeds', quantity: 1, unit: 'tbsp' }
    ],
    instructions: [
      'Cook rice according to package directions.',
      'Mix soy sauce, honey, and rice vinegar to make teriyaki sauce.',
      'Heat a skillet over medium-high heat.',
      'Cook salmon skin-side down for 4-5 minutes.',
      'Flip and brush with teriyaki sauce. Cook 4 more minutes.',
      'Steam broccoli and sliced carrots until tender.',
      'Serve salmon over rice with vegetables.',
      'Drizzle with remaining sauce and sprinkle with sesame seeds.'
    ],
    tags: ['seafood', 'healthy', 'quick', 'Asian']
  },
  {
    id: '6',
    name: 'Slow-Cooked Beef Chili',
    description: 'Rich and spicy chili that gets better with time.',
    cookTimeMinutes: 180,
    servings: 8,
    ingredients: [
      { name: 'ground beef', quantity: 2, unit: 'lb' },
      { name: 'kidney beans', quantity: 30, unit: 'oz' },
      { name: 'crushed tomatoes', quantity: 28, unit: 'oz' },
      { name: 'onion', quantity: 2, unit: 'whole' },
      { name: 'bell pepper', quantity: 2, unit: 'whole' },
      { name: 'garlic', quantity: 6, unit: 'cloves' },
      { name: 'chili powder', quantity: 3, unit: 'tbsp' },
      { name: 'cumin', quantity: 2, unit: 'tsp' },
      { name: 'beef broth', quantity: 1, unit: 'cup' }
    ],
    instructions: [
      'Brown ground beef in a large pot over medium-high heat. Drain excess fat.',
      'Add diced onions and bell peppers, cook until soft.',
      'Add minced garlic and cook 1 minute.',
      'Stir in chili powder and cumin.',
      'Add crushed tomatoes, drained kidney beans, and beef broth.',
      'Bring to a boil, then reduce to low simmer.',
      'Cook for 2-3 hours, stirring occasionally.',
      'Serve with sour cream, cheese, and cornbread.'
    ],
    tags: ['meat', 'slow-cook', 'comfort-food', 'spicy']
  },
  {
    id: '7',
    name: 'Mushroom Risotto',
    description: 'Creamy Italian rice dish with earthy mushrooms.',
    cookTimeMinutes: 35,
    servings: 4,
    ingredients: [
      { name: 'arborio rice', quantity: 1.5, unit: 'cups' },
      { name: 'mushrooms', quantity: 1, unit: 'lb' },
      { name: 'onion', quantity: 1, unit: 'whole' },
      { name: 'garlic', quantity: 3, unit: 'cloves' },
      { name: 'vegetable broth', quantity: 6, unit: 'cups' },
      { name: 'white wine', quantity: 0.5, unit: 'cup' },
      { name: 'parmesan cheese', quantity: 1, unit: 'cup' },
      { name: 'butter', quantity: 3, unit: 'tbsp' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' }
    ],
    instructions: [
      'Heat vegetable broth in a separate pot and keep warm.',
      'Heat olive oil and 1 tbsp butter in a large pan.',
      'Add sliced mushrooms and cook until golden. Set aside.',
      'In the same pan, sauté diced onion until soft.',
      'Add minced garlic and arborio rice. Toast for 2 minutes.',
      'Pour in white wine and stir until absorbed.',
      'Add broth one ladle at a time, stirring constantly until absorbed before adding more.',
      'Continue for 20-25 minutes until rice is creamy and tender.',
      'Stir in mushrooms, remaining butter, and parmesan.',
      'Serve immediately.'
    ],
    tags: ['vegetarian', 'Italian', 'comfort-food']
  },
  {
    id: '8',
    name: 'Greek Chicken Pita Wraps',
    description: 'Fresh and flavorful Mediterranean chicken wraps.',
    cookTimeMinutes: 20,
    servings: 4,
    ingredients: [
      { name: 'chicken breast', quantity: 1.5, unit: 'lb' },
      { name: 'pita bread', quantity: 4, unit: 'whole' },
      { name: 'cucumber', quantity: 1, unit: 'whole' },
      { name: 'tomatoes', quantity: 2, unit: 'whole' },
      { name: 'red onion', quantity: 0.5, unit: 'whole' },
      { name: 'feta cheese', quantity: 1, unit: 'cup' },
      { name: 'greek yogurt', quantity: 1, unit: 'cup' },
      { name: 'lemon', quantity: 1, unit: 'whole' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp' },
      { name: 'garlic', quantity: 2, unit: 'cloves' },
      { name: 'dried oregano', quantity: 1, unit: 'tsp' }
    ],
    instructions: [
      'Cut chicken into bite-sized pieces.',
      'Season with oregano, salt, pepper, and drizzle with olive oil.',
      'Cook chicken in a hot skillet until cooked through, about 8-10 minutes.',
      'Dice cucumber, tomatoes, and thinly slice red onion.',
      'Mix Greek yogurt with minced garlic and lemon juice for sauce.',
      'Warm pita bread.',
      'Assemble wraps with chicken, vegetables, feta, and yogurt sauce.',
      'Fold and serve immediately.'
    ],
    tags: ['meat', 'quick', 'healthy', 'Mediterranean']
  }
];
