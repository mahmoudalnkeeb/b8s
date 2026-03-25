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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Rocket,
  Upload,
  Brain,
  Save,
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

  // Use the explicitly active job status if there is one, otherwise fallback to the latest known job
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/agents">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="text-3xl font-bold tracking-tight bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:opacity-50"
            placeholder="Agent Name"
          />
          <p className="text-muted-foreground font-mono text-[10px] mt-1">ID: {agent.agentId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleTogglePin}
            className={cn(
              agentWithPin.isPinned
                ? 'text-blue-400 border-blue-400/30 bg-blue-400/5'
                : 'text-muted-foreground',
            )}
          >
            {agentWithPin.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={agent.deployed || deployAgent.isPending}
            variant={agent.deployed ? 'secondary' : 'default'}
            className={!agent.deployed ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {agent.deployed ? (
              <>
                <Rocket className="mr-2 h-4 w-4" /> Deployed
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" /> Deploy Agent
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 bg-secondary/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
            <CardHeader className="p-8 border-b border-border/20 bg-secondary/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-headline font-bold text-white">
                    System Instructions
                  </CardTitle>
                  <CardDescription>Configure how your agent thinks and responds</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Description
                </label>
                <Input
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDescription(e.target.value)
                  }
                  placeholder="What does this agent do?"
                  className="h-12 bg-background/50 border-border/40 text-base rounded-xl focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Instructions
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setInstructions(e.target.value)
                  }
                  className="bg-background/50 border-border/40 font-mono text-sm p-4 rounded-xl leading-relaxed focus-visible:ring-blue-500/50 min-h-[300px]"
                  placeholder="You are a helpful assistant that..."
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-border/20 p-8 bg-secondary/5">
              <Button
                onClick={handleUpdate}
                disabled={updateAgent.isPending}
                className="bg-white text-black hover:bg-white/90 font-bold px-8 h-11 rounded-xl shadow-xl transition-all border-none"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateAgent.isPending ? 'Saving...' : 'Save All Changes'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-border/40 bg-secondary/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
            <CardHeader className="p-6 border-b border-border/20 bg-secondary/10">
              <CardTitle className="flex items-center gap-3 text-lg font-headline font-bold text-white">
                <Shield className="h-5 w-5 text-orange-400" />
                Permissions & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Visibility
                </label>
                <Select
                  value={visibility}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setVisibility(e.target.value)
                  }
                  className="bg-background/50"
                >
                  <option value="private">Private (Only me)</option>
                  <option value="public">Public (Discover)</option>
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="mem-toggle" className="text-sm font-medium">
                    Long-term Memory
                  </label>
                  <Checkbox
                    id="mem-toggle"
                    checked={memoryEnabled}
                    onCheckedChange={(checked) => setMemoryEnabled(!!checked)}
                  />
                </div>
                {memoryEnabled && (
                  <div className="space-y-4 p-4 bg-background/30 rounded-xl border border-border/20 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <Eye className="h-3 w-3" /> Read Access
                      </label>
                      <Select
                        value={memoryReadAccess}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setMemoryReadAccess(e.target.value)
                        }
                        className="h-9 text-xs bg-background/50"
                      >
                        <option value="private">Private (Owner only)</option>
                        <option value="public">Public (Shared)</option>
                        <option value="created_only">Created Only</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <PenTool className="h-3 w-3" /> Write Access
                      </label>
                      <Select
                        value={memoryWriteAccess}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setMemoryWriteAccess(e.target.value)
                        }
                        className="h-9 text-xs bg-background/50"
                      >
                        <option value="private">Private (Owner only)</option>
                        <option value="public">Public (Anyone)</option>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label htmlFor="rag-toggle" className="text-sm font-medium">
                    Knowledge Base (RAG)
                  </label>
                  <Checkbox
                    id="rag-toggle"
                    checked={ragEnabled}
                    onCheckedChange={(checked) => setRagEnabled(!!checked)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/20">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-3 w-3 text-blue-400" /> Custom Tools
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(Array.isArray(allTools) ? allTools : []).map((tool: any) => (
                    <div
                      key={tool.toolId}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/30 hover:border-blue-400/30 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold truncate">{tool.name}</span>
                        <span className="text-[9px] text-muted-foreground truncate">
                          {tool.description}
                        </span>
                      </div>
                      <Checkbox
                        checked={selectedToolIds.includes(tool.toolId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedToolIds([...selectedToolIds, tool.toolId]);
                          } else {
                            setSelectedToolIds(selectedToolIds.filter((id) => id !== tool.toolId));
                          }
                        }}
                      />
                    </div>
                  ))}
                  {(!Array.isArray(allTools) || allTools.length === 0) && (
                    <p className="text-[9px] text-muted-foreground italic text-center py-2">
                      No custom tools defined
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-secondary/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
            <CardHeader className="p-6 border-b border-border/20 bg-secondary/10">
              <CardTitle className="flex items-center gap-3 text-lg font-headline font-bold text-white">
                <Upload className="h-5 w-5 text-blue-400" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!jobStatus || jobStatus.status === 'completed' || jobStatus.status === 'failed' ? (
                <>
                  <div className="border-2 border-dashed border-border/50 rounded-md p-4 text-center hover:border-blue-400/50 transition-colors">
                    <input
                      type="file"
                      id="kb-upload"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label htmlFor="kb-upload" className="cursor-pointer space-y-2">
                      <div className="bg-blue-400/10 p-2 rounded-full w-fit mx-auto">
                        <Upload className="h-6 w-6 text-blue-400" />
                      </div>
                      <p className="text-xs font-medium truncate max-w-[150px] mx-auto">
                        {file ? file.name : 'Click to upload'}
                      </p>
                    </label>
                  </div>
                  {jobStatus?.status === 'completed' && (
                    <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-400/5 p-2 rounded border border-green-400/20">
                      <CheckCircle2 className="h-3 w-3" /> Ingestion successful
                    </div>
                  )}
                  {jobStatus?.status === 'failed' && (
                    <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-400/5 p-2 rounded border border-red-400/20">
                      <AlertCircle className="h-3 w-3" /> {jobStatus.error || 'Ingestion failed'}
                    </div>
                  )}
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploadKb.isPending}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadKb.isPending ? 'Starting...' : 'Ingest Document'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4 p-4 bg-blue-400/5 border border-blue-400/20 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {jobStatus.status === 'processing' ? 'Ingesting...' : 'Queued'}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400">{getProgress()}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-blue-400/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground italic text-center">
                    {jobStatus.processedChunks} of {jobStatus.totalChunks} chunks processed
                  </p>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                  Active Documents ({kbDocs?.length || 0})
                </label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {kbDocs?.map((doc: any) => (
                    <div
                      key={doc.docId}
                      className="group flex items-center justify-between p-2 rounded-lg bg-background/40 border border-border/30 hover:border-blue-400/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="text-[10px] truncate font-medium">{doc.fileName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteDoc(e, doc.docId)}
                        className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!kbDocs || kbDocs.length === 0) && (
                    <div className="text-center py-4 border border-dashed border-border/30 rounded-lg">
                      <p className="text-[9px] text-muted-foreground italic">
                        Empty knowledge base
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-secondary/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
            <CardHeader className="p-6 border-b border-border/20 bg-secondary/10">
              <CardTitle className="text-lg flex items-center gap-3 font-headline font-bold text-white">
                <Settings2 className="h-5 w-5 text-gray-400" />
                Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {memories?.items?.map((m: any) => (
                  <div
                    key={m.memoryId}
                    className="text-[11px] p-2 rounded bg-background/40 border border-border/30 text-muted-foreground leading-relaxed"
                  >
                    {m.text}
                  </div>
                ))}
                {(!memories?.items || memories.items.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-muted-foreground italic">No memories yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
