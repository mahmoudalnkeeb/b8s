import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MessageCircleWarning, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useSubmitFeedback } from '../api/feedback';

export const Route = createFileRoute('/feedback')({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion');
  const [content, setContent] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 10) {
      toast.error('Feedback must be at least 10 characters long.');
      return;
    }

    try {
      await submitFeedback.mutateAsync({ type, content });
      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data?.error || 'Failed to submit feedback');
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0a0a] border border-white/10 p-12 text-center max-w-lg"
        >
          <CheckCircle2 className="h-16 w-16 text-[#3D81CC] mx-auto mb-6" />
          <h2 className="font-sans font-black text-2xl text-white uppercase tracking-tight mb-4">
            Feedback Received
          </h2>
          <p className="font-sans text-sm text-white/50 font-light mb-8">
            Thank you for helping shape the early stages of Blueprints. Your input is extremely valuable to us.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setContent('');
            }}
            className="bg-[#3D81CC] text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3 hover:bg-white hover:text-black transition-colors cursor-pointer border-none"
          >
            Submit Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-12 px-6 space-y-10"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-white/30">
          <div className="h-px w-12 bg-[#3D81CC]"></div>
          <span className="text-[#3D81CC]">Early Access Team</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-black text-white uppercase tracking-tight">
          Feedback
        </h1>
        <p className="font-sans text-sm text-white/50 font-light">
          Blueprints is still in active development. Please report any bugs or suggest features you'd like to see next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-px border border-white/10 bg-white/10">
        <div className="bg-[#0a0a0a] p-8 hover:bg-[#111] transition-colors">
          <label className="block font-sans font-black text-lg text-white uppercase tracking-tight mb-6">
            Type of Feedback
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`flex items-center gap-4 p-4 border transition-colors cursor-pointer text-left ${
                type === 'bug'
                  ? 'border-red-500/50 bg-red-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-black'
              }`}
            >
              <MessageCircleWarning className={`h-6 w-6 ${type === 'bug' ? 'text-red-400' : 'text-white/40'}`} />
              <div>
                <div className={`font-sans font-bold uppercase tracking-widest text-sm ${type === 'bug' ? 'text-red-400' : 'text-white'}`}>Report a Bug</div>
                <div className="font-sans text-xs text-white/40 mt-1">Something is broken or not working as expected.</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('suggestion')}
              className={`flex items-center gap-4 p-4 border transition-colors cursor-pointer text-left ${
                type === 'suggestion'
                  ? 'border-[#3D81CC]/50 bg-[#3D81CC]/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-black'
              }`}
            >
              <Lightbulb className={`h-6 w-6 ${type === 'suggestion' ? 'text-[#3D81CC]' : 'text-white/40'}`} />
              <div>
                <div className={`font-sans font-bold uppercase tracking-widest text-sm ${type === 'suggestion' ? 'text-[#3D81CC]' : 'text-white'}`}>Feature Suggestion</div>
                <div className="font-sans text-xs text-white/40 mt-1">I have a great idea to make Blueprints better.</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-8 hover:bg-[#111] transition-colors">
          <label className="block font-sans font-black text-lg text-white uppercase tracking-tight mb-4">
            Details
          </label>
          <p className="font-sans text-sm text-white/40 font-light mb-4">
            Please be as descriptive as possible. If it's a bug, include steps to reproduce.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'bug' ? "What went wrong? Steps to reproduce..." : "It would be amazing if..."}
            className="w-full bg-black border border-white/10 text-white font-sans text-sm px-4 py-3 min-h-[160px] focus:outline-none focus:border-[#3D81CC] transition-colors resize-y mb-6 placeholder-white/20"
            required
            minLength={10}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitFeedback.isPending || content.length < 10}
              className="bg-[#3D81CC] text-white font-mono text-[10px] uppercase tracking-widest px-8 py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
