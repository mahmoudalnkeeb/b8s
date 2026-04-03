import React, { useState, useCallback } from 'react';
import { Bot, User, Copy, Check, ExternalLink, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';
import { CitationsList } from './citation';
import type { CitationProps } from './citation';

export interface MessageProps {
  role: 'user' | 'assistant' | 'tool' | string;
  content: string;
  timestamp?: string | Date;
  isLoading?: boolean;
  citations?: CitationProps[];
  toolName?: string;
}

// --- Copy button for code blocks ---
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// --- Loading indicator ---
function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

// --- Markdown component map ---
const markdownComponents: Components = {
  // Block code with language label + copy button
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children, ...props }) {
    const isBlock = !!className;
    const language = className?.replace('language-', '') ?? '';
    const text = String(children).replace(/\n$/, '');

    if (!isBlock) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-foreground/10 border border-border text-[0.82em] text-primary font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative my-3 rounded-xl overflow-hidden border border-border bg-card text-[0.82em]">
        {language && (
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-foreground/5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {language}
            </span>
          </div>
        )}
        <CopyButton text={text} />
        <pre className="overflow-x-auto p-4 m-0 leading-relaxed font-mono text-foreground/80">
          <code>{children}</code>
        </pre>
      </div>
    );
  },

  // Links — open in new tab, external icon
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 decoration-primary/40 hover:text-primary/80 hover:decoration-primary/60 transition-colors"
      >
        {children}
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    );
  },

  // Blockquote
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },

  // Headings
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mt-3 mb-1.5 text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-3 mb-1 text-foreground/90">{children}</h3>
  ),

  // Paragraphs — prevent prose from adding excess margin
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-foreground/5">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr className="divide-x divide-border">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-medium text-foreground/80 text-xs uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-foreground/80">{children}</td>,

  // Horizontal rule
  hr: () => <hr className="my-3 border-border" />,

  // Strong / em
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
};

// --- Main component ---
export const MessageBubble = React.memo(({ message }: { message: MessageProps }) => {
  if (message.role === 'tool') {
    return (
      <div className="flex justify-center my-4 opacity-70">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-border text-muted-foreground text-[10px] font-mono tracking-widest uppercase shadow-sm">
          <Wrench className="h-3 w-3 text-primary" />
          {message.content || `Utilized tool: ${message.toolName || 'system'}`}
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-4 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border',
          isUser ? 'bg-primary border-primary' : 'bg-secondary/50 border-border',
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'flex flex-col max-w-[85%] space-y-2',
          isUser ? 'items-end text-right' : 'items-start',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/20 border border-border text-foreground/90',
          )}
        >
          {message.isLoading ? (
            <LoadingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
              {message.citations && message.citations.length > 0 && (
                <CitationsList citations={message.citations} />
              )}
            </>
          )}
        </div>

        {message.timestamp && (
          <span className="text-[10px] text-muted-foreground/50 px-1 font-mono uppercase">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
