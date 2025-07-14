import { NutritionAgent } from '@/core/agents/nutrition-agent';
import {
  MockModelProvider,
  createMockModelConfig,
  createMockUserInput,
} from '../../utils/mocks';
import { ModelConfig, Tool } from '@/core/types';

describe('NutritionAgent', () => {
  let agent: NutritionAgent;
  let mockProvider: MockModelProvider;
  let mockConfig: ModelConfig;

  beforeEach(() => {
    mockProvider = new MockModelProvider();
    mockConfig = createMockModelConfig();
    agent = new NutritionAgent(mockProvider, mockConfig);
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(agent.id).toBe('nutrition-agent');
      expect(agent.name).toBe('Dr. Nutri');
      expect(agent.description).toContain('nutrition and diet expert');
      expect(agent.capabilities).toContain('meal-planning');
      expect(agent.capabilities).toContain('nutrition-analysis');
      expect(agent.capabilities).toContain('dietary-guidance');
      expect(agent.capabilities).toContain('macro-calculation');
      expect(agent.capabilities).toContain('weight-management');
      expect(agent.capabilities).toContain('sports-nutrition');
    });

    it('should have correct system prompt', () => {
      expect(agent.systemPrompt).toContain('Dr. Nutri');
      expect(agent.systemPrompt).toContain('nutrition and diet expert');
      expect(agent.systemPrompt).toContain('meal planning');
      expect(agent.systemPrompt).toContain('Macro and micronutrient');
      expect(agent.systemPrompt).toContain('evidence-based nutrition');
    });

    it('should include collaboration capabilities in system prompt', () => {
      expect(agent.systemPrompt).toContain('fitness agents');
      expect(agent.systemPrompt).toContain('health agents');
      expect(agent.systemPrompt).toContain('multi-agent system');
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);

      await agent.initialize();

      expect(agent.getStatus()).toEqual({
        id: 'nutrition-agent',
        name: 'Dr. Nutri',
        initialized: true,
        capabilities: expect.any(Array),
        memoryCount: expect.any(Number),
      });
    });

    it('should handle initialization errors gracefully', async () => {
      mockProvider.setAvailability(false);

      await agent.initialize();
      expect(agent.getStatus().initialized).toBe(true);
    });

    it('should initialize nutrition-specific tools', async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);

      await agent.initialize();

      const nutritionTool = agent.getTool('nutrition-calculator');
      const mealTimingTool = agent.getTool('meal-timing');

      expect(nutritionTool).toBeDefined();
      expect(nutritionTool?.name).toBe('Nutrition Calculator');
      expect(mealTimingTool).toBeDefined();
      expect(mealTimingTool?.name).toBe('Meal Timing Optimizer');
    });
  });

  describe('Memory Management', () => {
    it('should create nutrition-specific memory structure', () => {
      const memory = agent.createMemory();

      expect(memory.agentId).toBe('nutrition-agent');
      expect(memory.patterns).toEqual({
        preferredMealTypes: 'balanced',
        dietaryRestrictions: [],
        favoriteCuisines: [],
        cookingSkillLevel: 'intermediate',
        mealPrepFrequency: 'weekly',
        budgetRange: 'moderate',
        nutritionGoals: [],
      });
      expect(memory.preferences).toEqual({
        mealPlanDuration: '7-days',
        includeSnacks: true,
        detailedNutritionInfo: true,
        shoppingListFormat: 'categorized',
        recipeComplexity: 'medium',
        preparationTime: 'moderate',
      });
    });
  });

  describe('Specialized Input Processing', () => {
    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      mockProvider.setResponses(['Mock nutrition response']);
      await agent.initialize();
    });

    it('should handle meal plan requests', async () => {
      const input = createMockUserInput({
        content: 'Create a meal plan for weight loss',
      });

      const response = await agent.processSpecializedInput(input);

      expect(response.agentId).toBe('nutrition-agent');
      expect(response.type).toBe('text');
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.metadata?.responseType).toBe('meal-plan');
      expect(response.metadata?.includesNutritionData).toBe(true);
      expect(response.metadata?.includesMealPrep).toBe(true);
    });

    it('should handle nutrition calculation requests', async () => {
      const input = createMockUserInput({
        content: 'Calculate calories and macros for my goals',
      });

      const response = await agent.processSpecializedInput(input);

      expect(response.agentId).toBe('nutrition-agent');
      expect(response.metadata?.responseType).toBe('nutrition-analysis');
      expect(response.metadata?.includesCalculations).toBe(true);
      expect(response.metadata?.includesHealthGuidance).toBe(true);
      expect(response.confidence).toBeGreaterThan(0.9);
    });

    it('should handle recipe requests', async () => {
      const input = createMockUserInput({
        content: 'Give me healthy recipe ideas',
      });

      const response = await agent.processSpecializedInput(input);

      expect(response.metadata?.responseType).toBe('recipe');
      expect(response.metadata?.includesNutrition).toBe(true);
      expect(response.metadata?.includesInstructions).toBe(true);
      expect(response.confidence).toBeGreaterThan(0.8);
    });

    it('should handle shopping list requests', async () => {
      const input = createMockUserInput({
        content: 'Create a grocery shopping list',
      });

      const response = await agent.processSpecializedInput(input);

      expect(response.metadata?.responseType).toBe('shopping-list');
      expect(response.metadata?.categorized).toBe(true);
      expect(response.metadata?.includesQuantities).toBe(true);
      expect(response.metadata?.includesTips).toBe(true);
    });

    it('should fall back to general processing for unrecognized input', async () => {
      const input = createMockUserInput({
        content: 'What is the weather today?',
      });

      const response = await agent.processSpecializedInput(input);

      expect(response.agentId).toBe('nutrition-agent');
      expect(response.type).toBe('text');
      // Should still process through nutrition lens
      expect(response.content).toContain('Mock nutrition response');
    });
  });

  describe('Tools', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let nutritionTool: Tool;
    let mealTimingTool: Tool;

    beforeEach(async () => {
      mockProvider.setAuthenticated(true);
      mockProvider.setAvailability(true);
      await agent.initialize();

      nutritionTool = agent.getTool('nutrition-calculator')!;
      mealTimingTool = agent.getTool('meal-timing')!;
    });

    describe('Nutrition Calculator Tool', () => {
      it('should calculate BMR correctly for males', async () => {
        const params = {
          age: 30,
          gender: 'male',
          weight: 70, // kg
          height: 175, // cm
          activityLevel: 'moderate',
          goal: 'maintain',
        };

        const result = await nutritionTool.execute(params);

        const typedResult = result as any;
        expect(typedResult.bmr).toBeGreaterThan(1600);
        expect(typedResult.bmr).toBeLessThan(1800);
        expect(typedResult.tdee).toBeGreaterThan(typedResult.bmr);
        expect(typedResult.targetCalories).toBe(typedResult.tdee);
        expect(typedResult.macros).toHaveProperty('protein');
        expect(typedResult.macros).toHaveProperty('carbs');
        expect(typedResult.macros).toHaveProperty('fats');
      });

      it('should calculate BMR correctly for females', async () => {
        const params = {
          age: 25,
          gender: 'female',
          weight: 60, // kg
          height: 165, // cm
          activityLevel: 'moderate',
          goal: 'maintain',
        };

        const result = await nutritionTool.execute(params);

        expect(result.bmr).toBeGreaterThan(1300);
        expect(result.bmr).toBeLessThan(1500);
        expect(result.tdee).toBeGreaterThan(result.bmr);
      });

      it('should adjust calories for weight loss goal', async () => {
        const params = {
          age: 30,
          gender: 'male',
          weight: 80,
          height: 180,
          activityLevel: 'moderate',
          goal: 'lose',
        };

        const result = await nutritionTool.execute(params);

        expect(result.targetCalories).toBe(result.tdee - 500);
      });

      it('should adjust calories for weight gain goal', async () => {
        const params = {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'gain',
        };

        const result = await nutritionTool.execute(params);

        expect(result.targetCalories).toBe(result.tdee + 300);
      });

      it('should calculate macros in correct proportions', async () => {
        const params = {
          age: 30,
          gender: 'male',
          weight: 70,
          height: 175,
          activityLevel: 'moderate',
          goal: 'maintain',
        };

        const result = await nutritionTool.execute(params);

        // Extract numeric values from macro strings
        const protein = parseInt(result.macros.protein);
        const carbs = parseInt(result.macros.carbs);
        const fats = parseInt(result.macros.fats);

        // Verify calorie distribution (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
        const totalCalsFromMacros = protein * 4 + carbs * 4 + fats * 9;
        const tolerance = 50; // Allow small rounding differences

        expect(
          Math.abs(totalCalsFromMacros - result.targetCalories)
        ).toBeLessThan(tolerance);
      });
    });

    describe('Meal Timing Tool', () => {
      it('should provide meal timing suggestions', async () => {
        const params = {
          wakeTime: '7:00 AM',
          workoutTime: '6:00 PM',
          workSchedule: '9-5',
          goal: 'muscle gain',
        };

        const result = await mealTimingTool.execute(params);

        expect(result).toHaveProperty('breakfast');
        expect(result).toHaveProperty('preworkout');
        expect(result).toHaveProperty('postworkout');
        expect(result).toHaveProperty('lunch');
        expect(result).toHaveProperty('dinner');
        expect(result).toHaveProperty('snacks');

        expect(result.breakfast).toContain('after waking');
        expect(result.preworkout).toContain('before workout');
        expect(result.postworkout).toContain('after workout');
      });
    });
  });

  describe('Capabilities Description', () => {
    it('should provide comprehensive capabilities description', async () => {
      const description = await agent.getCapabilitiesDescription();

      expect(description).toContain('Dr. Nutri');
      expect(description).toContain('Nutrition & Diet Expert');
      expect(description).toContain('Personalized Meal Planning');
      expect(description).toContain('Nutrition Analysis');
      expect(description).toContain('Weight Management');
      expect(description).toContain('Sports Nutrition');
      expect(description).toContain('Dietary Accommodations');
      expect(description).toContain('Smart Shopping Lists');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid nutrition calculator parameters gracefully', async () => {
      await agent.initialize();
      const nutritionTool = agent.getTool('nutrition-calculator');

      if (!nutritionTool) {
        throw new Error('Nutrition tool not found');
      }

      const invalidParams = {
        age: -5,
        gender: 'unknown',
        weight: 0,
        height: 0,
        activityLevel: 'invalid',
        goal: 'impossible',
      };

      const result = await nutritionTool.execute(invalidParams);

      // Should still return a result structure even with invalid inputs
      expect(result).toHaveProperty('bmr');
      expect(result).toHaveProperty('tdee');
      expect(result).toHaveProperty('targetCalories');
      expect(result).toHaveProperty('macros');
    });

    it('should handle model provider errors in specialized processing', async () => {
      mockProvider.setAvailability(false);
      await agent.initialize();

      const input = createMockUserInput({ content: 'Create a meal plan' });

      // When provider is unavailable, it should throw an error
      await expect(agent.processSpecializedInput(input)).rejects.toThrow(
        'Mock provider is not available'
      );
    });
  });
});
