import { IFeedbackRepository, FeedbackData } from '../../domain/ports/feedback-repository';

export class AdminUpdateFeedbackUseCase {
  constructor(private feedbackRepo: IFeedbackRepository) {}

  async execute(feedbackId: string, status: 'new' | 'reviewed' | 'resolved'): Promise<FeedbackData> {
    if (!feedbackId || !status) {
      throw new Error('Feedback ID and status are required');
    }
    
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      throw new Error('Invalid status');
    }

    return this.feedbackRepo.updateStatus(feedbackId, status);
  }
}
