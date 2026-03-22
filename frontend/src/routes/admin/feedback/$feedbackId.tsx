import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useAdminFeedbackById, useAdminUpdateFeedbackStatus } from '../../../api/admin';
import { ChevronLeft, MessageCircleWarning, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/feedback/$feedbackId')({
  component: AdminFeedbackDetails,
});

function AdminFeedbackDetails() {
  const { feedbackId } = Route.useParams();
  const { data: feedback, isLoading, error } = useAdminFeedbackById(feedbackId);
  const updateStatus = useAdminUpdateFeedbackStatus();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      await updateStatus.mutateAsync({ feedbackId, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 flex items-center justify-center min-h-[50vh]">
        <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <Link to="/admin" className="font-mono text-xs text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2 mb-8 no-underline">
          <ChevronLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <div className="bg-[#0a0a0a] border border-red-500/30 p-8 text-center max-w-md mx-auto">
          <p className="font-mono text-xs text-red-400 uppercase tracking-widest mb-2">NOT FOUND</p>
          <p className="font-sans text-sm text-white/60">Feedback item could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-8"
    >
      <Link to="/admin" className="font-mono text-xs text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2 mb-8 no-underline">
        <ChevronLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${feedback.type === 'bug' ? 'bg-red-400/10 text-red-400' : 'bg-[#3D81CC]/10 text-[#3D81CC]'}`}>
            {feedback.type === 'bug' ? <MessageCircleWarning className="h-6 w-6" /> : <Lightbulb className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="font-sans font-black text-2xl text-white tracking-tight uppercase flex items-center gap-3">
              {feedback.type === 'bug' ? 'Bug Report' : 'Feature Suggestion'}
            </h1>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest mt-1">
              {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : 'Date Unknown'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <label className="font-mono text-[9px] text-white/40 uppercase tracking-widest">
              State
            </label>
           <select
              value={feedback.status}
              onChange={handleStatusChange}
              className="bg-black border border-white/10 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-[#3D81CC] transition-colors uppercase cursor-pointer"
            >
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2 space-y-6">
           <div className="bg-[#0a0a0a] border border-white/10 p-6">
              <h2 className="font-mono text-[10px] text-[#3D81CC] uppercase tracking-widest mb-4">Content</h2>
              <div className="font-sans text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {feedback.content}
              </div>
           </div>
        </div>

        <div className="col-span-1 space-y-6">
            <div className="bg-[#0a0a0a] border border-white/10 p-6">
              <h2 className="font-mono text-[10px] text-[#3D81CC] uppercase tracking-widest mb-4">Metadata</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">Feedback ID</p>
                  <p className="font-mono text-[10px] text-white/80 break-all">{feedback.feedbackId}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">Reporter User ID</p>
                  <p className="font-mono text-[10px] text-white/80 break-all">{feedback.userId}</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
