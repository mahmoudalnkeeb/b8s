import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAgent } from '../../../api/agents';
import { useCreateConversation } from '../../../api/conversations';
import { useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, ArrowLeft, Loader2 } from 'lucide-react';
import { MessageBubble } from '@/components/ui/message-bubble';
import { useChatStream } from '@/hooks/use-chat-stream';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/chat/new/$agentId')({
  component: NewChat,
});

function NewChat() {
  const { agentId } = Route.useParams();
  const { data: agent, isLoading: isAgentLoading } = useAgent(agentId);
  const createConversation = useCreateConversation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCreateConv = useCallback(
    async (firstMessage: string) => {
      return await createConversation.mutateAsync({ agentId, firstMessage });
    },
    [agentId, createConversation],
  );

  const handleStreamComplete = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        navigate({ to: '/chat/$conversationId', params: { conversationId } });
      }
    },
    [navigate],
  );

  const { messages, input, setInput, isStreaming, isWaiting, handleSend } = useChatStream({
    createConversation: handleCreateConv,
    onStreamComplete: handleStreamComplete,
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
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isAgentLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading agent...</div>;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto relative overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-border bg-background/50 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="lg:hidden text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-none border border-transparent"
          >
            <Link to="/discover">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="p-2 border border-primary/30 bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-sans font-black text-sm text-foreground uppercase tracking-tight">
              New Chat with {agent?.name || 'Agent'}
            </h3>
            <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest">Draft</p>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 px-4 py-8 scroll-smooth flex flex-col relative z-10", messages.length === 0 ? "justify-center overflow-hidden" : "overflow-y-auto space-y-8")}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-col items-center justify-center -mt-24 w-full"
            >
              <h2 className="font-sans font-black text-3xl md:text-5xl text-foreground uppercase tracking-tight mb-8 drop-shadow-sm text-center">
                WHAT CAN I HELP WITH?
              </h2>
              
              <motion.div layoutId="chat-input-wrapper" className="w-[90%] max-w-3xl relative">
                <form onSubmit={handleSend} className="relative w-full group">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="min-h-[64px] py-5 pl-5 pr-16 bg-card border border-border rounded-none focus-visible:ring-1 focus-visible:ring-primary text-base text-foreground font-mono placeholder:text-foreground/20 resize-none overflow-y-auto shadow-xl"
                    disabled={isStreaming}
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !input.trim()}
                    className="absolute right-2.5 bottom-2.5 h-10 w-12 bg-primary hover:bg-foreground text-primary-foreground hover:text-background transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer rounded-none"
                    aria-label="Send message"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    ) : (
                      <Send className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length > 0 && (
          <div className="flex-1 space-y-8 mt-auto w-full">
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
                Initializing conversation...
              </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            key="active-state"
            layoutId="chat-input-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="p-4 bg-gradient-to-t from-background via-background/80 to-transparent pt-10 sticky bottom-0 z-20"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
