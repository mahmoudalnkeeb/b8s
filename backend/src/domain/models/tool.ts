export interface IToolDefinition {
  name: string;
  description: string;
  apiSchema?: Record<string, unknown> | undefined;
}

export interface IToolCall {
  id?: string | undefined;
  name: string;
  arguments: Record<string, unknown>;
  thoughtSignature?: string | undefined;
}
