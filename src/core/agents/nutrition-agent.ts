import { BaseAgent } from './base-agent';
import { BasicTaskPlanner } from './basic-planner';
import {
  LongTermMemory,
  TaskPlanner,
  ModelProvider,
  ModelConfig,
  UserInput,
  AgentResponse,
  Tool,
} from '../types';

export class NutritionAgent extends BaseAgent {
  constructor(modelProvider: ModelProvider, modelConfig: ModelConfig) {
    const systemPrompt = `
You are Dr. Nutri, a specialized nutrition and diet expert AI agent within the PolarisAI multi-agent system. You are a certified nutritionist with deep knowledge of dietetics, meal planning, and healthy eating.

Your specialized expertise includes:
- Personalized meal planning and dietary recommendations
- Macro and micronutrient analysis and optimization
- Weight management strategies (loss, gain, maintenance)
- Sports nutrition and performance optimization
- Dietary restriction accommodations (vegan, keto, gluten-free, etc.)
- Nutritional assessment and goal setting
- Food safety and preparation guidance
- Supplement recommendations and timing
- Hydration and metabolism optimization

Key principles for nutrition guidance:
1. Always prioritize health and safety - never give medical advice
2. Consider individual dietary preferences, restrictions, and allergies
3. Focus on sustainable, evidence-based nutrition practices
4. Provide practical, actionable meal plans and food suggestions
5. Calculate and explain macronutrient breakdowns clearly
6. Consider budget, time constraints, and cooking skill level
7. Emphasize whole foods and balanced nutrition
8. Account for activity level, age, gender, and health goals

When creating meal plans:
- Ask about dietary preferences, restrictions, and allergies
- Determine caloric needs based on goals and activity level
- Provide detailed macro breakdowns (proteins, carbs, fats)
- Include meal timing suggestions for optimal performance
- Suggest portion sizes and preparation methods
- Consider meal prep strategies for busy lifestyles
- Include shopping lists with specific quantities
- Provide nutritional education and rationale

When analyzing nutrition:
- Break down nutritional content of foods and meals
- Identify nutritional gaps or imbalances
- Suggest optimizations for better health outcomes
- Explain the "why" behind recommendations
- Consider bioavailability and nutrient absorption

Collaboration capabilities:
- Work with fitness agents to align nutrition with training goals
- Coordinate with health agents for medical dietary considerations
- Support lifestyle agents with sustainable eating habits
- Assist productivity agents with brain-boosting nutrition

Remember: You provide educational nutrition information, not medical advice. Always recommend consulting healthcare professionals for medical conditions or significant dietary changes.
`;

    super(
      'nutrition-agent',
      'Dr. Nutri',
      'Specialized nutrition and diet expert for meal planning, dietary guidance, and nutritional optimization',
      [
        'meal-planning',
        'nutrition-analysis',
        'dietary-guidance',
        'macro-calculation',
        'weight-management',
        'sports-nutrition',
        'food-safety',
        'supplement-guidance',
        'recipe-suggestions',
        'shopping-lists',
        'dietary-restrictions',
        'nutrition-education',
      ],
      systemPrompt,
      modelProvider,
      modelConfig
    );
  }

  createMemory(): LongTermMemory {
    return {
      userId: '', // Will be set when user context is available
      agentId: this.id,
      memories: [],
      patterns: {
        preferredMealTypes: 'balanced',
        dietaryRestrictions: [],
        favoriteCuisines: [],
        cookingSkillLevel: 'intermediate',
        mealPrepFrequency: 'weekly',
        budgetRange: 'moderate',
        nutritionGoals: [],
      },
      preferences: {
        mealPlanDuration: '7-days',
        includeSnacks: true,
        detailedNutritionInfo: true,
        shoppingListFormat: 'categorized',
        recipeComplexity: 'medium',
        preparationTime: 'moderate',
      },
    };
  }

  createPlanner(): TaskPlanner {
    return new BasicTaskPlanner(
      this.modelProvider,
      this.modelConfig,
      this.id,
      `You are a nutrition planning specialist. Break down nutrition and meal planning tasks into clear, actionable steps.

      Focus on:
      - Understanding user's dietary goals and constraints
      - Creating comprehensive meal plans
      - Calculating nutritional requirements
      - Generating shopping lists and meal prep instructions
      - Providing educational nutrition information`
    );
  }

  protected async initializeTools(): Promise<void> {
    // Nutrition calculation tool
    const nutritionCalculatorTool: Tool = {
      id: 'nutrition-calculator',
      name: 'Nutrition Calculator',
      description: 'Calculate calories, macros, and nutritional values',
      parameters: {
        age: 'number',
        gender: 'string',
        weight: 'number',
        height: 'number',
        activityLevel: 'string',
        goal: 'string', // 'lose', 'gain', 'maintain'
      },
      execute: async (params: Record<string, unknown>) => {
        const { age, gender, weight, height, activityLevel, goal } = params;

        // Basic BMR calculation using Mifflin-St Jeor Equation
        let bmr: number;
        if (gender === 'male') {
          bmr =
            10 * (weight as number) +
            6.25 * (height as number) -
            5 * (age as number) +
            5;
        } else {
          bmr =
            10 * (weight as number) +
            6.25 * (height as number) -
            5 * (age as number) -
            161;
        }

        // Activity multipliers
        const activityMultipliers: Record<string, number> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          'very-active': 1.9,
        };

        const tdee =
          bmr * (activityMultipliers[activityLevel as string] || 1.55);

        // Goal adjustments
        let targetCalories = tdee;
        if (goal === 'lose') {
          targetCalories = tdee - 500; // ~1 lb per week
        } else if (goal === 'gain') {
          targetCalories = tdee + 300; // ~0.6 lb per week
        }

        // Macro calculations (40% carbs, 30% protein, 30% fat for balanced approach)
        const protein = Math.round((targetCalories * 0.3) / 4); // 4 cal per g
        const carbs = Math.round((targetCalories * 0.4) / 4); // 4 cal per g
        const fats = Math.round((targetCalories * 0.3) / 9); // 9 cal per g

        return {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          targetCalories: Math.round(targetCalories),
          macros: {
            protein: `${protein}g`,
            carbs: `${carbs}g`,
            fats: `${fats}g`,
          },
        };
      },
    };

    // Meal timing tool
    const mealTimingTool: Tool = {
      id: 'meal-timing',
      name: 'Meal Timing Optimizer',
      description: 'Suggest optimal meal timing based on lifestyle and goals',
      parameters: {
        wakeTime: 'string',
        workoutTime: 'string',
        workSchedule: 'string',
        goal: 'string',
      },
      execute: async (params: Record<string, unknown>) => {
        const {
          wakeTime: _wakeTime,
          workoutTime: _workoutTime,
          workSchedule: _workSchedule,
          goal: _goal,
        } = params;

        // Basic meal timing suggestions
        return {
          breakfast: '1-2 hours after waking',
          preworkout: '30-60 minutes before workout',
          postworkout: '30-60 minutes after workout',
          lunch: '4-5 hours after breakfast',
          dinner: '3-4 hours before bed',
          snacks: 'Between main meals if needed for goals',
        };
      },
    };

    this.addTool(nutritionCalculatorTool);
    this.addTool(mealTimingTool);
  }

  protected async loadMemory(): Promise<void> {
    // Load user's nutrition preferences and history
    // This would integrate with a persistence layer in a full implementation
  }

  async processSpecializedInput(input: UserInput): Promise<AgentResponse> {
    const content = input.content.toLowerCase();

    // Handle specific nutrition requests
    if (content.includes('meal plan') || content.includes('diet plan')) {
      return this.handleMealPlanRequest(input);
    }

    if (content.includes('calories') || content.includes('macros')) {
      return this.handleNutritionCalculation(input);
    }

    if (content.includes('recipe') || content.includes('cooking')) {
      return this.handleRecipeRequest(input);
    }

    if (content.includes('shopping') || content.includes('grocery')) {
      return this.handleShoppingListRequest(input);
    }

    // Fall back to general nutrition processing
    return this.processInput(input);
  }

  private async handleMealPlanRequest(
    input: UserInput
  ): Promise<AgentResponse> {
    const analysis = await this.analyze(input);
    const _plan = await this.plan(analysis);

    // Enhanced meal plan creation logic
    const response = await this.generateResponse(`
Create a comprehensive meal plan based on: ${input.content}

Include:
1. Daily meal structure (breakfast, lunch, dinner, snacks)
2. Specific food suggestions with portions
3. Macro breakdown for each meal
4. Total daily nutrition summary
5. Meal prep tips and timing
6. Substitution options for dietary restrictions

Format as a clear, actionable daily meal plan.
`);

    return {
      id: `response_${Date.now()}`,
      agentId: this.id,
      content: response,
      timestamp: new Date(),
      type: 'text',
      confidence: 0.9,
      reasoning: `Generated comprehensive meal plan addressing user's specific dietary needs and preferences`,
      metadata: {
        responseType: 'meal-plan',
        includesNutritionData: true,
        includesMealPrep: true,
      },
    };
  }

  private async handleNutritionCalculation(
    input: UserInput
  ): Promise<AgentResponse> {
    const response = await this.generateResponse(`
Provide detailed nutrition analysis for: ${input.content}

Include:
1. Caloric content breakdown
2. Macronutrient distribution (protein, carbs, fats)
3. Key micronutrients and vitamins
4. Health benefits and considerations
5. Suggestions for optimization
6. Portion size recommendations

Be specific with numbers and explain the significance of each nutrient.
`);

    return {
      id: `response_${Date.now()}`,
      agentId: this.id,
      content: response,
      timestamp: new Date(),
      type: 'text',
      confidence: 0.95,
      reasoning: `Provided comprehensive nutritional analysis with specific calculations and health insights`,
      metadata: {
        responseType: 'nutrition-analysis',
        includesCalculations: true,
        includesHealthGuidance: true,
      },
    };
  }

  private async handleRecipeRequest(input: UserInput): Promise<AgentResponse> {
    const response = await this.generateResponse(`
Create healthy recipe suggestions for: ${input.content}

Include:
1. Complete ingredient list with quantities
2. Step-by-step preparation instructions
3. Nutritional information per serving
4. Cooking time and difficulty level
5. Storage and meal prep instructions
6. Healthy substitution options
7. Tips for flavor enhancement

Focus on nutritionally balanced, practical recipes.
`);

    return {
      id: `response_${Date.now()}`,
      agentId: this.id,
      content: response,
      timestamp: new Date(),
      type: 'text',
      confidence: 0.85,
      reasoning: `Generated practical healthy recipes with complete nutritional guidance and preparation instructions`,
      metadata: {
        responseType: 'recipe',
        includesNutrition: true,
        includesInstructions: true,
      },
    };
  }

  private async handleShoppingListRequest(
    input: UserInput
  ): Promise<AgentResponse> {
    const response = await this.generateResponse(`
Create an organized shopping list for: ${input.content}

Organize by:
1. Fresh produce (fruits, vegetables)
2. Proteins (meat, fish, plant-based)
3. Dairy and alternatives
4. Pantry staples and grains
5. Healthy snacks and beverages
6. Supplements (if needed)

Include:
- Specific quantities needed
- Quality selection tips
- Budget-friendly alternatives
- Seasonal/local options when possible
- Storage tips for optimal freshness

Format as a practical, printable shopping list.
`);

    return {
      id: `response_${Date.now()}`,
      agentId: this.id,
      content: response,
      timestamp: new Date(),
      type: 'text',
      confidence: 0.9,
      reasoning: `Generated organized shopping list with quantities, quality tips, and practical organization`,
      metadata: {
        responseType: 'shopping-list',
        categorized: true,
        includesQuantities: true,
        includesTips: true,
      },
    };
  }

  async getCapabilitiesDescription(): Promise<string> {
    return `
🥗 **Dr. Nutri - Nutrition & Diet Expert**

**Specialized Capabilities:**
• 🍽️ **Personalized Meal Planning** - Custom meal plans for any dietary goal
• 📊 **Nutrition Analysis** - Detailed macro/micro nutrient breakdowns
• ⚖️ **Weight Management** - Sustainable strategies for any weight goal
• 🏃‍♂️ **Sports Nutrition** - Performance-optimized nutrition plans
• 🌱 **Dietary Accommodations** - Expert guidance for all dietary restrictions
• 🧮 **Macro Calculations** - Precise calorie and macronutrient targets
• 🛒 **Smart Shopping Lists** - Organized, budget-friendly grocery planning
• 👨‍🍳 **Healthy Recipes** - Nutritious, practical meal ideas
• 💊 **Supplement Guidance** - Evidence-based supplementation advice
• 📚 **Nutrition Education** - Clear explanations of nutritional science

**Perfect for:**
- Creating comprehensive meal plans
- Optimizing nutrition for fitness goals
- Managing dietary restrictions
- Learning about healthy eating
- Planning efficient grocery shopping
- Understanding nutritional science

Ready to transform your relationship with food and nutrition! 🌟
`;
  }
}
