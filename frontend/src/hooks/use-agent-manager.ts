import { useState, useMemo } from 'react';
import { useMyAgents, useCreateAgent, usePinnedAgents } from '../api/agents';
import { toast } from 'sonner';

export function useAgentManager() {
  const { data: agentsResponse, isLoading: isAgentsLoading } = useMyAgents();
  const createAgent = useCreateAgent();

  const { data: pinnedAgents } = usePinnedAgents({ enabled: true });

  const agentList = useMemo(() => {
    // Handle both paginated response { agents: [], total } and legacy array response
    const agentsArray = agentsResponse?.agents ?? agentsResponse ?? [];
    if (!Array.isArray(agentsArray)) return [];
    if (!Array.isArray(pinnedAgents)) return agentsArray;
    const pinSet = new Set(pinnedAgents.map((p: any) => p.agentId));
    return agentsArray.map((a: any) => ({ ...a, isPinned: pinSet.has(a.agentId) }));
  }, [agentsResponse, pinnedAgents]);

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryReadAccess, setMemoryReadAccess] = useState('private');
  const [memoryWriteAccess, setMemoryWriteAccess] = useState('private');
  const [ragEnabled, setRagEnabled] = useState(true);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const filteredAgents = useMemo(() => {
    return agentList.filter(
      (a: { name: string; description?: string }) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [agentList, search]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstructions('');
    setTags('');
    setVisibility('private');
    setMemoryEnabled(true);
    setMemoryReadAccess('private');
    setMemoryWriteAccess('private');
    setRagEnabled(true);
    setSelectedTools([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgent.mutateAsync({
        name,
        description,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        config: {
          instructions,
          tools: selectedTools,
          memoryEnabled,
          memoryReadAccess,
          memoryWriteAccess,
          ragEnabled,
        },
        accessRules: { type: visibility as 'private' | 'public' },
      });
      setShowCreate(false);
      resetForm();
      toast.success('Agent created successfully');
    } catch (err: any) {
      toast.error('Failed to create agent', { description: err.message });
      console.error('Failed to create agent', err);
    }
  };

  return {
    // Queries
    isAgentsLoading,
    filteredAgents,
    agentList,
    
    // Mutations
    isCreating: createAgent.isPending,
    
    // State
    showCreate,
    setShowCreate,
    search,
    setSearch,
    
    // Form State
    name, setName,
    description, setDescription,
    instructions, setInstructions,
    tags, setTags,
    visibility, setVisibility,
    memoryEnabled, setMemoryEnabled,
    memoryReadAccess, setMemoryReadAccess,
    memoryWriteAccess, setMemoryWriteAccess,
    ragEnabled, setRagEnabled,
    selectedTools, setSelectedTools,
    
    // Handlers
    handleCreate,
    resetForm,
  };
}
