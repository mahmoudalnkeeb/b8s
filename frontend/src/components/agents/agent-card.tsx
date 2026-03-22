import React from 'react';
import { Bot, BrainCircuit, Database, MessageSquare, Settings, Trash2, Pin, PinOff } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface AgentCardProps {
  agent: any;
  isPending: boolean;
  onChat: (e: React.MouseEvent, agentId: string) => void;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent, agentId: string) => void;
  onTogglePin?: (e: React.MouseEvent, agentId: string) => void;
}

export const AgentCard = React.memo(({ agent, isPending, onChat, onClick, onDelete, onTogglePin }: AgentCardProps) => {
  return (
    <article
      aria-label={`Agent: ${agent.name}`}
      className="bg-[#0a0a0a] border border-white/10 p-8 hover:bg-[#111] transition-all duration-200 cursor-pointer group flex flex-col min-h-[280px] relative focus-within:bg-[#111] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#3D81CC]/5"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3D81CC] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 bg-[#3D81CC]/10 flex items-center justify-center group-hover:bg-[#3D81CC]/20 transition-colors" aria-hidden="true">
            <Bot className="h-5 w-5 text-[#3D81CC]" />
          </div>
          {onTogglePin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin(e, agent.agentId); }}
                  aria-label={agent.isPinned ? 'Unpin agent' : 'Pin to sidebar'}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center transition-all bg-transparent border-none cursor-pointer",
                    agent.isPinned ? "text-[#3D81CC]" : "text-white/20 hover:text-white/50"
                  )}
                >
                  {agent.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{agent.isPinned ? 'Unpin' : 'Pin to sidebar'}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {agent.config?.memoryEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6" aria-label="Memory enabled">
                  <BrainCircuit className="h-3.5 w-3.5 text-white/20 group-hover:text-[#3D81CC] transition-colors" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Memory enabled</TooltipContent>
            </Tooltip>
          )}
          {agent.config?.ragEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center justify-center h-6 w-6" aria-label="Knowledge base enabled">
                  <Database className="h-3.5 w-3.5 text-white/20 group-hover:text-[#3D81CC] transition-colors" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Knowledge base</TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(e, agent.agentId); }}
                  aria-label={`Delete ${agent.name}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-400 transition-all h-8 w-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-white/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete agent</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <h3 className="font-sans font-black text-xl text-white group-hover:text-[#3D81CC] transition-colors mb-2 uppercase tracking-tight truncate">
        {agent.name}
      </h3>
      <p className="font-sans text-xs text-white/40 font-light leading-relaxed line-clamp-2 min-h-[32px]">
        {agent.description || 'No description provided.'}
      </p>

      <div className="mt-auto pt-6 space-y-4">
        <div className="flex justify-between items-center font-mono text-[9px] uppercase tracking-widest text-white/20 border-t border-white/10 pt-4">
          <span className="flex items-center gap-1.5">
            <span className={cn('inline-block w-1.5 h-1.5', agent.deployed ? 'bg-emerald-400' : 'bg-white/20')} aria-hidden="true" />
            {agent.deployed ? 'Active' : 'Draft'}
          </span>
          <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-px">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex-1 bg-[#3D81CC] text-white font-mono text-[10px] uppercase tracking-widest py-3 hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={(e) => onChat(e, agent.agentId)}
                disabled={!agent.deployed || isPending}
                aria-label={`Start chat with ${agent.name}`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </button>
            </TooltipTrigger>
            <TooltipContent>{agent.deployed ? 'Start a conversation' : 'Deploy to enable chat'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-12 bg-[#111] text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                aria-label={`Settings for ${agent.name}`}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Agent settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </article>
  );
});

AgentCard.displayName = 'AgentCard';
