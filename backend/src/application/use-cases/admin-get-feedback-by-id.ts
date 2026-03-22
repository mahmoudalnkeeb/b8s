import { IFeedbackRepository, FeedbackData } from '../../domain/ports/feedback-repository';

export class AdminGetFeedbackByIdUseCase {
  constructor(private feedbackRepo: IFeedbackRepository) {}

  async execute(feedbackId: string): Promise<FeedbackData | null> {
    if (!feedbackId) {
      throw new Error('Feedback ID is required');
    }

    return this.feedbackRepo.getById(feedbackId);
  }
}
