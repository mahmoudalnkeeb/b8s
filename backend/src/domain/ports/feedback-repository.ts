

export interface FeedbackData {
  feedbackId: string;
  userId: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt?: Date;
}

export interface IFeedbackRepository {
  create(data: Omit<FeedbackData, 'status' | 'createdAt'>): Promise<FeedbackData>;
  listAll(): Promise<FeedbackData[]>;
  updateStatus(feedbackId: string, status: 'new' | 'reviewed' | 'resolved'): Promise<FeedbackData>;
}
