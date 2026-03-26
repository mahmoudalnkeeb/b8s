import React from 'react';
import { FileText, Hash, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CitationProps {
  fileName: string;
  chunkIndex: number;
  relevanceScore?: number;
  isRelevant?: boolean;
  onClick?: () => void;
}

export const Citation = React.memo(
  ({ fileName, chunkIndex, relevanceScore, isRelevant, onClick }: CitationProps) => {
    // Truncate long file names
    const displayName =
      fileName.length > 25 ? `${fileName.substring(0, 22)}...` : fileName;

    // Format relevance score as percentage
    const relevancePercent = relevanceScore
      ? Math.round(relevanceScore * 100)
      : undefined;

    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
          'border transition-colors cursor-pointer',
          'hover:bg-white/10',
          isRelevant === false
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
        )}
        title={`${fileName} - Chunk ${chunkIndex + 1}${relevancePercent ? ` (${relevancePercent}% relevant)` : ''}`}
      >
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate max-w-[120px]">{displayName}</span>
        <span className="text-muted-foreground/50">|</span>
        <Hash className="h-3 w-3 shrink-0" />
        <span>{chunkIndex + 1}</span>
        {relevancePercent !== undefined && (
          <>
            <span className="text-muted-foreground/50">|</span>
            {isRelevant ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <XCircle className="h-3 w-3 text-red-400" />
            )}
            <span>{relevancePercent}%</span>
          </>
        )}
      </button>
    );
  }
);

Citation.displayName = 'Citation';

export interface CitationsListProps {
  citations: Array<{
    fileName: string;
    chunkIndex: number;
    relevanceScore?: number;
    isRelevant?: boolean;
  }>;
  onCitationClick?: (index: number) => void;
}

export const CitationsList = React.memo(
  ({ citations, onCitationClick }: CitationsListProps) => {
    if (!citations || citations.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider self-center mr-1">
          Sources:
        </span>
        {citations.map((citation, index) => (
          <Citation
            key={`${citation.fileName}-${citation.chunkIndex}-${index}`}
            fileName={citation.fileName}
            chunkIndex={citation.chunkIndex}
            relevanceScore={citation.relevanceScore}
            isRelevant={citation.isRelevant}
            onClick={() => onCitationClick?.(index)}
          />
        ))}
      </div>
    );
  }
);

CitationsList.displayName = 'CitationsList';
