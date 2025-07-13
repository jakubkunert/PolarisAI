import { 
  TaskPlanner, 
  UserInput, 
  Analysis, 
  ActionPlan, 
  AgentResponse, 
  ActionStep,
  ModelProvider,
  ModelConfig
} from '../types';

export class BasicTaskPlanner implements TaskPlanner {
  private modelProvider: ModelProvider;
  private modelConfig: ModelConfig;
  private agentId: string;
  private systemPrompt: string;
  
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
      const response = await this.modelProvider.generateResponse(analysisPrompt, this.modelConfig);
      const analysis = JSON.parse(response);
      
      return {
        intent: analysis.intent || 'Unknown intent',
        confidence: analysis.confidence || 0.5,
        entities: analysis.entities || {},
        context: analysis.context || {},
        previousConversation: analysis.previousConversation || []
      };
    } catch (error) {
      console.error('Error analyzing task:', error);
      
      // Fallback analysis
      return {
        intent: 'General assistance request',
        confidence: 0.3,
        entities: {},
        context: { domain: 'general', complexity: 'medium', urgency: 'medium' },
        previousConversation: []
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
      const response = await this.modelProvider.generateResponse(planningPrompt, this.modelConfig);
      const plan = JSON.parse(response);
      
      return {
        id: plan.id || `plan_${Date.now()}`,
        steps: plan.steps || [{
          id: 'default_step',
          action: 'Provide helpful response',
          parameters: {},
          dependencies: [],
          estimatedDuration: 1
        }],
        estimatedDuration: plan.estimatedDuration || 1,
        requiresApproval: plan.requiresApproval || false
      };
    } catch (error) {
      console.error('Error creating plan:', error);
      
      // Fallback plan
      return {
        id: `fallback_plan_${Date.now()}`,
        steps: [{
          id: 'fallback_step',
          action: 'Provide general assistance',
          parameters: { intent: analysis.intent },
          dependencies: [],
          estimatedDuration: 2
        }],
        estimatedDuration: 2,
        requiresApproval: false
      };
    }
  }
  
  async executePlan(plan: ActionPlan): Promise<AgentResponse> {
    const executionPrompt = `
${this.systemPrompt}

Execute the following action plan and provide a helpful response:

Plan ID: ${plan.id}
Steps to execute:
${plan.steps.map(step => `
- Step: ${step.action}
- Parameters: ${JSON.stringify(step.parameters)}
`).join('\n')}

Estimated Duration: ${plan.estimatedDuration} minutes
Requires Approval: ${plan.requiresApproval}

Please execute this plan and provide a comprehensive, helpful response to the user. 
Include your reasoning process and be specific about what you're doing.

If the plan requires approval, ask the user for confirmation before proceeding.
`;

    try {
      const response = await this.modelProvider.generateResponse(executionPrompt, this.modelConfig);
      
      // Calculate confidence based on plan complexity and execution
      const confidence = this.calculateConfidence(plan, response);
      
      return {
        id: `response_${Date.now()}`,
        agentId: this.agentId,
        content: response,
        timestamp: new Date(),
        type: 'text',
        confidence: confidence,
        metadata: {
          planId: plan.id,
          stepsExecuted: plan.steps.length,
          estimatedDuration: plan.estimatedDuration
        },
        reasoning: `Analyzed intent, created ${plan.steps.length} step plan, executed with ${Math.round(confidence * 100)}% confidence`
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
        reasoning: 'Error occurred during plan execution, providing fallback response'
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

Execute the following action plan and provide a helpful response:

Plan ID: ${plan.id}
Steps to execute:
${plan.steps.map(step => `
- Step: ${step.action}
- Parameters: ${JSON.stringify(step.parameters)}
`).join('\n')}

Please execute this plan and provide a comprehensive, helpful response to the user. 
Include your reasoning process and be specific about what you're doing.
`;

    try {
      return this.modelProvider.streamResponse(executionPrompt, this.modelConfig);
    } catch (error) {
      console.error('Error streaming execution:', error);
      
      // Return error as async iterable
      return (async function*() {
        yield `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      })();
    }
  }
} 