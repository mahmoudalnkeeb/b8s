import { IMemory } from '../models';

export interface IVectorStore {
  upsert(collection: string, memory: IMemory): Promise<void>;
  similaritySearch(collection: string, queryVector: number[], limit: number): Promise<IMemory[]>;
}
