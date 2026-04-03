import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDiscoverAgents, useTogglePinAgent, usePinnedAgents } from '../api/agents'
import { Bot, MessageSquare, Globe, Search, Pin, PinOff, Users } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/discover')({
  component: Discover,
})

function Discover() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { data: agents, isLoading } = useDiscoverAgents(debouncedSearch)
  const togglePin = useTogglePinAgent()
  const { data: pinnedAgents } = usePinnedAgents({ enabled: true })

  const agentsList = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    if (!Array.isArray(pinnedAgents)) return agents;
    const pinSet = new Set(pinnedAgents.map((p: any) => p.agentId));
    return agents.map((a: any) => ({ ...a, isPinned: pinSet.has(a.agentId) }));
  }, [agents, pinnedAgents]);

  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleChat = (agentId: string) => {
    navigate({ to: '/chat/new/$agentId', params: { agentId } })
  }

  const handleTogglePin = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation()
    await togglePin.mutateAsync(agentId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto py-12 px-6 space-y-12"
    >
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <div className="h-px w-12 bg-primary" aria-hidden="true"></div>
              <span className="text-primary">Community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-black text-foreground uppercase tracking-tight">
              Discover
            </h1>
            <p className="font-sans text-sm text-foreground/50 font-light max-w-lg">
              Explore AI assistants built by the community. Pin useful agents and start chatting instantly.
            </p>
          </div>

          <div className="w-full md:w-[400px] shrink-0">
            <div className="relative">
              <label htmlFor="discover-search" className="sr-only">Search community agents</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" aria-hidden="true" />
              <input
                id="discover-search"
                placeholder="Search agents..."
                className="pl-10 w-full h-10 bg-transparent border border-border font-mono text-xs text-foreground focus:border-primary focus:outline-none transition-colors placeholder:text-foreground/20 px-3"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Results count */}
      <div className="flex items-center justify-between" aria-live="polite">
        <p className="font-mono text-[10px] text-foreground/20 uppercase tracking-widest">
          {isLoading ? 'Searching...' : `${agentsList.length} agent${agentsList.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[320px] bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
          {agentsList.map((agent: any) => (
            <article
              key={agent.agentId}
              aria-label={`Community agent: ${agent.name}`}
              className="bg-card border border-border p-8 hover:bg-secondary transition-all duration-200 group cursor-pointer flex flex-col min-h-[320px] relative hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 focus-within:bg-secondary"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChat(agent.agentId); } }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => handleTogglePin(e, agent.agentId)}
                      aria-label={agent.isPinned ? 'Unpin agent' : 'Pin to sidebar'}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center transition-all bg-transparent border-none cursor-pointer",
                        agent.isPinned ? "text-primary" : "text-foreground/20 hover:text-foreground/50"
                      )}
                    >
                      {agent.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{agent.isPinned ? 'Unpin' : 'Pin to sidebar'}</TooltipContent>
                </Tooltip>
              </div>

              <h3 className="font-sans font-black text-xl text-foreground group-hover:text-primary transition-colors mb-2 uppercase tracking-tight">
                {agent.name}
              </h3>
              <p className="font-sans text-xs text-foreground/40 font-light leading-relaxed line-clamp-3 min-h-[48px]">
                {agent.description || "An AI assistant ready to help with your tasks."}
              </p>

              {/* Author info */}
              {agent.createdBy && (
                <div className="flex items-center gap-1.5 mt-3 font-mono text-[9px] text-foreground/20 uppercase tracking-widest">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  <span>by {agent.createdBy}</span>
                </div>
              )}

              <div className="mt-auto pt-6 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {agent.tags?.map((tag: string) => (
                    <span key={tag} className="font-mono text-[8px] uppercase tracking-widest px-2 py-1 bg-foreground/5 text-foreground/30 border border-border">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleChat(agent.agentId)}
                  aria-label={`Start chat with ${agent.name}`}
                  className="w-full bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest py-3 hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Start Chat
                </button>
              </div>
            </article>
          ))}

          {(!agents || agents.length === 0) && (
            <div className="col-span-full bg-card p-20 text-center space-y-4">
              <Globe className="h-12 w-12 mx-auto text-foreground/10 mb-4" aria-hidden="true" />
              <h3 className="font-sans font-black text-xl text-foreground uppercase">No Agents Found</h3>
              <p className="font-mono text-xs text-foreground/30 uppercase tracking-widest max-w-md mx-auto">
                {search ? 'Try a different search term or clear the filter.' : 'No public agents are available yet. Be the first to publish one!'}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
