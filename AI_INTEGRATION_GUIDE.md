# AI Integration Guide

This guide explains how to integrate an AI provider (Claude, GPT, etc.) to generate recipes based on user preferences.

---

## Overview

The prompt system is designed to:
1. Take user preferences as free-form text
2. Send a structured prompt to an AI model
3. Receive a JSON response matching our `Recipe` interface
4. Validate and return the recipes

---

## Files Created

- **`src/lib/recipe-prompt.ts`** - Contains the system prompt, validation logic, and integration template

---

## The Prompt Structure

### System Prompt
Defines the AI's role and exact output format. Key features:
- Specifies JSON-only output (no markdown, no explanations)
- Provides exact TypeScript interface structure
- Includes guidelines for realistic recipes
- Sets expectations for ingredient formatting, units, etc.

### User Prompt
Dynamically built from user input:
- If empty: generates diverse weekly recipes
- If provided: tailors recipes to preferences

---

## Integration Options

### Option 1: Claude API (Recommended for Quality)

```bash
npm install @anthropic-ai/sdk
```

```typescript
// src/lib/ai-providers/claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from '../types';
import { RECIPE_GENERATION_SYSTEM_PROMPT, buildUserPrompt, validateRecipes } from '../recipe-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateRecipesWithClaude(preferences: string): Promise<Recipe[]> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    temperature: 0.7,
    system: RECIPE_GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(preferences)
      }
    ]
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  try {
    const recipes = JSON.parse(responseText);

    if (!validateRecipes(recipes)) {
      throw new Error('Invalid recipe format from AI');
    }

    return recipes;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('AI returned invalid JSON');
  }
}
```

**Environment variable:**
```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
```

---

### Option 2: OpenAI API

```bash
npm install openai
```

```typescript
// src/lib/ai-providers/openai.ts
import OpenAI from 'openai';
import { Recipe } from '../types';
import { RECIPE_GENERATION_SYSTEM_PROMPT, buildUserPrompt, validateRecipes } from '../recipe-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRecipesWithOpenAI(preferences: string): Promise<Recipe[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" }, // Forces JSON output
    messages: [
      {
        role: 'system',
        content: RECIPE_GENERATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: buildUserPrompt(preferences)
      }
    ]
  });

  const responseText = completion.choices[0].message.content || '[]';

  try {
    const recipes = JSON.parse(responseText);

    if (!validateRecipes(recipes)) {
      throw new Error('Invalid recipe format from AI');
    }

    return recipes;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('AI returned invalid JSON');
  }
}
```

**Environment variable:**
```bash
# .env.local
OPENAI_API_KEY=your_api_key_here
```

---

### Option 3: Local LLM (Ollama)

```bash
# Install Ollama: https://ollama.ai
ollama pull llama2
```

```typescript
// src/lib/ai-providers/ollama.ts
import { Recipe } from '../types';
import { RECIPE_GENERATION_SYSTEM_PROMPT, buildUserPrompt, validateRecipes } from '../recipe-prompt';

export async function generateRecipesWithOllama(preferences: string): Promise<Recipe[]> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama2',
      prompt: `${RECIPE_GENERATION_SYSTEM_PROMPT}\n\nUser: ${buildUserPrompt(preferences)}`,
      stream: false,
      format: 'json'
    })
  });

  const data = await response.json();
  const recipes = JSON.parse(data.response);

  if (!validateRecipes(recipes)) {
    throw new Error('Invalid recipe format from AI');
  }

  return recipes;
}
```

---

## Update the API Route

Replace the stub in `src/app/api/recipes/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateRecipesWithClaude } from '@/lib/ai-providers/claude';
// OR: import { generateRecipesWithOpenAI } from '@/lib/ai-providers/openai';
// OR: import { generateRecipesWithOllama } from '@/lib/ai-providers/ollama';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;

    // Replace stub with real AI call
    const recipes = await generateRecipesWithClaude(preferences || '');

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipes' },
      { status: 500 }
    );
  }
}
```

---

## Testing the Prompt

### Test with Example Prompts

```typescript
import { EXAMPLE_PROMPTS } from '@/lib/recipe-prompt';

// Test different scenarios:
console.log(EXAMPLE_PROMPTS.vegetarian);
// "vegetarian meals, no meat or seafood"

console.log(EXAMPLE_PROMPTS.quick);
// "quick meals under 30 minutes, easy weeknight dinners"
```

### Manual Testing

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000
3. Try these inputs:
   - "vegetarian Italian pasta dishes"
   - "quick 20-minute meals for busy weeknights"
   - "keto low-carb high-protein meals"
   - "family-friendly comfort food"
   - "Asian stir-fry recipes"

---

## Expected AI Response Format

```json
[
  {
    "id": "recipe-1",
    "name": "Quick Veggie Pasta",
    "description": "A fast and delicious vegetarian pasta with fresh vegetables.",
    "cookTimeMinutes": 25,
    "servings": 4,
    "ingredients": [
      { "name": "pasta", "quantity": 1, "unit": "lb" },
      { "name": "olive oil", "quantity": 2, "unit": "tbsp" },
      { "name": "garlic", "quantity": 3, "unit": "cloves" },
      { "name": "cherry tomatoes", "quantity": 2, "unit": "cups" },
      { "name": "spinach", "quantity": 3, "unit": "cups" },
      { "name": "parmesan cheese", "quantity": 0.5, "unit": "cup" }
    ],
    "instructions": [
      "Bring a large pot of salted water to boil and cook pasta according to package directions.",
      "While pasta cooks, heat olive oil in a large skillet over medium heat.",
      "Add minced garlic and cook for 30 seconds until fragrant.",
      "Add cherry tomatoes and cook for 5 minutes until they start to burst.",
      "Add spinach and cook until wilted, about 2 minutes.",
      "Drain pasta and toss with the vegetable mixture.",
      "Top with parmesan cheese and serve immediately."
    ],
    "tags": ["vegetarian", "quick", "Italian", "pasta", "healthy"]
  }
]
```

---

## Cost Estimates

### Claude API (Anthropic)
- Model: `claude-3-5-sonnet-20241022`
- Cost: ~$0.015-0.03 per recipe generation
- Quality: Excellent, follows instructions precisely

### OpenAI API
- Model: `gpt-4-turbo-preview`
- Cost: ~$0.02-0.04 per recipe generation
- Quality: Excellent, good at structured output

### Ollama (Local)
- Cost: Free (runs locally)
- Quality: Good, but may need prompt tuning
- Speed: Slower than APIs

---

## Error Handling

The validation function checks:
- ✅ Response is an array
- ✅ Each recipe has all required fields
- ✅ Field types match TypeScript interface
- ✅ Nested objects (ingredients, instructions) are valid

If validation fails, the API returns a 500 error and logs details.

---

## Advanced: Prompt Tuning

### To increase recipe quality:

1. **Add constraints to system prompt:**
   ```
   - Recipes must use common ingredients available at standard grocery stores
   - Avoid exotic or hard-to-find ingredients
   - Prioritize recipes under 60 minutes unless user requests slow-cook
   ```

2. **Add example recipes in system prompt:**
   ```
   Here's an example of a well-formatted recipe:
   {
     "id": "example-1",
     "name": "Classic Tomato Soup",
     ...
   }
   ```

3. **Adjust temperature:**
   - Lower (0.3-0.5): More consistent, less creative
   - Higher (0.7-0.9): More creative, more variety

4. **Add user preference parsing:**
   ```typescript
   function parsePreferences(input: string) {
     const hasDiet = /vegetarian|vegan|keto|paleo/i.test(input);
     const hasSpeed = /quick|fast|slow|easy/i.test(input);
     const hasCuisine = /italian|asian|mexican|indian/i.test(input);

     return {
       diet: hasDiet ? input.match(/vegetarian|vegan|keto|paleo/i)?.[0] : null,
       speed: hasSpeed ? input.match(/quick|fast|slow|easy/i)?.[0] : null,
       cuisine: hasCuisine ? input.match(/italian|asian|mexican|indian/i)?.[0] : null
     };
   }
   ```

---

## Next Steps

1. Choose your AI provider (Claude, OpenAI, or Ollama)
2. Install the SDK: `npm install @anthropic-ai/sdk` or `npm install openai`
3. Set up your API key in `.env.local`
4. Create the provider file (e.g., `src/lib/ai-providers/claude.ts`)
5. Update the API route to use real AI instead of sample data
6. Test with various user inputs
7. Monitor costs and quality
8. Tune the prompt based on results

---

## Troubleshooting

**AI returns markdown instead of JSON:**
- Make sure system prompt emphasizes "no markdown, no code blocks"
- For OpenAI, use `response_format: { type: "json_object" }`

**Validation fails:**
- Log the raw AI response to see what's wrong
- Check if field names match exactly (case-sensitive)
- Ensure numbers are numbers, not strings

**Recipes are low quality:**
- Lower temperature for consistency
- Add more specific guidelines to system prompt
- Provide example recipes in the prompt

**API costs too high:**
- Cache common preference queries
- Use a cheaper model for simple requests
- Consider Ollama for development
