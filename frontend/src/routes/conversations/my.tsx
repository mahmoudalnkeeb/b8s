import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMyConversations, useDeleteConversation } from '../../api/conversations';
import { MessageCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/conversations/my')({
  component: MyConversations,
});

function MyConversations() {
  const { data: conversations, isLoading } = useMyConversations();
  const convList = Array.isArray(conversations) ? conversations : [];
  const deleteConversation = useDeleteConversation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    const isConfirmed = await confirm({
      title: 'Delete Conversation',
      description: 'Are you sure you want to delete this chat history? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteConversation.mutateAsync(id);
        toast.success('Conversation deleted');
      } catch (err: any) {
        toast.error('Failed to delete conversation', { description: err.message });
      }
    }
  };

  if (isLoading)
    return (
      <div className="p-10 text-center font-mono text-xs text-white/30 uppercase tracking-widest">
        Loading conversations...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto py-12 px-6 space-y-10"
    >
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
              <div className="h-px w-12 bg-[#3D81CC]"></div>
              <span className="text-[#3D81CC]">History</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-black text-white uppercase tracking-tight">
              Conversations
            </h1>
            <p className="font-sans text-sm text-white/50 font-light">
              Resume chats with your agents.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/discover' })} variant="default" className="h-11 px-6">
            <MessageCircle className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {convList.map((conv: any) => (
          <Link
            key={conv.conversationId}
            to="/chat/$conversationId"
            params={{ conversationId: conv.conversationId }}
            className="no-underline block group"
          >
            <div className="bg-[#0a0a0a] p-8 hover:bg-[#111] transition-colors flex flex-col min-h-[160px] relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#3D81CC]/10 flex items-center justify-center group-hover:bg-[#3D81CC]/20 transition-colors">
                  <MessageCircle className="h-5 w-5 text-[#3D81CC]" />
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all h-8 w-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                  onClick={(e) => handleDelete(e, conv.conversationId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <h3 className="font-sans font-black text-lg text-white group-hover:text-[#3D81CC] transition-colors uppercase tracking-tight line-clamp-1 mb-2">
                {conv.agentName || 'New Conversation'}
              </h3>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/20 uppercase tracking-widest">
                  <Clock className="h-3 w-3" />
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
                <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
                  {conv.conversationId.slice(0, 8)}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {convList.length === 0 && (
          <div className="col-span-full bg-[#0a0a0a] p-20 text-center space-y-6">
            <MessageCircle className="h-12 w-12 mx-auto text-white/10" />
            <h3 className="font-sans font-black text-2xl text-white uppercase">No Active Chats</h3>
            <p className="font-sans text-sm text-white/40 font-light max-w-sm mx-auto">
              Start a conversation with an agent to see it here.
            </p>
            <Button onClick={() => navigate({ to: '/discover' })} variant="default" className="h-11 px-8">
              Discover Agents
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
