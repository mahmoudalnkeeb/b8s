export interface IToolDefinition {
  name: string;
  description: string;
  apiSchema?: Record<string, unknown>;
}

export interface IToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
  thoughtSignature?: string;
}
