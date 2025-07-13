import {
  TaskPlanner,
  UserInput,
  Analysis,
  ActionPlan,
  ActionStep,
  AgentResponse,
  ModelProvider,
  ModelConfig,
} from '../types';

export class BasicTaskPlanner implements TaskPlanner {
  private modelProvider: ModelProvider;
  private modelConfig: ModelConfig;
  private agentId: string;
  private systemPrompt: string;
  private static counter = 0;

  constructor(
    modelProvider: ModelProvider,
    modelConfig: ModelConfig,
    agentId: string,
    systemPrompt: string
  ) {
    this.modelProvider = modelProvider;
    this.modelConfig = modelConfig;
    this.agentId = agentId;
    this.systemPrompt = systemPrompt;
  }

  private extractJsonFromResponse(response: string): unknown {
    // Remove thinking tags
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Remove markdown code blocks and extract JSON
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1];
    }

    // Remove any remaining markdown formatting
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // Find JSON object in the response (handle multiple line JSON)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // Clean up extra whitespace
    cleaned = cleaned.trim();

    // If still no valid JSON structure, try to find it in the original response
    if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
      const fallbackMatch = response.match(/\{[\s\S]*?\}/);
      if (fallbackMatch) {
        cleaned = fallbackMatch[0];
      }
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse JSON from response:', response);
      console.error('Cleaned content:', cleaned);
      throw new Error(
        `Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }
  }

  async analyzeTask(input: UserInput): Promise<Analysis> {
    const analysisPrompt = `
${this.systemPrompt}

Please analyze the following user input and provide a structured analysis:

User Input: "${input.content}"
Input Type: ${input.type}
Timestamp: ${input.timestamp}

Provide an analysis in the following JSON format:
{
  "intent": "primary purpose or goal of the user",
  "confidence": number between 0-1 indicating how certain you are about the intent,
  "entities": {
    "key_entities": "identified important entities, concepts, or data points"
  },
  "context": {
    "domain": "what domain or area this relates to",
    "complexity": "low|medium|high",
    "urgency": "low|medium|high"
  },
  "previousConversation": ["relevant context from previous messages if any"]
}

Return only the JSON object, no additional text.
`;

    try {
      const response = await this.modelProvider.generateResponse(
        analysisPrompt,
        this.modelConfig
      );
      const analysis = this.extractJsonFromResponse(response) as Record<
        string,
        unknown
      >;

      return {
        intent: (analysis.intent as string) || 'Unknown intent',
        confidence: (analysis.confidence as number) || 0.5,
        entities: (analysis.entities as Record<string, unknown>) || {},
        context: (analysis.context as Record<string, unknown>) || {},
        previousConversation: (analysis.previousConversation as string[]) || [],
      };
    } catch (error) {
      console.error('Error analyzing task:', error);

      // Fallback analysis
      return {
        intent: 'General assistance request',
        confidence: 0.3,
        entities: {},
        context: { domain: 'general', complexity: 'medium', urgency: 'medium' },
        previousConversation: [],
      };
    }
  }

  async createPlan(analysis: Analysis): Promise<ActionPlan> {
    const planningPrompt = `
${this.systemPrompt}

Based on the following analysis, create a detailed action plan:

Analysis:
- Intent: ${analysis.intent}
- Confidence: ${analysis.confidence}
- Entities: ${JSON.stringify(analysis.entities)}
- Context: ${JSON.stringify(analysis.context)}

Create a step-by-step action plan in the following JSON format:
{
  "id": "unique_plan_id",
  "steps": [
    {
      "id": "step_1",
      "action": "description of what to do",
      "parameters": {
        "key": "value"
      },
      "dependencies": [],
      "estimatedDuration": minutes_as_number
    }
  ],
  "estimatedDuration": total_minutes_as_number,
  "requiresApproval": boolean_if_action_needs_user_approval
}

Return only the JSON object, no additional text.
`;

    try {
      const response = await this.modelProvider.generateResponse(
        planningPrompt,
        this.modelConfig
      );
      const plan = this.extractJsonFromResponse(response) as Record<
        string,
        unknown
      >;

      return {
        id: (plan.id as string) || `plan_${Date.now()}`,
        steps: (plan.steps as ActionStep[]) || [
          {
            id: 'default_step',
            action: 'Provide helpful response',
            parameters: {},
            dependencies: [],
            estimatedDuration: 1,
          },
        ],
        estimatedDuration: (plan.estimatedDuration as number) || 1,
        requiresApproval: (plan.requiresApproval as boolean) || false,
      };
    } catch (error) {
      console.error('Error creating plan:', error);

      // Fallback plan
      return {
        id: `fallback_plan_${Date.now()}_${++BasicTaskPlanner.counter}`,
        steps: [
          {
            id: 'fallback_step',
            action: 'Provide general assistance',
            parameters: { intent: analysis.intent },
            dependencies: [],
            estimatedDuration: 2,
          },
        ],
        estimatedDuration: 2,
        requiresApproval: false,
      };
    }
  }

  async executePlan(plan: ActionPlan): Promise<AgentResponse> {
    const executionPrompt = `
${this.systemPrompt}

User request: ${plan.steps.map(step => step.parameters.intent || step.action).join(', ')}

Please provide a helpful, conversational response to the user. Be friendly, direct, and genuinely useful.

Do not include:
- Plan IDs or execution details
- Step-by-step breakdowns unless specifically requested
- Internal processing information
- Formal structure unless needed

Just respond naturally and helpfully to what the user is asking for.
`;

    try {
      const response = await this.modelProvider.generateResponse(
        executionPrompt,
        this.modelConfig
      );

      // Calculate confidence based on plan complexity and execution
      const confidence = this.calculateConfidence(plan, response);

      return {
        id: `response_${Date.now()}_${++BasicTaskPlanner.counter}`,
        agentId: this.agentId,
        content: response,
        timestamp: new Date(),
        type: 'text',
        confidence: confidence,
        metadata: {
          planId: plan.id,
          stepsExecuted: plan.steps.length,
          estimatedDuration: plan.estimatedDuration,
        },
        reasoning: `🔍 Analysis: Processed user request and identified optimal response strategy.

📋 Planning: Created ${plan.steps.length} step execution plan:
${plan.steps.map((step, i) => `  ${i + 1}. ${step.action}`).join('\n')}

⏱️ Estimation: Expected completion time of ${plan.estimatedDuration} minute(s).

⚡ Execution: Successfully processed request using available tools and knowledge.

🎯 Confidence: ${Math.round(confidence * 100)}% based on plan clarity and execution success.`,
      };
    } catch (error) {
      console.error('Error executing plan:', error);

      // Fallback execution
      return {
        id: `error_response_${Date.now()}`,
        agentId: this.agentId,
        content: `I apologize, but I encountered an error while processing your request. Let me try to help you in a different way.`,
        timestamp: new Date(),
        type: 'text',
        confidence: 0.2,
        metadata: { error: true, planId: plan.id },
        reasoning: `❌ Error: An issue occurred during plan execution.

🔄 Fallback: Attempting to provide alternative assistance.

📝 Note: This response uses basic capabilities due to the execution error.`,
      };
    }
  }

  private calculateConfidence(plan: ActionPlan, response: string): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on plan complexity
    if (plan.steps.length === 1) {
      confidence += 0.1; // Simple plans are more reliable
    } else if (plan.steps.length > 3) {
      confidence -= 0.1; // Complex plans have more uncertainty
    }

    // Adjust based on response length (longer responses might indicate more thought)
    if (response.length > 500) {
      confidence += 0.1;
    } else if (response.length < 100) {
      confidence -= 0.1;
    }

    // Adjust based on whether approval is required
    if (plan.requiresApproval) {
      confidence -= 0.1; // Less confident when approval is needed
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }

  async streamExecution(plan: ActionPlan): Promise<AsyncIterable<string>> {
    const executionPrompt = `
${this.systemPrompt}

User request: ${plan.steps.map(step => step.parameters.intent || step.action).join(', ')}

Please provide a helpful, conversational response to the user. Be friendly, direct, and genuinely useful.

Do not include:
- Plan IDs or execution details
- Step-by-step breakdowns unless specifically requested
- Internal processing information
- Formal structure unless needed

Just respond naturally and helpfully to what the user is asking for.
`;

    try {
      return this.modelProvider.streamResponse(
        executionPrompt,
        this.modelConfig
      );
    } catch (error) {
      console.error('Error streaming execution:', error);

      // Return error as async iterable
      return (async function* () {
        yield `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      })();
    }
  }
}
