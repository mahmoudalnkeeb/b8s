import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Eye, PenTool } from 'lucide-react';
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
  return (
    <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-white/30 mb-4">
          <div className="h-px w-12 bg-[#3D81CC]"></div>
          <span className="text-[#3D81CC]">New Agent</span>
        </div>
        <h2 className="font-sans font-black text-2xl text-white uppercase tracking-tight">
          Configure Assistant
        </h2>
        <p className="font-sans text-sm text-white/40 font-light mt-2">
          Define the identity and capabilities of your agent.
        </p>
      </div>
      <form onSubmit={onSubmit}>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                Name
              </label>
              <Input
                placeholder="e.g. Senior Researcher"
                value={state.name}
                onChange={(e) => state.setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-3">
              <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
                Visibility
              </label>
              <Select
                value={state.visibility}
                onChange={(e) => state.setVisibility(e.target.value)}
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
              placeholder="What is the primary goal of this agent?"
              value={state.description}
              onChange={(e) => state.setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="font-mono text-[10px] text-white/40 tracking-widest uppercase block">
              Core Instructions
            </label>
            <Textarea
              placeholder="Think step by step. You are an expert in..."
              value={state.instructions}
              onChange={(e) => state.setInstructions(e.target.value)}
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-8 p-6 border border-white/10 bg-[#111]">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  id="memory"
                  checked={state.memoryEnabled}
                  onCheckedChange={(checked) => state.setMemoryEnabled(!!checked)}
                />
                <div className="space-y-0.5">
                  <label htmlFor="memory" className="font-mono text-xs text-white cursor-pointer">
                    B8s Memory
                  </label>
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
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
                  <label htmlFor="rag" className="font-mono text-xs text-white cursor-pointer">
                    Knowledge Base
                  </label>
                  <p className="font-mono text-[9px] text-white/30 uppercase tracking-widest">
                    Document grounding
                  </p>
                </div>
              </div>
            </div>

            {state.memoryEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-white/10 bg-[#111]">
                <div className="space-y-3">
                  <label className="font-mono text-[9px] text-white/30 tracking-widest uppercase flex items-center gap-2">
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
                  <label className="font-mono text-[9px] text-white/30 tracking-widest uppercase flex items-center gap-2">
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

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <label className="font-mono text-xs text-white tracking-widest uppercase">
                  Custom Tools
                </label>
                <p className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
                  External tools this agent can invoke.
                </p>
              </div>

              {toolsList.length === 0 ? (
                <div className="p-6 border border-dashed border-white/10 bg-[#111] text-center">
                  <p className="font-mono text-xs text-white/30">
                    No custom tools created yet.
                  </p>
                  <Button variant="link" asChild className="mt-2 h-auto p-0 text-[#3D81CC]">
                    <Link to="/tools">Manage Tools</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
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
                            ? 'bg-[#3D81CC]/10'
                            : 'bg-[#0a0a0a] hover:bg-[#111]'
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
                          <p className="font-mono text-xs text-white truncate">{tool.name}</p>
                          <p className="font-mono text-[9px] text-white/30 truncate">{tool.description}</p>
                          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 bg-white/5 text-white/40 tracking-widest">
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
        <div className="p-8 border-t border-white/10 flex justify-end gap-4">
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
