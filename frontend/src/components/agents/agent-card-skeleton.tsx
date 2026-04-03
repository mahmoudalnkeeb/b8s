export function AgentCardSkeleton() {
  return (
    <div className="bg-card p-8 flex flex-col min-h-[280px]">
      <div className="flex justify-between items-start mb-6">
        <div className="h-10 w-10 bg-foreground/5 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-3.5 w-3.5 bg-foreground/5 animate-pulse"></div>
          <div className="h-3.5 w-3.5 bg-foreground/5 animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-5 w-3/4 bg-foreground/5 animate-pulse"></div>
        <div className="h-3 w-full bg-foreground/5 animate-pulse"></div>
        <div className="h-3 w-5/6 bg-foreground/5 animate-pulse"></div>
      </div>
      <div className="mt-auto pt-6 space-y-4">
        <div className="flex justify-between border-t border-white/5 pt-4">
          <div className="h-3 w-16 bg-foreground/5 animate-pulse"></div>
          <div className="h-3 w-20 bg-foreground/5 animate-pulse"></div>
        </div>
        <div className="flex gap-px">
          <div className="flex-1 h-10 bg-foreground/5 animate-pulse"></div>
          <div className="w-12 h-10 bg-foreground/5 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}