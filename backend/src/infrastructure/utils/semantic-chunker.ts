import { extractMetadata, ExtractedMetadata } from './metadata-extractor';

export interface SemanticChunk {
  text: string;
  metadata: ExtractedMetadata;
  startIndex: number;
  endIndex: number;
}

export interface ChunkingOptions {
  maxChunkSize: number;
  minChunkSize: number;
  overlap: number;
}

const DEFAULT_OPTIONS: ChunkingOptions = {
  maxChunkSize: 1500,
  minChunkSize: 100,
  overlap: 150,
};

/**
 * Semantic chunking that splits by paragraphs and sections
 * rather than fixed character counts.
 */
export function semanticChunk(
  text: string,
  options: Partial<ChunkingOptions> = {},
): SemanticChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: SemanticChunk[] = [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into paragraphs (double newline or more)
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentChunk = '';
  let chunkStart = 0;
  let currentOffset = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (!paragraph) continue;

    const separator = currentChunk ? '\n\n' : '';
    const candidate = currentChunk + separator + paragraph;

    // If adding this paragraph exceeds max size and we have content
    if (candidate.length > opts.maxChunkSize && currentChunk.length >= opts.minChunkSize) {
      // Save current chunk
      const metadata = extractMetadata(currentChunk);
      chunks.push({
        text: currentChunk.trim(),
        metadata,
        startIndex: chunkStart,
        endIndex: currentOffset,
      });

      // Start new chunk with overlap from previous
      if (opts.overlap > 0 && currentChunk.length > opts.overlap) {
        const overlapText = currentChunk.slice(-opts.overlap);
        // Find sentence boundary for cleaner overlap
        const sentenceEnd = overlapText.search(/[.!?]\s/);
        const cleanOverlap = sentenceEnd > 0 ? overlapText.slice(sentenceEnd + 2) : overlapText;
        currentChunk = cleanOverlap + '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      chunkStart = currentOffset - currentChunk.length + paragraph.length;
    } else if (paragraph.length > opts.maxChunkSize) {
      // Single paragraph exceeds max size - split it
      if (currentChunk) {
        const metadata = extractMetadata(currentChunk);
        chunks.push({
          text: currentChunk.trim(),
          metadata,
          startIndex: chunkStart,
          endIndex: currentOffset,
        });
        currentChunk = '';
      }

      // Split oversized paragraph by sentences
      const subChunks = splitLargeParagraph(paragraph, opts.maxChunkSize, opts.overlap);
      for (const sub of subChunks) {
        const metadata = extractMetadata(sub);
        chunks.push({
          text: sub.trim(),
          metadata,
          startIndex: currentOffset,
          endIndex: currentOffset + sub.length,
        });
      }
    } else {
      currentChunk = candidate;
    }

    currentOffset += paragraph.length + 2; // +2 for the \n\n
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length >= opts.minChunkSize) {
    const metadata = extractMetadata(currentChunk);
    chunks.push({
      text: currentChunk.trim(),
      metadata,
      startIndex: chunkStart,
      endIndex: currentOffset,
    });
  }

  return chunks;
}

/**
 * Split a large paragraph by sentences while preserving metadata
 */
function splitLargeParagraph(paragraph: string, maxSize: number, overlap: number): string[] {
  const chunks: string[] = [];

  // Protect URLs and emails from being split
  const placeholders: { original: string; placeholder: string }[] = [];
  let protectedText = paragraph;

  // Replace URLs with placeholders
  protectedText = protectedText.replace(
    /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)/gi,
    (match) => {
      const placeholder = `__URL_${placeholders.length}__`;
      placeholders.push({ original: match, placeholder });
      return placeholder;
    },
  );

  // Replace emails with placeholders
  protectedText = protectedText.replace(/[\w.-]+@[\w.-]+\.\w+/gi, (match) => {
    const placeholder = `__EMAIL_${placeholders.length}__`;
    placeholders.push({ original: match, placeholder });
    return placeholder;
  });

  // Split by sentences (period followed by space and uppercase letter, or end of string)
  const sentences = protectedText.match(/[^.!?]*[.!?]+(?=\s+[A-Z]|\s*$)/g) || [protectedText];

  let current = '';

  for (const sentence of sentences) {
    const candidate = current + (current ? ' ' : '') + sentence.trim();

    if (candidate.length > maxSize && current.length > 0) {
      chunks.push(current.trim());

      // Add overlap
      if (overlap > 0) {
        const words = current.split(' ');
        const overlapWords = words.slice(-Math.ceil(overlap / 6));
        current = overlapWords.join(' ') + ' ' + sentence.trim();
      } else {
        current = sentence.trim();
      }
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // Restore placeholders
  return chunks.map((chunk) => {
    let restored = chunk;
    for (const { original, placeholder } of placeholders) {
      restored = restored.replace(placeholder, original);
    }
    return restored;
  });
}

/**
 * Merge small adjacent chunks that share similar metadata
 */
export function mergeSmallChunks(chunks: SemanticChunk[], minSize: number = 200): SemanticChunk[] {
  const merged: SemanticChunk[] = [];
  let buffer: SemanticChunk | null = null;

  for (const chunk of chunks) {
    if (!buffer) {
      buffer = { ...chunk };
      continue;
    }

    // Merge if buffer is small and chunks have similar metadata
    const hasSharedMetadata =
      (buffer.metadata.emails.length > 0 && chunk.metadata.emails.length > 0) ||
      (buffer.metadata.socialLinks.github && chunk.metadata.socialLinks.github) ||
      (buffer.metadata.socialLinks.linkedin && chunk.metadata.socialLinks.linkedin);

    if (buffer.text.length < minSize || hasSharedMetadata) {
      buffer = {
        text: buffer.text + '\n\n' + chunk.text,
        metadata: {
          urls: [...new Set([...buffer.metadata.urls, ...chunk.metadata.urls])],
          emails: [...new Set([...buffer.metadata.emails, ...chunk.metadata.emails])],
          phones: [...new Set([...buffer.metadata.phones, ...chunk.metadata.phones])],
          socialLinks: {
            ...buffer.metadata.socialLinks,
            ...chunk.metadata.socialLinks,
          },
        },
        startIndex: buffer.startIndex,
        endIndex: chunk.endIndex,
      };
    } else {
      merged.push(buffer);
      buffer = { ...chunk };
    }
  }

  if (buffer) {
    merged.push(buffer);
  }

  return merged;
}
