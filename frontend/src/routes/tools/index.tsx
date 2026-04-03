import { createFileRoute } from '@tanstack/react-router';
import { useMyTools, useCreateTool, useDeleteTool, useUpdateTool } from '../../api/tools';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Wrench, Plus, Trash2, Code, Braces } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/tools/')({
  component: ToolsPage,
});

type ParamLocation = 'query' | 'header' | 'path' | 'body';

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  location: ParamLocation;
  objectSchema?: string;
}

function ToolsPage() {
  const { data: tools, isLoading } = useMyTools();
  const toolsList = Array.isArray(tools) ? tools : [];

  const createTool = useCreateTool();
  const deleteTool = useDeleteTool();
  const { confirm } = useConfirm();

  const [showCreate, setShowCreate] = useState(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [parameters, setParameters] = useState<ToolParameter[]>([]);
  const updateTool = useUpdateTool();

  const [errorMsg, setErrorMsg] = useState('');

  const handleEdit = (e: React.MouseEvent, tool: any) => {
    e.stopPropagation();

    setName(tool.name);
    setDescription(tool.description);
    setUrl(tool.url);
    setMethod(tool.method);

    const newParams: ToolParameter[] = [];

    if (tool.headers) {
      Object.entries(tool.headers).forEach(([key, value]) => {
        newParams.push({
          name: key,
          type: 'string',
          description: String(value).replace(/^{|}$/g, ''),
          isRequired: true,
          location: 'header',
        });
      });
    }

    if (tool.apiSchema?.properties) {
      Object.entries(tool.apiSchema.properties).forEach(([key, schema]: [string, any]) => {
        if (newParams.find((p) => p.name === key)) return;

        const isRequired =
          Array.isArray(tool.apiSchema.required) && tool.apiSchema.required.includes(key);

        let location: ParamLocation = 'query';
        if (tool.url.includes(`{${key}}`)) {
          location = 'path';
        } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(tool.method)) {
          location = 'body';
        }

        const param: ToolParameter = {
          name: key,
          type: schema.type || 'string',
          description: schema.description || '',
          isRequired,
          location,
        };

        if (schema.type === 'object') {
          const { description: _, ...restSchema } = schema;
          param.objectSchema = JSON.stringify(restSchema, null, 2);
        }

        newParams.push(param);
      });
    }

    setParameters(newParams);
    setEditingToolId(tool.toolId);
    setShowCreate(true);
  };

  useEffect(() => {
    const pathParams = [...url.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

    setParameters((prevParams) => {
      let hasChanges = false;
      const newParams = [...prevParams];

      pathParams.forEach((paramName) => {
        const existing = newParams.find((p) => p.name === paramName);
        if (existing) {
          if (existing.location !== 'path' || !existing.isRequired) {
            existing.location = 'path';
            existing.isRequired = true;
            hasChanges = true;
          }
        } else {
          newParams.push({
            name: paramName,
            type: 'string',
            description: `Path parameter: ${paramName}`,
            isRequired: true,
            location: 'path',
          });
          hasChanges = true;
        }
      });

      for (let i = 0; i < newParams.length; i++) {
        if (newParams[i].location === 'path' && !pathParams.includes(newParams[i].name)) {
          newParams[i] = { ...newParams[i], location: method === 'GET' ? 'query' : 'body' };
          hasChanges = true;
        }
      }

      return hasChanges ? newParams : prevParams;
    });
  }, [url, method]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const properties: any = {};
      const requiredParams: string[] = [];
      const headers: Record<string, string> = {};

      parameters.forEach((p) => {
        if (!p.name) return;

        if (p.location === 'header') {
          properties[p.name] = { type: p.type, description: `Header: ${p.description}` };
          headers[p.name] = `{${p.name}}`;
        } else {
          let paramSchema: any = { type: p.type, description: p.description };
          if (p.type === 'object' && p.objectSchema) {
            try {
              paramSchema = JSON.parse(p.objectSchema);
              paramSchema.description = p.description;
            } catch (err) {
              throw new Error(`Invalid JSON in object schema for parameter ${p.name}`);
            }
          }
          properties[p.name] = paramSchema;
        }

        if (p.isRequired) {
          requiredParams.push(p.name);
        }
      });

      const parsedSchema = {
        type: 'object',
        properties,
        required: requiredParams,
      };

      if (editingToolId) {
        await updateTool.mutateAsync({
          id: editingToolId,
          data: {
            name,
            description,
            url,
            method: method as any,
            headers,
            apiSchema: parsedSchema,
          },
        });
        toast.success('Tool updated successfully');
      } else {
        await createTool.mutateAsync({
          name,
          description,
          url,
          method: method as any,
          headers,
          apiSchema: parsedSchema,
        });
        toast.success('Tool created successfully');
      }
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid parameters configuration. Please check and try again.');
      toast.error(`Failed to ${editingToolId ? 'update' : 'create'} tool`, {
        description: err.message,
      });
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const isConfirmed = await confirm({
      title: 'Delete Custom Tool',
      description:
        'Are you sure you want to delete this tool? Any agents currently using it will lose access.',
      confirmText: 'Delete Tool',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteTool.mutateAsync(toolId);
        toast.success('Tool deleted');
      } catch (err: any) {
        toast.error('Failed to delete tool', { description: err.message });
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingToolId(null);
    setName('');
    setDescription('');
    setUrl('');
    setMethod('GET');
    setParameters([]);
  };

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        type: 'string',
        description: '',
        isRequired: false,
        location: method === 'GET' ? 'query' : 'body',
      },
    ]);
  };

  const updateParameter = (index: number, updates: Partial<ToolParameter>) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setParameters(newParams);
  };

  const removeParameter = (index: number) => {
    const newParams = parameters.filter((_, i) => i !== index);
    setParameters(newParams);
  };

  if (isLoading)
    return (
      <div className="p-12 text-center font-mono text-xs text-foreground/30 uppercase tracking-widest animate-pulse">
        Loading tools...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto py-12 px-6 space-y-12"
    >
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
              <div className="h-px w-12 bg-primary" aria-hidden="true"></div>
              <span className="text-primary">API Integrations</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-black text-foreground uppercase tracking-tight">
              Custom Tools
            </h1>
            <p className="font-sans text-sm text-foreground/50 font-light max-w-lg">
              Define external API connections for your agents to use.
            </p>
          </div>
          {!showCreate && (
            <Button
              onClick={() => setShowCreate(true)}
              variant="default"
              className="h-11 px-6"
              aria-label="Create a new tool"
            >
              <Plus className="mr-2 h-4 w-4" /> New Tool
            </Button>
          )}
        </div>
      </header>

      {showCreate ? (
        /* ==================== CREATE / EDIT FORM ==================== */
        <div className="bg-card border border-border overflow-hidden">
          <div className="p-8 border-b border-border">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30 mb-4">
              <div className="h-px w-12 bg-primary" aria-hidden="true"></div>
              <span className="text-primary">{editingToolId ? 'Edit Tool' : 'New Tool'}</span>
            </div>
            <h2 className="font-sans font-black text-2xl text-foreground uppercase tracking-tight">
              Configure Tool
            </h2>
            <p className="font-sans text-sm text-foreground/40 font-light mt-2">
              Give your agents the ability to interface with external APIs.
            </p>
          </div>
          <form onSubmit={handleCreate}>
            <div className="p-8 space-y-8">
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs" role="alert">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label htmlFor="tool-name" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                    Name
                  </label>
                  <Input
                    id="tool-name"
                    placeholder="e.g. search_github"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
                    required
                  />
                  <p className="font-mono text-[9px] text-foreground/20 tracking-widest uppercase">
                    Only letters, numbers, and underscores.
                  </p>
                </div>
                <div className="space-y-3">
                  <label htmlFor="tool-description" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                    Description
                  </label>
                  <Input
                    id="tool-description"
                    placeholder="Search github repositories..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3 col-span-2">
                  <label htmlFor="tool-url" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                    API URL
                  </label>
                  <Input
                    id="tool-url"
                    type="url"
                    placeholder="https://api.github.com/search/repositories"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <p className="font-mono text-[9px] text-foreground/20 tracking-widest uppercase">
                    Use {'{paramName}'} to inject variables into the path.
                  </p>
                </div>
                <div className="space-y-3">
                  <label htmlFor="tool-method" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                    Method
                  </label>
                  <Select
                    id="tool-method"
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      if (e.target.value === 'GET') {
                        setParameters((params) =>
                          params.map((p) =>
                            p.location === 'body' ? { ...p, location: 'query' } : p,
                          ),
                        );
                      }
                    }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </Select>
                </div>
              </div>

              {/* Parameters Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-mono text-xs text-foreground tracking-widest uppercase flex items-center gap-2">
                      <Braces className="h-4 w-4 text-primary" /> Parameters
                    </label>
                    <p className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase mt-1">
                      Configure headers, query string, or body arguments.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParameter}
                    aria-label="Add a new parameter"
                  >
                    <Plus className="mr-2 h-3 w-3" /> Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {parameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 p-4 bg-secondary border border-border relative group"
                    >
                      <div className="flex flex-wrap md:flex-nowrap gap-3 w-full pr-8">
                        <Select
                          value={param.location}
                          onChange={(e) =>
                            updateParameter(index, { location: e.target.value as ParamLocation })
                          }
                          className="w-[110px] border border-border bg-card px-2"
                          disabled={param.location === 'path'}
                          aria-label={`Parameter ${index + 1} location`}
                        >
                          <option value="query">Query</option>
                          <option value="header">Header</option>
                          {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
                            <option value="body">Body</option>
                          )}
                          {param.location === 'path' && <option value="path">Path</option>}
                        </Select>

                        <Input
                          placeholder="Key (e.g. q, Authorization)"
                          value={param.name}
                          onChange={(e) =>
                            updateParameter(index, {
                              name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''),
                            })
                          }
                          className="flex-1 min-w-[150px] border-b border-border"
                          disabled={param.location === 'path'}
                          required
                          aria-label={`Parameter ${index + 1} name`}
                        />

                        <Select
                          value={param.type}
                          onChange={(e) => updateParameter(index, { type: e.target.value })}
                          className="w-[110px] border border-border bg-card px-2"
                          aria-label={`Parameter ${index + 1} type`}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          {param.location === 'body' && <option value="object">Object</option>}
                        </Select>

                        <Input
                          placeholder="Instructions for the agent"
                          value={param.description}
                          onChange={(e) => updateParameter(index, { description: e.target.value })}
                          className="flex-[2] min-w-[200px] border-b border-border"
                          required
                          aria-label={`Parameter ${index + 1} description`}
                        />

                        <div className="flex items-center gap-2 h-10 px-2 shrink-0">
                          <Checkbox
                            id={`req-${index}`}
                            checked={param.isRequired}
                            onCheckedChange={(checked) =>
                              updateParameter(index, { isRequired: !!checked })
                            }
                            disabled={param.location === 'path'}
                          />
                          <label
                            htmlFor={`req-${index}`}
                            className="font-mono text-[9px] text-foreground/30 cursor-pointer uppercase tracking-widest"
                          >
                            Req
                          </label>
                        </div>
                      </div>

                      {param.type === 'object' && param.location === 'body' && (
                        <div className="w-full mt-2">
                          <Textarea
                            placeholder='{"type": "object", "properties": { "foo": {"type": "string"} }}'
                            value={param.objectSchema || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              updateParameter(index, { objectSchema: e.target.value })
                            }
                            className="min-h-[100px]"
                            required
                            aria-label={`Parameter ${index + 1} JSON schema`}
                          />
                        </div>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => removeParameter(index)}
                            disabled={param.location === 'path'}
                            aria-label={`Remove parameter ${param.name || index + 1}`}
                            className="h-8 w-8 text-foreground/20 hover:text-red-400 absolute right-2 top-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all disabled:hidden bg-transparent border-none cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Remove parameter</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                  {parameters.length === 0 && (
                    <div className="text-center p-8 border border-dashed border-border bg-secondary">
                      <p className="font-mono text-xs text-foreground/30">
                        No parameters defined. The tool will not require any arguments.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-border flex gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTool.isPending || updateTool.isPending}
                variant="default"
                className="flex-[2]"
              >
                {(createTool.isPending || updateTool.isPending) ? 'Saving...' : 'Save Tool'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* ==================== TOOL LIST ==================== */
        <>
          <p className="font-mono text-[10px] text-foreground/20 uppercase tracking-widest" aria-live="polite">
            {toolsList.length} tool{toolsList.length !== 1 ? 's' : ''} configured
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-none">
            {toolsList.map((tool: any) => (
              <article
                key={tool.toolId}
                aria-label={`Tool: ${tool.name}`}
                className="bg-card border border-border p-8 hover:bg-secondary transition-all duration-200 group cursor-pointer flex flex-col min-h-[240px] relative hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEdit(e as any, tool); } }}
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => handleEdit(e, tool)}
                          aria-label={`Edit ${tool.name}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-primary transition-all h-8 w-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-foreground/30"
                        >
                          <Code className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Edit tool</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => handleDelete(e, tool.toolId)}
                          aria-label={`Delete ${tool.name}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-400 transition-all h-8 w-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-foreground/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete tool</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <h3 className="font-sans font-black text-xl text-foreground group-hover:text-primary transition-colors mb-2 uppercase tracking-tight truncate">
                  {tool.name}
                </h3>
                <p className="font-sans text-xs text-foreground/40 font-light leading-relaxed line-clamp-2 min-h-[32px]">
                  {tool.description}
                </p>

                <div className="mt-auto pt-4">
                  <div className="p-3 bg-secondary border border-border overflow-hidden">
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="font-bold text-foreground/50 uppercase bg-foreground/5 px-2 py-0.5">{tool.method}</span>
                      <span className="text-primary truncate">{tool.url}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {toolsList.length === 0 && (
              <div className="col-span-full bg-card p-20 text-center space-y-6">
                <Wrench className="h-12 w-12 mx-auto text-foreground/10" aria-hidden="true" />
                <h3 className="font-sans font-black text-2xl text-foreground uppercase">No Custom Tools</h3>
                <p className="font-sans text-sm text-foreground/40 font-light max-w-sm mx-auto">
                  Create tools to let your agents interface with the real world.
                </p>
                <Button
                  onClick={() => setShowCreate(true)}
                  variant="default"
                  className="h-11 px-8"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add First Tool
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
