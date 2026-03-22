import { IBillingRepository } from '../../domain/ports/billing-repository';

export class AdminListUsersUseCase {
  constructor(private billingRepo: IBillingRepository) {}

  async execute() {
    return this.billingRepo.listAllWithUsers();
  }
}
