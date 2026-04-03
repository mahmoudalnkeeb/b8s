import { createFileRoute, Link } from '@tanstack/react-router';
import { useConversation } from '../../api/conversations';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, ArrowLeft, Loader2 } from 'lucide-react';
import { MessageBubble } from '@/components/ui/message-bubble';
import { useChatStream } from '@/hooks/use-chat-stream';

export const Route = createFileRoute('/chat/$conversationId')({
  component: Chat,
});

function Chat() {
  const { conversationId } = Route.useParams();
  const { data: conversation, refetch, isLoading: isConvLoading } = useConversation(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, input, setInput, isStreaming, isWaiting, handleSend } =
    useChatStream({
      conversationId,
      onRefetch: refetch,
    });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSend(fakeEvent);
      }
    }
  };

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
    }
  }, [conversation, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isConvLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading conversation...</div>;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      <div className="p-4 flex items-center justify-between border-b border-border bg-background/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="lg:hidden text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-none border border-transparent"
          >
            <Link to="/conversations/my">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="p-2 border border-primary/30 bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-sans font-black text-sm text-foreground uppercase tracking-tight">
              {conversation?.agentName || 'Agent Chat'}
            </h3>
            <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest">
              {conversationId.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isWaiting && (
          <MessageBubble
            message={{
              role: 'assistant',
              content: '...',
              timestamp: new Date(),
            }}
          />
        )}
        {isStreaming && !isWaiting && (
          <div className="flex items-center gap-2 font-mono text-[10px] text-foreground/40 uppercase tracking-widest animate-pulse ml-12">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Generating response...
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent pt-10 sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto w-full group">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="min-h-[56px] py-4 pl-4 pr-16 bg-card border border-border rounded-none focus-visible:ring-1 focus-visible:ring-primary text-sm text-foreground font-mono placeholder:text-foreground/20 resize-none overflow-y-auto shadow-xl"
            disabled={isStreaming}
            rows={1}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="absolute right-2 bottom-2 h-10 w-12 bg-primary hover:bg-foreground text-primary-foreground hover:text-background transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer rounded-none"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            ) : (
              <Send className="h-4 w-4 flex-shrink-0" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
