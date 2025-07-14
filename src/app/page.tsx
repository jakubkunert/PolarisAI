'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Checkbox,
  useToast,
  MarkdownRenderer,
} from '@/components/ui';
import { usePersistedConfig } from '@/lib/hooks/usePersistedConfig';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent';
  timestamp: Date;
  confidence?: number;
  reasoning?: string;
  metadata?: Record<string, unknown>;
  isStreaming?: boolean;
  // Add agent identification
  agentId?: string;
  agentName?: string;
  // Add model identification
  modelProvider?: string;
  modelName?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  initialized: boolean;
  capabilities: string[];
  memoryCount: number;
}

interface Provider {
  id: string;
  name: string;
  type: 'local' | 'remote';
  status: Record<string, unknown>;
}

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  category: string;
  icon: string;
}

// Icon components
const SettingsIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const SendIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const BotIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('general-assistant');
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [openaiModels, setOpenaiModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Track if models have been fetched for current session
  const modelsFetchedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const { showToast, ToastContainer } = useToast();

  const {
    config,
    updateConfig,
    isLoaded,
    clearConfig,
    toggleRememberSettings,
  } = usePersistedConfig();

  useEffect(() => {
    fetchStatus();
    fetchAvailableAgents();
  }, []);

  const fetchOllamaModels = useCallback(async (force = false) => {
    // Use current values from the closure
    const currentProvider = config.selectedProvider;
    const currentModel = config.selectedOllamaModel;

    if (!force && currentProvider !== 'ollama') return;

    // Skip if already fetched and models exist, unless forced
    if (!force && modelsFetchedRef.current && ollamaModels.length > 0) {
      console.log('⏭️ Skipping Ollama models fetch - already have models');
      return;
    }

    // Prevent rapid successive calls (debounce for 2 seconds), unless forced
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2000) {
      console.log(
        '⏭️ Skipping Ollama models fetch - too soon since last fetch'
      );
      return;
    }

    console.log('🔄 Fetching Ollama models...');
    lastFetchTimeRef.current = now;

    setLoadingModels(true);
    try {
      const response = await fetch('/api/chat?action=get-ollama-models', {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success && data.models && data.models.length > 0) {
        setOllamaModels(data.models);
        modelsFetchedRef.current = true;
        console.log('✅ Ollama models fetched successfully:', data.models);

        // If no model is selected but models are available, select the first one
        if (!currentModel && data.models.length > 0) {
          updateConfig({ selectedOllamaModel: data.models[0] });
        }
      } else {
        console.warn('⚠️ No Ollama models found or API returned no data');
        setOllamaModels([]);
        modelsFetchedRef.current = false;
      }
    } catch (error) {
      console.error('❌ Failed to fetch Ollama models:', error);
      setOllamaModels([]);
      modelsFetchedRef.current = false;
    } finally {
      setLoadingModels(false);
    }
  }, [
    config.selectedProvider,
    config.selectedOllamaModel,
    updateConfig,
    ollamaModels.length,
  ]);

  const fetchOpenAIModels = useCallback(async (force = false) => {
    const currentProvider = config.selectedProvider;

    if (!force && currentProvider !== 'openai') return;

    // Skip if already fetched and models exist, unless forced
    if (!force && openaiModels.length > 0) {
      console.log('⏭️ Skipping OpenAI models fetch - already have models');
      return;
    }

    console.log('🔄 Fetching OpenAI models...');

    setLoadingModels(true);
    try {
      const response = await fetch('/api/chat?action=get-openai-models', {
        method: 'PUT',
      });
      const data = await response.json();

      if (data.success && data.models && data.models.length > 0) {
        setOpenaiModels(data.models);
        console.log('✅ OpenAI models fetched successfully:', data.models);

        // If no model is selected but models are available, select the first one
        if (!config.selectedOpenAIModel && data.models.length > 0) {
          updateConfig({ selectedOpenAIModel: data.models[0] });
        }
      } else {
        console.warn('⚠️ No OpenAI models found or API returned no data');
        setOpenaiModels([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch OpenAI models:', error);
      setOpenaiModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, [
    config.selectedProvider,
    config.selectedOpenAIModel,
    updateConfig,
    openaiModels.length,
  ]);

  const handleSettingsToggle = useCallback(() => {
    const newShowSettings = !showSettings;
    console.log('🔧 Settings toggled:', newShowSettings ? 'OPEN' : 'CLOSE');
    setShowSettings(newShowSettings);

    // Fetch models when opening settings based on selected provider
    if (newShowSettings) {
      if (config.selectedProvider === 'ollama') {
        console.log(
          '🔄 Fetching Ollama models because settings opened with Ollama selected'
        );
        // Force refresh if we should have models but don't
        const forceRefresh = ollamaModels.length === 0 && !!config.selectedOllamaModel;
        fetchOllamaModels(forceRefresh);
      } else if (config.selectedProvider === 'openai') {
        console.log(
          '🔄 Fetching OpenAI models because settings opened with OpenAI selected'
        );
        // Force refresh if we should have models but don't
        const forceRefresh = openaiModels.length === 0 && !!config.selectedOpenAIModel;
        fetchOpenAIModels(forceRefresh);
      }
    }
  }, [showSettings, config.selectedProvider, config.selectedOllamaModel, config.selectedOpenAIModel, ollamaModels.length, openaiModels.length, fetchOllamaModels, fetchOpenAIModels]);

  const handleProviderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProvider = e.target.value;
      console.log('🔄 Provider changed to:', selectedProvider);
      updateConfig({ selectedProvider });

      // Reset models fetched flag and timestamp when provider changes
      modelsFetchedRef.current = false;
      lastFetchTimeRef.current = 0;

      // Clear models when switching away from provider
      if (selectedProvider !== 'ollama') {
        setOllamaModels([]);
      }
      if (selectedProvider !== 'openai') {
        setOpenaiModels([]);
      }

      // Fetch models based on selected provider
      if (selectedProvider === 'ollama') {
        console.log(
          '🔄 Fetching Ollama models because provider changed to Ollama'
        );
        fetchOllamaModels(true); // Force fetch when provider changes
      } else if (selectedProvider === 'openai') {
        console.log(
          '🔄 Fetching OpenAI models because provider changed to OpenAI'
        );
        fetchOpenAIModels(true); // Force fetch when provider changes
      }
    },
    [updateConfig, fetchOllamaModels, fetchOpenAIModels]
  );

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (data.success) {
        setProviders(data.providers);
        setAgentStatus(data.agent);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (data.success && data.agents) {
        setAvailableAgents(data.agents);
      } else {
        // Fallback to hardcoded agents if API doesn't return them
        const agents: AgentInfo[] = [
          {
            id: 'general-assistant',
            name: 'General Assistant',
            description: 'Versatile AI assistant for general tasks, questions, and conversations',
            capabilities: [
              'question-answering',
              'task-planning',
              'creative-writing',
              'analysis',
              'brainstorming',
              'step-by-step-guides'
            ],
            category: 'General',
            icon: '🤖'
          },
          {
            id: 'nutrition-agent',
            name: 'Dr. Nutri',
            description: 'Specialized nutrition expert for meal planning and dietary guidance',
            capabilities: [
              'meal-planning',
              'nutrition-analysis',
              'macro-calculation',
              'weight-management',
              'sports-nutrition',
              'dietary-restrictions',
              'recipe-suggestions',
              'shopping-lists'
            ],
            category: 'Health & Wellness',
            icon: '🥗'
          }
        ];
        setAvailableAgents(agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Use fallback agents on error
      setAvailableAgents([
        {
          id: 'general-assistant',
          name: 'General Assistant',
          description: 'Versatile AI assistant for general tasks, questions, and conversations',
          capabilities: ['question-answering', 'task-planning'],
          category: 'General',
          icon: '🤖'
        }
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    console.log('📤 Sending message with agent:', selectedAgent);

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: input,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    if (config.streamingEnabled) {
      await handleStreamingResponse(currentInput);
    } else {
      await handleRegularResponse(currentInput);
    }
  };

  const handleStreamingResponse = async (message: string) => {
    const streamingMessage: ChatMessage = {
      id: `streaming_${Date.now()}`,
      content: '',
      type: 'agent',
      timestamp: new Date(),
      isStreaming: true,
      confidence: 0.9,
      agentId: undefined, // Will be updated when agent info is received
      agentName: undefined,
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: config.selectedProvider || undefined,
          apiKey: config.apiKey || undefined,
          selectedOllamaModel: config.selectedOllamaModel || undefined,
          selectedOpenAIModel: config.selectedOpenAIModel || undefined,
          agentId: selectedAgent,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);

                if (data.type === 'start') {
                  // Update agent and model info when stream starts
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessage.id
                        ? {
                            ...msg,
                            agentId: data.agentId,
                            agentName:
                              data.agentName ||
                              agentStatus?.name ||
                              'Assistant',
                            modelProvider: data.modelProvider,
                            modelName: data.modelName,
                          }
                        : msg
                    )
                  );
                } else if (data.type === 'content' && data.content) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessage.id
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                } else if (data.type === 'end') {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessage.id
                        ? {
                            ...msg,
                            isStreaming: false,
                            confidence: data.confidence || 0.9,
                            metadata: data.metadata,
                          }
                        : msg
                    )
                  );
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'agent',
        timestamp: new Date(),
        confidence: 0,
        agentName: agentStatus?.name || 'Assistant',
        modelProvider: config.selectedProvider ?
          providers.find(p => p.id === config.selectedProvider)?.name || config.selectedProvider
          : 'Unknown',
        modelName: config.selectedOllamaModel || 'Default',
      };
      setMessages(prev =>
        prev.filter(msg => msg.id !== streamingMessage.id).concat(errorMessage)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegularResponse = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: config.selectedProvider || undefined,
          apiKey: config.apiKey || undefined,
          selectedOllamaModel: config.selectedOllamaModel || undefined,
          selectedOpenAIModel: config.selectedOpenAIModel || undefined,
          agentId: selectedAgent,
          stream: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage: ChatMessage = {
          id: data.response.id,
          content: data.response.content,
          type: 'agent',
          timestamp: new Date(data.response.timestamp),
          confidence: data.response.confidence,
          reasoning: data.response.reasoning,
          metadata: data.response.metadata,
          agentId: data.agent.id,
          agentName: data.agent.name,
          modelProvider: data.model?.provider,
          modelName: data.model?.name,
        };

        setMessages(prev => [...prev, agentMessage]);
        setAgentStatus(data.agent.status);
      } else {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          content: `Error: ${data.error}`,
          type: 'agent',
          timestamp: new Date(),
          confidence: 0,
          agentName: 'System',
          modelProvider: 'System',
          modelName: 'Error',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'agent',
        timestamp: new Date(),
        confidence: 0,
        agentName: 'System',
        modelProvider: 'System',
        modelName: 'Error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while configuration is being loaded
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <Card variant="gradient" className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                  PolarisAI
                </CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Multi-Agent Reasoning System
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSettingsToggle}
                icon={<SettingsIcon />}
              >
                Settings
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Settings Panel */}
          {showSettings && (
            <Card className="h-fit lg:col-span-1">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Configure your AI model provider and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Select
                  label="AI Agent"
                  value={selectedAgent}
                  onChange={e => {
                    console.log('🤖 Agent selection changed to:', e.target.value);
                    setSelectedAgent(e.target.value);
                  }}
                  placeholder="Select an agent"
                >
                  {availableAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.icon} {agent.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Model Provider"
                  value={config.selectedProvider}
                  onChange={handleProviderChange}
                  placeholder="Select a provider"
                >
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type})
                    </option>
                  ))}
                                  </Select>

                {/* Selected Agent Info */}
                {selectedAgent && availableAgents.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <h3 className="mb-2 font-medium text-blue-800">
                      Selected Agent
                    </h3>
                    {(() => {
                      const agent = availableAgents.find(a => a.id === selectedAgent);
                      if (!agent) return null;
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agent.icon}</span>
                            <span className="font-medium text-blue-900">
                              {agent.name}
                            </span>
                            <Badge variant="outline" size="sm">
                              {agent.category}
                            </Badge>
                          </div>
                          <p className="text-blue-700">{agent.description}</p>
                          <div className="mt-2">
                            <span className="text-xs font-medium text-blue-600">
                              Capabilities:
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {agent.capabilities.slice(0, 4).map(cap => (
                                <Badge key={cap} variant="outline" size="sm">
                                  {cap}
                                </Badge>
                              ))}
                              {agent.capabilities.length > 4 && (
                                <Badge variant="outline" size="sm">
                                  +{agent.capabilities.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}



                {config.selectedProvider === 'ollama' && (
                  <Select
                    label="Ollama Model"
                    value={config.selectedOllamaModel}
                    onChange={e =>
                      updateConfig({ selectedOllamaModel: e.target.value })
                    }
                    placeholder={
                      loadingModels ? 'Loading models...' : 'Select a model'
                    }
                    disabled={loadingModels || ollamaModels.length === 0}
                    helpText={
                      ollamaModels.length === 0
                        ? 'No models found. Make sure Ollama is running and has models installed.'
                        : `${ollamaModels.length} model(s) available`
                    }
                  >
                    {ollamaModels.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </Select>
                )}

                {config.selectedProvider === 'openai' && (
                  <div className="space-y-4">
                    <Select
                      label="OpenAI Model"
                      value={config.selectedOpenAIModel}
                      onChange={e =>
                        updateConfig({ selectedOpenAIModel: e.target.value })
                      }
                      placeholder="Select a model"
                      disabled={loadingModels || openaiModels.length === 0}
                      helpText={
                        openaiModels.length === 0
                          ? 'Loading available models...'
                          : `${openaiModels.length} model(s) available`
                      }
                    >
                      {openaiModels.map(model => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </Select>

                    <Input
                      type="password"
                      label="OpenAI API Key"
                      value={config.apiKey}
                      onChange={e => updateConfig({ apiKey: e.target.value })}
                      placeholder="sk-..."
                      helpText="Your API key is stored locally and never sent to our servers"
                    />
                  </div>
                )}

                {/* Current Model Status */}
                {config.selectedProvider && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <h3 className="mb-2 font-medium text-green-800">
                      Current Model
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">Provider:</span>
                        <Badge variant="outline" size="sm">
                          {providers.find(p => p.id === config.selectedProvider)?.name || config.selectedProvider}
                        </Badge>
                        <Badge variant={
                          providers.find(p => p.id === config.selectedProvider)?.type === 'local'
                            ? 'default'
                            : 'secondary'
                        } size="sm">
                          {providers.find(p => p.id === config.selectedProvider)?.type || 'unknown'}
                        </Badge>
                      </div>
                      {config.selectedProvider === 'ollama' && config.selectedOllamaModel && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">Model:</span>
                          <Badge variant="default" size="sm">
                            ⚡ {config.selectedOllamaModel}
                          </Badge>
                        </div>
                      )}
                      {config.selectedProvider === 'openai' && config.selectedOpenAIModel && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">Model:</span>
                          <Badge variant="default" size="sm">
                            ⚡ {config.selectedOpenAIModel}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Checkbox
                    checked={config.rememberSettings}
                    onChange={toggleRememberSettings}
                    label="Remember settings"
                    description="Keep your provider selection and API key saved between sessions"
                  />
                </div>

                <div className="pt-4">
                  <Checkbox
                    checked={config.streamingEnabled}
                    onChange={e =>
                      updateConfig({ streamingEnabled: e.target.checked })
                    }
                    label="Enable streaming responses"
                    description="Show responses as they're generated for a more interactive experience"
                  />
                </div>

                <div className="pt-4">
                  <Checkbox
                    checked={config.showReasoning}
                    onChange={e =>
                      updateConfig({ showReasoning: e.target.checked })
                    }
                    label="Show reasoning process"
                    description="Display the agent's thinking and reasoning behind responses"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearConfig();
                      showToast('Settings cleared', 'default');
                    }}
                    disabled={!config.selectedProvider && !config.apiKey}
                  >
                    Clear Settings
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-3 font-medium">Provider Status</h3>
                  <div className="space-y-2">
                    {providers.map(provider => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">
                          {provider.name}
                        </span>
                        <Badge
                          variant={
                            provider.status.available
                              ? 'success'
                              : 'destructive'
                          }
                          dot
                        >
                          {provider.status.available
                            ? 'Available'
                            : 'Unavailable'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {agentStatus && (
                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-medium">Agent Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{agentStatus.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initialized:</span>
                        <Badge
                          variant={
                            agentStatus.initialized ? 'success' : 'destructive'
                          }
                        >
                          {agentStatus.initialized ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Memory:</span>
                        <Badge variant="secondary">
                          {agentStatus.memoryCount} items
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">
                          Capabilities:
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {agentStatus.capabilities.map(cap => (
                            <Badge key={cap} variant="outline" size="sm">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          <Card
            className={`${showSettings ? 'lg:col-span-2' : 'lg:col-span-3'}`}
          >
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 space-y-4 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                      <BotIcon />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Welcome to PolarisAI!
                    </h3>
                    <p className="mb-4 text-gray-600">
                      Start a conversation with the General Assistant
                    </p>
                    <div className="mx-auto max-w-md rounded-lg bg-blue-50 p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Try asking:</span>
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>• &quot;How does the reasoning system work?&quot;</p>
                        <p>
                          • &quot;Help me brainstorm ideas for a project&quot;
                        </p>
                        <p>• &quot;Explain quantum computing&quot;</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className="flex gap-4">
                      {/* Avatar */}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {message.type === 'user' ? (
                          <UserIcon />
                        ) : (
                          <span className="text-lg">
                            {(() => {
                              const agent = availableAgents.find(a =>
                                a.name === message.agentName || a.id === message.agentId
                              );
                              return agent?.icon || '🤖';
                            })()}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`rounded-lg p-4 ${
                            message.type === 'user'
                              ? 'ml-12 bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.type === 'user' ? (
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>

                        {message.type === 'agent' && (
                          <div className="mt-2 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {/* Agent identification badge */}
                              {message.agentName && (
                                <Badge variant="default" size="sm">
                                  {(() => {
                                    const agent = availableAgents.find(a =>
                                      a.name === message.agentName || a.id === message.agentId
                                    );
                                    return agent?.icon || '🤖';
                                  })()} {message.agentName}
                                </Badge>
                              )}
                              {/* Model identification badge */}
                              {message.modelProvider && message.modelName && (
                                <Badge variant="secondary" size="sm">
                                  ⚡ {message.modelProvider}: {message.modelName}
                                </Badge>
                              )}
                              {message.isStreaming && (
                                <Badge variant="outline" size="sm">
                                  <span className="flex items-center gap-1">
                                    <span className="animate-pulse">●</span>
                                    Streaming...
                                  </span>
                                </Badge>
                              )}
                              {message.confidence !== undefined && (
                                <Badge variant="secondary" size="sm">
                                  Confidence:{' '}
                                  {Math.round(message.confidence * 100)}%
                                </Badge>
                              )}
                              {config.showReasoning && message.reasoning && (
                                <Badge variant="outline" size="sm">
                                  💭 Reasoning Available
                                </Badge>
                              )}
                            </div>

                            {config.showReasoning && message.reasoning && (
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="font-medium text-blue-600">
                                    🧠 Agent Reasoning:
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap text-blue-800">
                                  {message.reasoning}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      <BotIcon />
                    </div>
                    <div className="flex-1">
                      <div className="rounded-lg bg-gray-100 p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="min-h-[44px] flex-1 resize-none"
                    rows={1}
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    size="lg"
                    variant="gradient"
                    icon={<SendIcon />}
                    loading={loading}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
