export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LLMProviderError extends DomainError {}
export class QuotaExceededError extends DomainError {
  constructor(message: string = 'AI quota exceeded. Please try again later.') {
    super(message, 'QUOTA_EXCEEDED');
  }
}
export class DatabaseError extends DomainError {}
export class ToolExecutionError extends DomainError {}
export class NotFoundError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class InsufficientBalanceError extends DomainError {
  constructor(message: string = 'Insufficient CU balance. Please top up or upgrade your plan.') {
    super(message, 'INSUFFICIENT_BALANCE');
  }
}
