import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { submitFeedbackDto } from './dto';
import { DIContainer } from '../../infrastructure/di/container';
import { UnauthorizedError } from '../../domain/errors';

export class FeedbackController {
  public submit = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();

      const dto = submitFeedbackDto.parse(req.body);

      const feedback = await DIContainer.createFeedback.execute({
        feedbackId: '',
        userId: user.userId,
        type: dto.type,
        content: dto.content,
      });

      DIContainer.logger.info('Feedback submitted', {
        feedbackId: feedback.feedbackId,
        userId: user.userId,
      });

      return res.status(201).json(feedback);
    } catch (error) {
      return next(error);
    }
  };
}
