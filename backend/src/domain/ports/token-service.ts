export interface ITokenService {
  generate(payload: Record<string, unknown>, expiresIn?: string): string;
  verify(token: string): Record<string, unknown>;
}
