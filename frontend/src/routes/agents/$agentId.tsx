/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useAgent,
  useUpdateAgent,
  useDeployAgent,
  useUploadKb,
  useAgentMemories,
  useTogglePinAgent,
  useJobStatus,
  useKnowledgeBase,
  useDeleteKbDoc,
  usePinnedAgents,
  useLatestJobStatus,
} from '../../api/agents';
import { useMyTools } from '../../api/tools';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import {
  ArrowLeft,
  Upload,
  Brain,
  Shield,
  Settings2,
  Pin,
  PinOff,
  Eye,
  PenTool,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export const Route = createFileRoute('/agents/$agentId')({
  component: AgentDetail,
});

function AgentDetail() {
  const { agentId } = Route.useParams();
  const { data: agent, isLoading } = useAgent(agentId);
  const { data: memories } = useAgentMemories(agentId);
  const { data: kbDocs } = useKnowledgeBase(agentId);
  const { data: allTools } = useMyTools();
  const deleteKbDoc = useDeleteKbDoc();
  const updateAgent = useUpdateAgent();
  const deployAgent = useDeployAgent();
  const uploadKb = useUploadKb();
  const togglePin = useTogglePinAgent();
  const { confirm } = useConfirm();

  const { data: pinnedAgents } = usePinnedAgents({ enabled: true });

  const agentWithPin = useMemo(() => {
    if (!agent) return null;
    if (!Array.isArray(pinnedAgents)) return agent;
    const isPinned = pinnedAgents.some((p: any) => p.agentId === agent?.agentId);
    return { ...agent, isPinned };
  }, [agent, pinnedAgents]);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { data: specificJobStatus } = useJobStatus(agentId, activeJobId || '');
  const { data: latestJobStatus } = useLatestJobStatus(agentId);

  const jobStatus = activeJobId ? specificJobStatus : latestJobStatus;

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryReadAccess, setMemoryReadAccess] = useState('private');
  const [memoryWriteAccess, setMemoryWriteAccess] = useState('private');
  const [ragEnabled, setRagEnabled] = useState(true);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setInstructions(agent.config.instructions);
      setDescription(agent.description || '');
      setVisibility(agent.accessRules.type);
      setMemoryEnabled(agent.config.memoryEnabled);
      setMemoryReadAccess(agent.config.memoryReadAccess || 'private');
      setMemoryWriteAccess(agent.config.memoryWriteAccess || 'private');
      setRagEnabled(agent.config.ragEnabled);

      if (agent.config.tools && Array.isArray(allTools)) {
        const ids = agent.config.tools
          .map((at: any) => {
            const matched = allTools.find((t: any) => t.name === at.name);
            return matched?.toolId;
          })
          .filter(Boolean);
        setSelectedToolIds(ids);
      }
    }
  }, [agent, allTools]);

  const handleUpdate = async () => {
    try {
      await updateAgent.mutateAsync({
        id: agentId,
        data: {
          name,
          description,
          config: {
            ...agent.config,
            instructions,
            memoryEnabled,
            memoryReadAccess,
            memoryWriteAccess,
            ragEnabled,
            tools: selectedToolIds,
          },
          accessRules: { type: visibility as any },
        },
      });
      toast.success('Agent updated successfully');
    } catch (err: any) {
      toast.error('Failed to update agent', { description: err.message });
    }
  };

  const handleDeploy = async () => {
    try {
      await deployAgent.mutateAsync(agentId);
      toast.success('Agent deployed successfully');
    } catch (err: any) {
      toast.error('Failed to deploy agent', { description: err.message });
    }
  };

  const handleTogglePin = async () => {
    try {
      await togglePin.mutateAsync(agentId);
      toast.success(agentWithPin?.isPinned ? 'Agent unpinned' : 'Agent pinned');
    } catch (err: any) {
      toast.error('Failed to pin/unpin agent', { description: err.message });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await uploadKb.mutateAsync({ id: agentId, file });
      setActiveJobId(result.jobId);
      setFile(null);
      toast.info('Knowledge base upload started');
    } catch (err: any) {
      toast.error('Failed to upload knowledge base', { description: err.message });
    }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const isConfirmed = await confirm({
      title: 'Delete Document',
      description:
        'Are you sure you want to delete this document from the knowledge base? This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteKbDoc.mutateAsync({ agentId, docId });
        toast.success('Document deleted successfully');
      } catch (err: any) {
        toast.error('Failed to delete document', { description: err.message });
      }
    }
  };

  const getProgress = () => {
    if (!jobStatus || !jobStatus.totalChunks) return 0;
    return Math.round((jobStatus.processedChunks / jobStatus.totalChunks) * 100);
  };

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading agent details...</div>;
  if (!agent) return <div className="p-8 text-center text-red-400">Agent not found</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 h-10 w-10 text-white/40 hover:text-white rounded-none hidden md:flex"
          >
            <Link to="/agents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[#3D81CC] mb-2">
              <div className="h-px w-8 bg-[#3D81CC]"></div>
              <span>Edit Agent</span>
            </div>
            <h2 className="font-sans font-black text-2xl text-white uppercase tracking-tight">
              {name || 'Agent Setup'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleTogglePin}
            className={cn(
              'h-10 w-10 shrink-0 rounded-none transition-colors border',
              agentWithPin.isPinned
                ? 'text-[#3D81CC] border-[#3D81CC]/30 bg-[#3D81CC]/10'
                : 'text-white/40 border-white/10 hover:text-white hover:bg-white/5',
            )}
          >
            {agentWithPin.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={agent.deployed || deployAgent.isPending}
            className={cn(
              'h-10 rounded-none font-mono uppercase tracking-widest text-[10px] px-6 transition-colors',
              !agent.deployed
                ? 'bg-[#3D81CC] hover:bg-[#3D81CC]/90 text-white'
                : 'bg-white/10 text-white/40 cursor-not-allowed hidden',
            )}
          >
            {deployAgent.isPending ? 'Deploying...' : agent.deployed ? 'Deployed' : 'Deploy Agent'}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateAgent.isPending}
            className="h-10 rounded-none bg-white font-mono uppercase tracking-widest text-[10px] text-black hover:bg-white/90 px-6 shrink-0"
          >
            {updateAgent.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Brain className="h-5 w-5 text-[#3D81CC]" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-tight">
                Configuration
              </h3>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="e.g. Senior Researcher"
                  />
                  <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
                    ID: {agent.agentId}
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                    Visibility
                  </label>
                  <Select
                    value={visibility}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setVisibility(e.target.value)
                    }
                  >
                    <option value="private">Private (Workspace Only)</option>
                    <option value="public">Public (Community)</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What is the primary goal of this agent?"
                />
              </div>

              <div className="space-y-3">
                <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                  System Instructions
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setInstructions(e.target.value)
                  }
                  className="min-h-[300px]"
                  placeholder="Think step by step. You are an expert in..."
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-1 mb-4">
                  <label className="font-mono text-xs text-white tracking-widest uppercase flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-[#3D81CC]" /> Custom Tools
                  </label>
                  <p className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
                    External tools this agent can invoke.
                  </p>
                </div>

                {!Array.isArray(allTools) || allTools.length === 0 ? (
                  <div className="p-6 border border-dashed border-white/10 bg-[#111] text-center">
                    <p className="font-mono text-xs text-white/30">No custom tools defined.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
                    {allTools.map((tool: any, index: number) => {
                      const isChecked = selectedToolIds.includes(tool.toolId);
                      const elementId = `tool-${tool.toolId || index}`;
                      return (
                        <label
                          key={tool.toolId || index}
                          htmlFor={elementId}
                          className={cn(
                            'p-4 transition-all cursor-pointer flex items-start gap-3',
                            isChecked ? 'bg-[#3D81CC]/10' : 'bg-[#0a0a0a] hover:bg-[#111]',
                          )}
                        >
                          <Checkbox
                            id={elementId}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedToolIds([...selectedToolIds, tool.toolId]);
                              } else {
                                setSelectedToolIds(
                                  selectedToolIds.filter((id) => id !== tool.toolId),
                                );
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="space-y-1 min-w-0">
                            <p className="font-mono text-xs text-white truncate">{tool.name}</p>
                            <p className="font-mono text-[9px] text-white/30 truncate">
                              {tool.description}
                            </p>
                            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 bg-white/5 text-white/40 tracking-widest inline-block mt-1">
                              {tool.method}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#3D81CC]" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-tight">
                Features & Storage
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-3 cursor-pointer p-4 border border-white/10 bg-[#111]">
                  <Checkbox
                    id="memory"
                    checked={memoryEnabled}
                    onCheckedChange={(checked) => setMemoryEnabled(!!checked)}
                  />
                  <div className="space-y-0.5 w-full">
                    <label
                      htmlFor="memory"
                      className="font-mono text-xs text-white cursor-pointer block"
                    >
                      B8s Memory
                    </label>
                    <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                      Store and recall facts
                    </p>
                  </div>
                </div>

                {memoryEnabled && (
                  <div className="space-y-6 p-4 border border-white/10 bg-[#111] animate-in fade-in">
                    <div className="space-y-3">
                      <label className="font-mono text-[9px] text-white/30 tracking-widest uppercase flex items-center gap-2">
                        <Eye className="h-3 w-3" /> Read Access
                      </label>
                      <Select
                        value={memoryReadAccess}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setMemoryReadAccess(e.target.value)
                        }
                      >
                        <option value="private">Private (Owner only)</option>
                        <option value="public">Public (Shared)</option>
                        <option value="created_only">Created Only</option>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <label className="font-mono text-[9px] text-white/30 tracking-widest uppercase flex items-center gap-2">
                        <PenTool className="h-3 w-3" /> Write Access
                      </label>
                      <Select
                        value={memoryWriteAccess}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setMemoryWriteAccess(e.target.value)
                        }
                      >
                        <option value="private">Private (Owner only)</option>
                        <option value="public">Public (Anyone)</option>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 cursor-pointer p-4 border border-white/10 bg-[#111]">
                  <Checkbox
                    id="rag"
                    checked={ragEnabled}
                    onCheckedChange={(checked) => setRagEnabled(!!checked)}
                  />
                  <div className="space-y-0.5 w-full">
                    <label
                      htmlFor="rag"
                      className="font-mono text-xs text-white cursor-pointer block"
                    >
                      Knowledge Base
                    </label>
                    <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                      Document grounding
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Upload className="h-5 w-5 text-[#3D81CC]" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-tight">
                Knowledge Base
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {!jobStatus || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? (
                <div className="space-y-4">
                  <div className="border border-dashed border-white/20 bg-[#111] p-6 text-center hover:border-white/40 transition-colors">
                    <input
                      type="file"
                      id="kb-upload"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="kb-upload" className="cursor-pointer space-y-3 block">
                      <div className="bg-[#3D81CC]/10 p-3 w-fit mx-auto text-[#3D81CC]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 truncate mx-auto">
                        {file ? file.name : 'Click to upload'}
                      </p>
                    </label>
                  </div>
                  {jobStatus?.status === 'completed' && (
                    <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-400/5 p-3 border border-green-400/20 font-mono uppercase tracking-widest">
                      <CheckCircle2 className="h-3 w-3" /> Ingestion successful
                    </div>
                  )}
                  {jobStatus?.status === 'failed' && (
                    <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-400/5 p-3 border border-red-400/20 font-mono uppercase tracking-widest">
                      <AlertCircle className="h-3 w-3" /> {jobStatus.error || 'Ingestion failed'}
                    </div>
                  )}
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploadKb.isPending}
                    variant="default"
                    className="w-full bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase tracking-widest text-[10px] h-10"
                  >
                    {uploadKb.isPending ? 'Starting...' : 'Ingest Document'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 border border-white/10 bg-[#111] animate-in fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-[#3D81CC] flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {jobStatus.status === 'processing' ? 'Ingesting...' : 'Queued'}
                    </span>
                    <span className="font-mono text-[10px] text-[#3D81CC]">{getProgress()}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3D81CC] transition-all duration-500 ease-out"
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                  <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest text-center mt-2">
                    {jobStatus.processedChunks} of {jobStatus.totalChunks} chunks processed
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase block">
                  Active Documents ({kbDocs?.length || 0})
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {kbDocs?.map((doc: any) => (
                    <div
                      key={doc.docId}
                      className="group flex items-center justify-between p-3 bg-[#111] border border-white/5 hover:border-red-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-white/40 shrink-0" />
                        <span className="font-mono text-[10px] text-white/80 truncate">
                          {doc.fileName}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteDoc(e, doc.docId)}
                        className="h-6 w-6 text-white/20 hover:text-red-400 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!kbDocs || kbDocs.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-white/10 bg-[#111]">
                      <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                        Empty knowledge base
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-[#3D81CC]" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-tight">
                Memories
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {memories?.items?.map((m: any) => (
                  <div
                    key={m.memoryId}
                    className="font-mono text-[10px] p-3 bg-[#111] border border-white/5 text-white/60 leading-relaxed"
                  >
                    {m.text}
                  </div>
                ))}
                {(!memories?.items || memories.items.length === 0) && (
                  <div className="text-center py-6 border border-dashed border-white/10 bg-[#111]">
                    <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                      No memories yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
