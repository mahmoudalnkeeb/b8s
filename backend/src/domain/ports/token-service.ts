export interface ITokenService {
  generate(payload: Record<string, unknown>): string;
  verify(token: string): Record<string, unknown>;
}
