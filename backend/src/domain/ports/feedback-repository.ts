

export interface FeedbackData {
  feedbackId: string;
  userId: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface IFeedbackRepository {
  create(data: Omit<FeedbackData, 'status'>): Promise<FeedbackData>;
  listAll(): Promise<FeedbackData[]>;
}
