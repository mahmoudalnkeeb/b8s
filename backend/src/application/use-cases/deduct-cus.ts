import { IBillingRepository } from '../../domain/ports/billing-repository';
import { InsufficientBalanceError } from '../../domain/errors';
import { billingConfig } from '../../infrastructure/configs/billing.config';

export interface DeductCUsRequest {
  userId: string;
  agentId: string;
  conversationId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
}

export class DeductCUsUseCase {
  constructor(private billingRepo: IBillingRepository) {}

  /**
   * Calculate CU cost from token usage using the formula:
   * CU = ((inputMiss × 0.336) + (inputHit × 0.0336) + (output × 0.504)) / 1,000,000
   */
  calculateCost(inputTokens: number, outputTokens: number, cachedTokens: number): number {
    const inputMiss = Math.max(0, inputTokens - cachedTokens);
    const inputHit = cachedTokens;

    const cost =
      (inputMiss * billingConfig.rates.inputCacheMiss +
        inputHit * billingConfig.rates.inputCacheHit +
        outputTokens * billingConfig.rates.output) /
      1_000_000;

    return Math.max(0, cost);
  }

  async execute(request: DeductCUsRequest): Promise<number> {
    const account = await this.billingRepo.findByUserId(request.userId);
    if (!account) {
      throw new InsufficientBalanceError();
    }

    const cuCost = this.calculateCost(request.inputTokens, request.outputTokens, request.cachedTokens);

    const totalAvailable = account.grantedCuBalance + account.cuBalance;
    if (totalAvailable < cuCost) {
      throw new InsufficientBalanceError();
    }

    // Deduct from granted balance first, then paid balance
    let grantedDeduction = Math.min(account.grantedCuBalance, cuCost);
    let paidDeduction = cuCost - grantedDeduction;

    await this.billingRepo.updateBalance(request.userId, {
      grantedCuBalance: account.grantedCuBalance - grantedDeduction,
      cuBalance: account.cuBalance - paidDeduction,
      totalCuUsed: account.totalCuUsed + cuCost,
    } as any);

    // Log the usage
    await this.billingRepo.logUsage({
      userId: request.userId,
      agentId: request.agentId,
      conversationId: request.conversationId,
      inputTokens: request.inputTokens,
      outputTokens: request.outputTokens,
      cachedTokens: request.cachedTokens,
      cuDeducted: cuCost,
      timestamp: new Date(),
    } as any);

    return cuCost;
  }
}
