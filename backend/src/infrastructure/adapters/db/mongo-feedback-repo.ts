import { IFeedbackRepository, FeedbackData } from '../../../domain/ports/feedback-repository';
import { FeedbackModel } from '../../db/models';
import crypto from 'crypto';

export class MongoFeedbackRepository implements IFeedbackRepository {
  async create(data: Omit<FeedbackData, 'status'>): Promise<FeedbackData> {
    const feedback = new FeedbackModel({
      feedbackId: data.feedbackId || crypto.randomUUID().replace(/-/g, ''),
      userId: data.userId,
      type: data.type,
      content: data.content,
      status: 'new',
    });

    const saved = await feedback.save();
    return {
      feedbackId: saved.feedbackId,
      userId: saved.userId,
      type: saved.type as any,
      content: saved.content,
      status: saved.status as any,
    };
  }

  async listAll(): Promise<FeedbackData[]> {
    const list = await FeedbackModel.find().sort({ createdAt: -1 });
    return list.map(item => ({
      feedbackId: item.feedbackId,
      userId: item.userId,
      type: item.type as any,
      content: item.content,
      status: item.status as any,
    }));
  }
}
