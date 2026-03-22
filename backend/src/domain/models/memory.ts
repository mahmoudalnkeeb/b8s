export interface IMemory {
  id: string;
  content: string;
  vector?: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}
