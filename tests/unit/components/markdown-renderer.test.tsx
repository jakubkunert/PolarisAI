import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('MarkdownRenderer', () => {
  const mockClipboard = navigator.clipboard.writeText as jest.Mock;

  beforeEach(() => {
    mockClipboard.mockClear();
  });

  describe('Basic Markdown Rendering', () => {
    it('renders headings correctly', () => {
      const content = `# Heading 1
## Heading 2
### Heading 3`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
      expect(screen.getByText('Heading 3')).toBeInTheDocument();
    });

    it('renders paragraphs correctly', () => {
      const content = `This is a paragraph.

This is another paragraph.`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
      expect(screen.getByText('This is another paragraph.')).toBeInTheDocument();
    });

    it('renders lists correctly', () => {
      const content = `- Item 1
- Item 2
- Item 3

1. Numbered item 1
2. Numbered item 2`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      expect(screen.getByText('Numbered item 1')).toBeInTheDocument();
      expect(screen.getByText('Numbered item 2')).toBeInTheDocument();
    });

    it('renders emphasis and strong text', () => {
      const content = `*italic text* and **bold text**`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('italic text')).toBeInTheDocument();
      expect(screen.getByText('bold text')).toBeInTheDocument();
    });

    it('renders blockquotes correctly', () => {
      const content = `> This is a blockquote`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('This is a blockquote')).toBeInTheDocument();
    });

    it('renders horizontal rules', () => {
      const content = `Above the line

---

Below the line`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Above the line')).toBeInTheDocument();
      expect(screen.getByText('Below the line')).toBeInTheDocument();
    });

    it('renders links with proper attributes', () => {
      const content = `[Google](https://google.com)`;

      render(<MarkdownRenderer content={content} />);

      const link = screen.getByText('Google');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://google.com');
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Code Rendering', () => {
    it('renders inline code correctly', () => {
      const content = `Here is some \`inline code\``;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('inline code')).toBeInTheDocument();
    });

    it('renders code blocks without language', () => {
      const content = `\`\`\`
console.log("Hello, World!");
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('console.log("Hello, World!");')).toBeInTheDocument();
    });

    it('renders code blocks with language and copy functionality', () => {
      const content = `\`\`\`javascript
console.log("Hello, World!");
const x = 42;
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.getByText('console.log("Hello, World!");')).toBeInTheDocument();
      expect(screen.getByText('const x = 42;')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('handles copy functionality for code blocks', async () => {
      const content = `\`\`\`python
print("Hello, World!")
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard).toHaveBeenCalledWith('print("Hello, World!")');
      });

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('shows different languages correctly', () => {
      const content = `\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\`

\`\`\`bash
npm install react
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('bash')).toBeInTheDocument();
    });
  });

  describe('Table Rendering', () => {
    it('renders tables correctly', () => {
      const content = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('City')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('NYC')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('LA')).toBeInTheDocument();
    });
  });

  describe('GitHub Flavored Markdown', () => {
    it('renders strikethrough text', () => {
      const content = `~~strikethrough~~`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('strikethrough')).toBeInTheDocument();
    });

    it('renders task lists', () => {
      const content = `- [x] Completed task
- [ ] Incomplete task`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Completed task')).toBeInTheDocument();
      expect(screen.getByText('Incomplete task')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      render(<MarkdownRenderer content="" />);
      // Should not throw any errors
    });

    it('handles content with only whitespace', () => {
      render(<MarkdownRenderer content="   \n\n   " />);
      // Should not throw any errors
    });

    it('applies custom className', () => {
      const { container } = render(
        <MarkdownRenderer content="# Test" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles malformed markdown gracefully', () => {
      const content = `# Heading
[broken link](
\`\`\`
unclosed code block`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('Heading')).toBeInTheDocument();
    });
  });

  describe('Copy Functionality Edge Cases', () => {
    it('handles copy failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockClipboard.mockRejectedValue(new Error('Copy failed'));

      const content = `\`\`\`javascript
console.log("test");
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('resets copy state after timeout', async () => {
      jest.useFakeTimers();

      const content = `\`\`\`javascript
console.log("test");
\`\`\``;

      render(<MarkdownRenderer content={content} />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
