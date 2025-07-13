// Mock Next.js Request for Bun compatibility
import { NextRequest as _NextRequest } from 'next/server';

// Mock NextRequest constructor
const mockNextRequest = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string }
) => {
  // Create a mock object that satisfies the NextRequest interface
  const mockRequest = {
    url,
    method: init.method || 'GET',
    headers: new Map(Object.entries(init.headers || {})),
    body: init.body,
    json: async () => JSON.parse(init.body || '{}'),
    text: async () => init.body || '',
  };

  return mockRequest as unknown as _NextRequest; // Use proper type casting for tests
};

// Import after mocking
import { POST } from '@/app/api/chat/route';
import { ModelManager } from '@/core/models/model-manager';
import { GeneralAssistantAgent } from '@/core/agents/general-assistant';

// Mock the model manager and agent
jest.mock('@/core/models/model-manager');
jest.mock('@/core/agents/general-assistant');

describe.skip('Streaming API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle streaming requests', async () => {
    // Mock the streaming response
    const mockStreamResponse = async function* () {
      yield 'Hello';
      yield ' ';
      yield 'World';
      yield '!';
    };

    const mockAgent = {
      streamUserInput: jest.fn().mockResolvedValue(mockStreamResponse()),
      getStatus: jest.fn().mockReturnValue({
        id: 'test-agent',
        name: 'Test Agent',
        initialized: true,
        capabilities: ['test'],
        memoryCount: 0,
      }),
    };

    // Mock the model manager
    const mockModelManager = {
      getProvider: jest.fn().mockReturnValue({
        id: 'test-provider',
        type: 'local',
        getStatus: jest.fn().mockReturnValue({ authenticated: true }),
      }),
      getDefaultModelConfig: jest.fn().mockReturnValue({
        temperature: 0.7,
        maxTokens: 1000,
      }),
    };

    (ModelManager as jest.Mock).mockImplementation(() => mockModelManager);

    // Mock the agent constructor
    (GeneralAssistantAgent as jest.Mock).mockImplementation(() => mockAgent);

    const request = mockNextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        stream: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8'
    );

    // Read the streaming response
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const decoder = new TextDecoder();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('type":"start"');
      expect(fullResponse).toContain('type":"content"');
      expect(fullResponse).toContain('type":"end"');
    }
  });

  it('should handle regular (non-streaming) requests', async () => {
    const mockAgent = {
      processInput: jest.fn().mockResolvedValue({
        id: 'response-1',
        content: 'Test response',
        confidence: 0.9,
        reasoning: 'Test reasoning',
        timestamp: new Date(),
        metadata: {},
      }),
      getStatus: jest.fn().mockReturnValue({
        id: 'test-agent',
        name: 'Test Agent',
        initialized: true,
        capabilities: ['test'],
        memoryCount: 0,
      }),
    };

    // Mock the model manager
    const mockModelManager = {
      getProvider: jest.fn().mockReturnValue({
        id: 'test-provider',
        type: 'local',
        getStatus: jest.fn().mockReturnValue({ authenticated: true }),
      }),
      getDefaultModelConfig: jest.fn().mockReturnValue({
        temperature: 0.7,
        maxTokens: 1000,
      }),
    };

    (ModelManager as jest.Mock).mockImplementation(() => mockModelManager);

    // Mock the agent constructor
    (GeneralAssistantAgent as jest.Mock).mockImplementation(() => mockAgent);

    const request = mockNextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        stream: false,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.response.content).toBe('Test response');
    expect(data.response.confidence).toBe(0.9);
  });

  it('should handle streaming errors gracefully', async () => {
    const mockAgent = {
      streamUserInput: jest
        .fn()
        .mockRejectedValue(new Error('Streaming error')),
      getStatus: jest.fn().mockReturnValue({
        id: 'test-agent',
        name: 'Test Agent',
        initialized: true,
        capabilities: ['test'],
        memoryCount: 0,
      }),
    };

    // Mock the model manager
    const mockModelManager = {
      getProvider: jest.fn().mockReturnValue({
        id: 'test-provider',
        type: 'local',
        getStatus: jest.fn().mockReturnValue({ authenticated: true }),
      }),
      getDefaultModelConfig: jest.fn().mockReturnValue({
        temperature: 0.7,
        maxTokens: 1000,
      }),
    };

    (ModelManager as jest.Mock).mockImplementation(() => mockModelManager);

    // Mock the agent constructor
    (GeneralAssistantAgent as jest.Mock).mockImplementation(() => mockAgent);

    const request = mockNextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
        stream: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Read the streaming response
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const decoder = new TextDecoder();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      const fullResponse = chunks.join('');
      expect(fullResponse).toContain('type":"error"');
      expect(fullResponse).toContain('Streaming error');
    }
  });
});
