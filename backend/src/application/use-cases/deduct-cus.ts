import { IBillingRepository } from '../../domain/ports/billing-repository';
import { InsufficientBalanceError } from '../../domain/errors';
import { billingRates } from '../../domain/configs/billing-rates';

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
   * CU = ((inputMiss x 0.336) + (inputHit x 0.0336) + (output x 0.504)) / 1,000,000
   */
  calculateCost(inputTokens: number, outputTokens: number, cachedTokens: number): number {
    const inputMiss = Math.max(0, inputTokens - cachedTokens);
    const inputHit = cachedTokens;

    const cost =
      (inputMiss * billingRates.inputCacheMiss +
        inputHit * billingRates.inputCacheHit +
        outputTokens * billingRates.output) /
      1_000_000;

    return Math.max(0, cost);
  }

  async execute(request: DeductCUsRequest): Promise<number> {
    const account = await this.billingRepo.findByUserId(request.userId);
    if (!account) {
      throw new InsufficientBalanceError();
    }

    const cuCost = this.calculateCost(
      request.inputTokens,
      request.outputTokens,
      request.cachedTokens,
    );

    const totalAvailable = account.grantedCuBalance + account.cuBalance;
    if (totalAvailable < cuCost) {
      throw new InsufficientBalanceError();
    }

    // Deduct from granted balance first, then paid balance
    const grantedDeduction = Math.min(account.grantedCuBalance, cuCost);
    const paidDeduction = cuCost - grantedDeduction;

    await this.billingRepo.updateBalance(request.userId, {
      grantedCuBalance: account.grantedCuBalance - grantedDeduction,
      cuBalance: account.cuBalance - paidDeduction,
      totalCuUsed: account.totalCuUsed + cuCost,
    });

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
    });

    return cuCost;
  }
}
