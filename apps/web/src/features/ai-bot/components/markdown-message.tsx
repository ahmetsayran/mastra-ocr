import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

// Raw HTML in answers is not rendered (react-markdown default), so document text cannot inject markup
const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6 last:mb-0">{children}</ol>,
  h1: ({ children }) => <h1 className="mb-3 text-xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 text-lg font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 font-semibold">{children}</h3>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-muted mb-3 overflow-x-auto rounded-lg p-3 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="text-muted-foreground mb-3 border-l-2 pl-4">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-1.5">{children}</td>,
};

/**
 * MarkdownMessage - Renders an assistant answer written in markdown (lists, bold, tables)
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </Markdown>
  );
}
