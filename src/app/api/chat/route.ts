import { NextRequest, NextResponse } from 'next/server';
import { ModelManager } from '@/core/models/model-manager';
import { GeneralAssistantAgent } from '@/core/agents/general-assistant';
import { UserInput } from '@/core/types';

// Initialize the model manager
const modelManager = new ModelManager();
let generalAgent: GeneralAssistantAgent | null = null;

async function initializeAgent(providerId?: string, apiKey?: string) {
  // Reset agent if we're switching providers
  if (generalAgent && providerId) {
    generalAgent = null;
  }

  if (!generalAgent) {
    let provider;

    if (providerId) {
      // Use specific provider
      provider = modelManager.getProvider(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      // Authenticate if API key is provided
      if (apiKey) {
        const success = await modelManager.authenticateProvider(providerId, apiKey);
        if (!success) {
          throw new Error(`Failed to authenticate with ${providerId}`);
        }
      }
    } else {
      // Try to get an already authenticated provider
      provider = await modelManager.getBestAvailableProvider();

      if (!provider) {
        // If no authenticated provider, get any available provider
        const availableProviders = modelManager.getAvailableProviders();
        if (availableProviders.length === 0) {
          throw new Error('No model providers available');
        }
        provider = availableProviders[0]; // Use first available provider
      }
    }

    // Check if provider is authenticated (for remote providers)
    if (provider.type === 'remote' && !provider.getStatus().authenticated) {
      throw new Error(`Provider ${provider.id} requires authentication. Please provide an API key.`);
    }

    const config = modelManager.getDefaultModelConfig();
    generalAgent = new GeneralAssistantAgent(provider, config);

    // Initialize the agent
    await generalAgent.initialize();
  }

  return generalAgent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, provider, apiKey } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize the agent with provider and API key if provided
    const agent = await initializeAgent(provider, apiKey);

    // Create user input
    const userInput: UserInput = {
      id: `input_${Date.now()}`,
      content: message,
      timestamp: new Date(),
      type: 'text',
      metadata: {}
    };

    // Process the input
    const response = await agent.processInput(userInput);

    // Return the response
    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        confidence: response.confidence,
        reasoning: response.reasoning,
        timestamp: response.timestamp,
        metadata: response.metadata
      },
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.getStatus()
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get provider status
    const status = await modelManager.getProvidersStatus();
    const availableProviders = modelManager.getAvailableProviders();

    return NextResponse.json({
      success: true,
      providers: availableProviders.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: status[p.id]
      })),
      agent: generalAgent ? {
        id: generalAgent.id,
        name: generalAgent.name,
        status: generalAgent.getStatus()
      } : null
    });

  } catch (error) {
    console.error('Chat API status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
