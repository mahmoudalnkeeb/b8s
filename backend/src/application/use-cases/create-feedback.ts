import { IFeedbackRepository, FeedbackData } from '../../domain/ports/feedback-repository';

export class CreateFeedbackUseCase {
  constructor(private feedbackRepo: IFeedbackRepository) {}

  async execute(data: Omit<FeedbackData, 'status'>): Promise<FeedbackData> {
    if (!data.userId || !data.type || !data.content) {
      throw new Error('User ID, Type, and Content are required to submit feedback');
    }

    if (data.type !== 'bug' && data.type !== 'suggestion') {
      throw new Error('Feedback type must be either "bug" or "suggestion"');
    }

    return this.feedbackRepo.create(data);
  }
}
