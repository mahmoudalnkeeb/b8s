import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMyTools } from '../../api/tools';
import { useDeleteAgent, useTogglePinAgent } from '../../api/agents';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { useAgentManager } from '@/hooks/use-agent-manager';
import { CreateAgentForm } from '@/components/agents/create-agent-form';
import { AgentCardSkeleton } from '@/components/agents/agent-card-skeleton';
import { AgentCard } from '@/components/agents/agent-card';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/agents/')({
  component: MyAgents,
});

function MyAgents() {
  const navigate = useNavigate();
  const { data: tools } = useMyTools();
  const toolsList = Array.isArray(tools) ? tools : [];
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const manager = useAgentManager();
  const { confirm } = useConfirm();
  const deleteAgent = useDeleteAgent();
  const togglePin = useTogglePinAgent();

  const handleChat = useCallback((e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    navigate({ to: '/chat/new/$agentId', params: { agentId } });
  }, [navigate]);

  const handleAgentClick = useCallback((agentId: string) => {
    navigate({ to: '/agents/$agentId', params: { agentId } });
  }, [navigate]);

  const handleDelete = useCallback(async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const isConfirmed = await confirm({
      title: 'Delete Agent',
      description: 'Are you sure you want to delete this agent? All associated knowledge base documents, memories, and conversations will be permanently deleted.',
      confirmText: 'Delete',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteAgent.mutateAsync(agentId);
        toast.success('Agent deleted successfully');
      } catch (err: any) {
        toast.error('Failed to delete agent', { description: err.message });
      }
    }
  }, [confirm, deleteAgent]);

  const handleTogglePin = useCallback(async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await togglePin.mutateAsync(agentId);
      toast.success(res.isPinned ? 'Agent pinned' : 'Agent unpinned');
    } catch (err: any) {
      toast.error('Failed to toggle pin', { description: err.message });
    }
  }, [togglePin]);

  // Filter and sort agents
  const processedAgents = (() => {
    let list = manager.filteredAgents || [];
    if (statusFilter === 'active') list = list.filter((a: any) => a.deployed);
    if (statusFilter === 'draft') list = list.filter((a: any) => !a.deployed);
    if (sortBy === 'name') list = [...list].sort((a: any, b: any) => a.name.localeCompare(b.name));
    if (sortBy === 'date') list = [...list].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  })();

  if (manager.isAgentsLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const activeAgentsCount = manager.agentList.filter((a: any) => a.deployed).length;
  const totalAgentsCount = manager.agentList.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto py-12 px-6 space-y-12 pb-32"
    >
      {/* Header */}
      <header className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <div className="h-px w-12 bg-primary" aria-hidden="true"></div>
              <span className="text-primary">Agent Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-black text-foreground uppercase tracking-tight">
              Your Agents
            </h1>
            <p className="font-sans text-sm text-foreground/50 font-light max-w-lg">
              Manage and deploy your AI assistants from here.
            </p>
          </div>
          {!manager.showCreate && (
            <Button
              onClick={() => manager.setShowCreate(true)}
              variant="default"
              className="h-11 px-6"
              aria-label="Create a new agent"
            >
              <Plus className="mr-2 h-4 w-4" /> New Agent
            </Button>
          )}
        </div>
      </header>

      {/* Metrics */}
      {!manager.showCreate && (
        <section aria-label="Agent statistics" className="grid grid-cols-1 md:grid-cols-3 gap-4 border-none">
          <div className="bg-card p-8 hover:bg-secondary transition-colors">
            <p className="font-mono text-[10px] text-foreground/30 tracking-widest uppercase mb-4">01 — Total Agents</p>
            <p className="font-sans text-3xl font-black text-foreground">{totalAgentsCount}</p>
            <p className="font-mono text-[10px] text-primary mt-2">{activeAgentsCount} active</p>
          </div>
          <div className="bg-card p-8 hover:bg-secondary transition-colors">
            <p className="font-mono text-[10px] text-foreground/30 tracking-widest uppercase mb-4">02 — Active Agents</p>
            <p className="font-sans text-3xl font-black text-foreground">{activeAgentsCount}</p>
            <p className="font-mono text-[10px] text-primary mt-2">{activeAgentsCount} online</p>
          </div>
          <div className="bg-card p-8 hover:bg-secondary transition-colors">
            <p className="font-mono text-[10px] text-foreground/30 tracking-widest uppercase mb-4">03 — Draft Agents</p>
            <p className="font-sans text-3xl font-black text-foreground">{totalAgentsCount - activeAgentsCount}</p>
            <p className="font-mono text-[10px] text-foreground/40 mt-2">Awaiting deployment</p>
          </div>
        </section>
      )}

      {/* Main Content */}
      {manager.showCreate ? (
        <CreateAgentForm
          state={manager}
          toolsList={toolsList}
          isCreating={manager.isCreating}
          onSubmit={manager.handleCreate}
          onCancel={() => manager.setShowCreate(false)}
        />
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">All Agents</h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex gap-px border border-border" role="radiogroup" aria-label="Filter by status">
                {(['all', 'active', 'draft'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    role="radio"
                    aria-checked={statusFilter === filter}
                    className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors border-none cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground/30 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <button
                onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
                aria-label={`Sort by ${sortBy === 'name' ? 'date' : 'name'}`}
                className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest bg-card text-foreground/30 hover:text-foreground border border-border transition-colors cursor-pointer hover:bg-secondary"
              >
                <ArrowUpDown className="h-3 w-3" />
                {sortBy === 'name' ? 'A–Z' : 'Recent'}
              </button>

              {/* Search - Desktop */}
              <div className="relative hidden md:block">
                <label htmlFor="agent-search" className="sr-only">Filter agents</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" aria-hidden="true" />
                <input
                  id="agent-search"
                  type="search"
                  placeholder="Filter agents..."
                  className="pl-10 w-48 h-10 bg-transparent border border-border font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-foreground/20 px-3 rounded-none"
                  value={manager.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => manager.setSearch(e.target.value)}
                />
              </div>

              {/* Search Toggle - Mobile */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                aria-label="Toggle search"
                className="md:hidden flex items-center justify-center w-10 h-10 border border-border bg-card text-foreground/40 hover:text-foreground transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showMobileSearch && (
            <div className="md:hidden relative">
              <label htmlFor="agent-search-mobile" className="sr-only">Filter agents</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" aria-hidden="true" />
              <input
                id="agent-search-mobile"
                type="search"
                placeholder="Filter agents..."
                className="w-full pl-10 h-12 bg-card border border-border font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-foreground/20 px-3 rounded-none"
                value={manager.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => manager.setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Results count */}
          <p className="font-mono text-[10px] text-foreground/20 uppercase tracking-widest" aria-live="polite">
            {processedAgents.length} agent{processedAgents.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
            {processedAgents.length === 0 ? (
              <div className="col-span-full bg-card p-16 text-center space-y-6">
                <p className="font-mono text-[10px] text-foreground/20 tracking-widest uppercase">
                  {statusFilter !== 'all' ? `No ${statusFilter} agents` : 'No agents deployed'}
                </p>
                <h3 className="text-2xl font-sans font-black text-foreground uppercase">
                  {statusFilter !== 'all' ? 'Try a different filter' : 'Create Your First Agent'}
                </h3>
                <p className="font-sans text-sm text-foreground/40 font-light max-w-sm mx-auto">
                  {statusFilter !== 'all'
                    ? 'Change the filter to see other agents.'
                    : 'Build your first AI assistant to start automating tasks and workflows.'}
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => manager.setShowCreate(true)} variant="default" className="h-11 px-8">
                    <Plus className="mr-2 h-4 w-4" /> New Agent
                  </Button>
                )}
              </div>
            ) : (
              processedAgents.map((agent: any) => (
                <AgentCard
                  key={agent.agentId}
                  agent={agent}
                  isPending={false}
                  onChat={handleChat}
                  onClick={() => handleAgentClick(agent.agentId)}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
}
