import { render, screen, fireEvent } from '@testing-library/react';
import { usePersistedConfig } from '@/lib/hooks/usePersistedConfig';

// Mock the persisted config hook
jest.mock('@/lib/hooks/usePersistedConfig');

// Mock the markdown renderer
jest.mock('@/components/ui/markdown-renderer', () => {
  return {
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>
  };
});

// Simple component to test reasoning display
function TestReasoningDisplay() {
  const { config, updateConfig } = usePersistedConfig();

  const mockMessage = {
    id: 'test-1',
    content: 'This is a test response',
    type: 'agent' as const,
    timestamp: new Date(),
    confidence: 0.85,
    reasoning: 'This is the agent reasoning process that explains how I arrived at this response.',
    metadata: {}
  };

  return (
    <div>
      <input
        type="checkbox"
        data-testid="reasoning-toggle"
        checked={config.showReasoning}
        onChange={(e) => updateConfig({ showReasoning: e.target.checked })}
      />

      <div data-testid="message-container">
        <div className="message-content">
          {mockMessage.content}
        </div>

        {mockMessage.type === 'agent' && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {mockMessage.confidence !== undefined && (
                <span data-testid="confidence-badge">
                  Confidence: {Math.round(mockMessage.confidence * 100)}%
                </span>
              )}
              {config.showReasoning && mockMessage.reasoning && (
                <span data-testid="reasoning-badge">
                  💭 Reasoning Available
                </span>
              )}
            </div>

            {config.showReasoning && mockMessage.reasoning && (
              <div data-testid="reasoning-content" className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-medium">🧠 Agent Reasoning:</span>
                </div>
                <div className="text-blue-800 whitespace-pre-wrap">
                  {mockMessage.reasoning}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

describe('Reasoning Display Toggle', () => {
  const mockConfig = {
    selectedProvider: '',
    apiKey: '',
    rememberSettings: true,
    streamingEnabled: false,
    showReasoning: true
  };

  const mockUpdateConfig = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePersistedConfig as jest.Mock).mockReturnValue({
      config: mockConfig,
      updateConfig: mockUpdateConfig,
      clearConfig: jest.fn(),
      toggleRememberSettings: jest.fn(),
      isLoaded: true
    });
  });

  it('should show reasoning when toggle is enabled', () => {
    render(<TestReasoningDisplay />);

    expect(screen.getByTestId('reasoning-toggle')).toBeChecked();
    expect(screen.getByTestId('reasoning-badge')).toBeInTheDocument();
    expect(screen.getByTestId('reasoning-content')).toBeInTheDocument();
    expect(screen.getByText('This is the agent reasoning process that explains how I arrived at this response.')).toBeInTheDocument();
  });

  it('should hide reasoning when toggle is disabled', () => {
    (usePersistedConfig as jest.Mock).mockReturnValue({
      config: { ...mockConfig, showReasoning: false },
      updateConfig: mockUpdateConfig,
      clearConfig: jest.fn(),
      toggleRememberSettings: jest.fn(),
      isLoaded: true
    });

    render(<TestReasoningDisplay />);

    expect(screen.getByTestId('reasoning-toggle')).not.toBeChecked();
    expect(screen.queryByTestId('reasoning-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reasoning-content')).not.toBeInTheDocument();
  });

  it('should toggle reasoning display when checkbox is clicked', () => {
    render(<TestReasoningDisplay />);

    const toggle = screen.getByTestId('reasoning-toggle');
    fireEvent.click(toggle);

    expect(mockUpdateConfig).toHaveBeenCalledWith({ showReasoning: false });
  });

  it('should always show confidence badge regardless of reasoning toggle', () => {
    const { unmount } = render(<TestReasoningDisplay />);

    expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();

    // Unmount the first render
    unmount();

    // Test with reasoning disabled
    (usePersistedConfig as jest.Mock).mockReturnValue({
      config: { ...mockConfig, showReasoning: false },
      updateConfig: mockUpdateConfig,
      clearConfig: jest.fn(),
      toggleRememberSettings: jest.fn(),
      isLoaded: true
    });

    render(<TestReasoningDisplay />);
    expect(screen.getByTestId('confidence-badge')).toBeInTheDocument();
  });

  it('should not show reasoning elements when message has no reasoning', () => {
    const TestNoReasoningDisplay = () => {
      const { config } = usePersistedConfig();

             const mockMessageNoReasoning = {
         id: 'test-1',
         content: 'This is a test response',
         type: 'agent' as const,
         timestamp: new Date(),
         confidence: 0.85,
         metadata: {},
         reasoning: undefined
       };

      return (
        <div data-testid="message-container">
          {config.showReasoning && mockMessageNoReasoning.reasoning && (
            <span data-testid="reasoning-badge">💭 Reasoning Available</span>
          )}
          {config.showReasoning && mockMessageNoReasoning.reasoning && (
            <div data-testid="reasoning-content">Reasoning content</div>
          )}
        </div>
      );
    };

    render(<TestNoReasoningDisplay />);

    expect(screen.queryByTestId('reasoning-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reasoning-content')).not.toBeInTheDocument();
  });
});
