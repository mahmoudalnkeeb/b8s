import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Eye, PenTool, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export interface CreateAgentFormProps {
  state: any;
  toolsList: any[];
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CreateAgentForm = React.memo(({ state, toolsList, isCreating, onSubmit, onCancel }: CreateAgentFormProps) => {
  const [touched, setTouched] = useState({ name: false, instructions: false });

  const nameError = touched.name && !state.name.trim();
  const instructionsError = touched.instructions && !state.instructions.trim();

  const handleSubmit = (e: React.FormEvent) => {
    if (!state.name.trim() || !state.instructions.trim()) {
      setTouched({ name: true, instructions: true });
      e.preventDefault();
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="p-8 border-b border-border">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30 mb-4">
          <div className="h-px w-12 bg-primary"></div>
          <span className="text-primary">New Agent</span>
        </div>
        <h2 className="font-sans font-black text-2xl text-foreground uppercase tracking-tight">
          Configure Assistant
        </h2>
        <p className="font-sans text-sm text-foreground/40 font-light mt-2">
          Define the identity and capabilities of your agent.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="agent-name" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                Name <span className="text-red-400">*</span>
              </label>
              <Input
                id="agent-name"
                placeholder="e.g. Senior Researcher"
                value={state.name}
                onChange={(e) => state.setName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                aria-invalid={nameError}
                className={cn(nameError && "border-red-400 focus:border-red-400 focus:ring-red-400")}
                required
              />
              {nameError && (
                <p className="font-mono text-[9px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Agent name is required
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label htmlFor="agent-visibility" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
                Visibility
              </label>
              <Select
                id="agent-visibility"
                value={state.visibility}
                onChange={(e) => state.setVisibility(e.target.value)}
              >
                <option value="private">Private (Workspace Only)</option>
                <option value="public">Public (Community)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="agent-description" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
              Description
            </label>
            <Input
              id="agent-description"
              placeholder="What is the primary goal of this agent?"
              value={state.description}
              onChange={(e) => state.setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="agent-instructions" className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase block">
              Core Instructions <span className="text-red-400">*</span>
            </label>
            <Textarea
              id="agent-instructions"
              placeholder="Think step by step. You are an expert in..."
              value={state.instructions}
              onChange={(e) => state.setInstructions(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, instructions: true }))}
              aria-invalid={instructionsError}
              className={cn("min-h-[200px]", instructionsError && "border-red-400 focus:border-red-400 focus:ring-red-400")}
              required
            />
            {instructionsError && (
              <p className="font-mono text-[9px] text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Instructions are required
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-8 p-6 border border-border bg-secondary">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  id="memory"
                  checked={state.memoryEnabled}
                  onCheckedChange={(checked) => state.setMemoryEnabled(!!checked)}
                />
                <div className="space-y-0.5">
                  <label htmlFor="memory" className="font-mono text-xs text-foreground cursor-pointer">
                    B8s Memory
                  </label>
                  <p className="font-mono text-[9px] text-foreground/30 uppercase tracking-widest">
                    Store and recall facts
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  id="rag"
                  checked={state.ragEnabled}
                  onCheckedChange={(checked) => state.setRagEnabled(!!checked)}
                />
                <div className="space-y-0.5">
                  <label htmlFor="rag" className="font-mono text-xs text-foreground cursor-pointer">
                    Knowledge Base
                  </label>
                  <p className="font-mono text-[9px] text-foreground/30 uppercase tracking-widest">
                    Document grounding
                  </p>
                </div>
              </div>
            </div>

            {state.memoryEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-border bg-secondary">
                <div className="space-y-3">
                  <label className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Read Access
                  </label>
                  <Select
                    value={state.memoryReadAccess}
                    onChange={(e) => state.setMemoryReadAccess(e.target.value)}
                  >
                    <option value="private">Private (Owner only)</option>
                    <option value="public">Public (All users)</option>
                    <option value="created_only">Per-user (Isolated)</option>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase flex items-center gap-2">
                    <PenTool className="h-3 w-3" /> Write Access
                  </label>
                  <Select
                    value={state.memoryWriteAccess}
                    onChange={(e) => state.setMemoryWriteAccess(e.target.value)}
                  >
                    <option value="private">Private (Owner only)</option>
                    <option value="public">Public (Anyone)</option>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <label className="font-mono text-xs text-foreground tracking-widest uppercase">
                  Custom Tools
                </label>
                <p className="font-mono text-[9px] text-foreground/30 tracking-widest uppercase">
                  External tools this agent can invoke.
                </p>
              </div>

              {toolsList.length === 0 ? (
                <div className="p-6 border border-dashed border-border bg-secondary text-center">
                  <p className="font-mono text-xs text-foreground/30">
                    No custom tools created yet.
                  </p>
                  <Button variant="link" asChild className="mt-2 h-auto p-0 text-primary">
                    <Link to="/tools">Manage Tools</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-foreground/10 border border-border">
                  {toolsList.map((tool: any, index: number) => {
                    const isChecked = tool.toolId ? state.selectedTools.includes(tool.toolId) : false;
                    const elementId = `tool-${tool.toolId || index}`;
                    return (
                      <label
                        key={tool.toolId || index}
                        htmlFor={elementId}
                        className={cn(
                          'p-4 transition-all cursor-pointer flex items-start gap-3',
                          isChecked
                            ? 'bg-primary/10'
                            : 'bg-card hover:bg-secondary'
                        )}
                      >
                        <Checkbox
                          id={elementId}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (tool.toolId) {
                              state.setSelectedTools((prev: string[]) =>
                                checked
                                  ? [...prev, tool.toolId]
                                  : prev.filter((id) => id !== tool.toolId)
                              );
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="space-y-1 min-w-0">
                          <p className="font-mono text-xs text-foreground truncate">{tool.name}</p>
                          <p className="font-mono text-[9px] text-foreground/30 truncate">{tool.description}</p>
                          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 bg-foreground/5 text-foreground/40 tracking-widest">
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
        <div className="p-8 border-t border-border flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating} variant="default">
            {isCreating ? 'Deploying...' : 'Deploy Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
});

CreateAgentForm.displayName = 'CreateAgentForm';
