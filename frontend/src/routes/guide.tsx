import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  LayoutGrid, 
  Compass, 
  Wrench, 
  Lightbulb, 
  CreditCard,
  Shield
} from 'lucide-react';

export const Route = createFileRoute('/guide')({
  component: GuidePage,
});

function GuidePage() {
  const steps = [
    {
      title: 'Creating an Agent',
      icon: LayoutGrid,
      description: 'Head over to the Agents tab to build your custom AI. You can define its persona, description, and give it specific system instructions that dictate its behavior.',
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/15 dark:bg-purple-400/10',
      borderColor: 'border-purple-500/40 dark:border-purple-400/30'
    },
    {
      title: 'Chatting with Agents',
      icon: MessageSquare,
      description: 'Once you or the community has created an Agent, you can start a conversation in the Chats tab. AI responses will be streamed in real-time, and your message history is automatically saved to easily resume discussions later.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/15 dark:bg-green-400/10',
      borderColor: 'border-green-600/40 dark:border-green-400/30'
    },
    {
      title: 'Discovering Public Agents',
      icon: Compass,
      description: 'The Discover tab acts as a community hub. Explore agents created by others! While their private configurations are hidden securely, you can freely chat with them and pin your favorites.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    },
    {
      title: 'Access Control & Permissions',
      icon: Shield,
      description: 'In the Agent settings, you control who uses your agent. Set Visibility to Private or Public. You can also configure Long-term Memory read and write permissions (e.g., let anyone write memories, but only the creator can read them).',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/15 dark:bg-teal-400/10',
      borderColor: 'border-teal-600/40 dark:border-teal-400/30'
    },
    {
      title: 'Leveraging Tools & RAG',
      icon: Wrench,
      description: 'You can build custom API tools in the Tools section and attach them to your Agent. Moreover, the Agent page features a Knowledge Base (RAG) uploader—just drop your PDFs or TXT files directly into the Agent to give it specific knowledge.',
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-500/15 dark:bg-orange-400/10',
      borderColor: 'border-orange-500/40 dark:border-orange-400/30'
    },
    {
      title: 'Compute Units (CUs)',
      icon: CreditCard,
      description: 'Blueprints uses Compute Units (CUs) for billing, which are calculated based on the number of tokens (words) processed by the AI. Check your Settings to view your CU balance or redeem promotional coupons.',
      color: 'text-pink-500 dark:text-pink-400',
      bgColor: 'bg-pink-500/15 dark:bg-pink-400/10',
      borderColor: 'border-pink-500/40 dark:border-pink-400/30'
    },
    {
      title: 'Submitting Feedback',
      icon: Lightbulb,
      description: 'Blueprints is growing! If you experience bugs or have amazing feature ideas, drop them in the Feedback tab. The admins monitor this closely.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/15 dark:bg-yellow-400/10',
      borderColor: 'border-yellow-600/40 dark:border-yellow-400/30'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto py-12 px-6 space-y-12"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
          <div className="h-px w-12 bg-primary"></div>
          <span className="text-primary">Platform Guide</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-black text-foreground uppercase tracking-tight">
          How to Use Blueprints
        </h1>
        <p className="font-sans text-sm text-foreground/50 font-light max-w-2xl leading-relaxed">
          Welcome to the platform! Whether you're here to interact with community AI agents, orchestrate your own private assistants, or build powerful tool pipelines, this quick guide will help you get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              key={step.title}
              className="group relative border border-border bg-card p-8 hover:bg-secondary transition-colors"
            >
              <div className="flex flex-col h-full space-y-4">
                <div className={`w-fit p-3 border ${step.borderColor} ${step.bgColor} rounded-xl`}>
                  <Icon className={`h-6 w-6 ${step.color}`} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">
                    {step.title}
                  </h2>
                  <p className="font-sans text-sm text-foreground/50 font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-12 p-8 border border-primary/30 bg-primary/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 text-primary/10">
            <LayoutGrid className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-4">
            <h3 className="font-sans font-black text-2xl text-foreground uppercase tracking-tight">
                Ready to Dive In?
            </h3>
            <p className="font-sans text-sm text-foreground/60 font-light max-w-xl">
                Start by either exploring the Discover tab to interact with existing agents or head over to the Agents tab to create your own!
            </p>
        </div>
      </div>
    </motion.div>
  );
}
