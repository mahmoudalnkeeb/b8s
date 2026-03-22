import { IFeedbackRepository, FeedbackData } from '../../domain/ports/feedback-repository';

export class AdminListFeedbackUseCase {
  constructor(private feedbackRepo: IFeedbackRepository) {}

  async execute(): Promise<FeedbackData[]> {
    return this.feedbackRepo.listAll();
  }
}
