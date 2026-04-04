import { NextFunction, Request, Response } from 'express';
import {
  registerDto,
  loginDto,
  forgotPasswordDto,
  resetPasswordDto,
  changePasswordDto,
} from './dto';
import { logger } from '../../infrastructure/utils/logger';
import { DIContainer } from '../../infrastructure/di/container';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor() {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const dto = registerDto.parse(req.body);
      const user = await DIContainer.registerUser.execute(dto);
      logger.info('User registered successfully', { email: dto.email, userId: user.userId });
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const dto = loginDto.parse(req.body);
      const user = await DIContainer.loginUser.execute({
        email: dto.email,
        password: dto.password,
        rememberMe: dto.rememberMe ?? false,
      });
      logger.info('User logged in successfully', { email: dto.email, userId: user.userId });
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  };

  public getMe = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = req.user!.userId;
      const user = await DIContainer.userRepo.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      return next(error);
    }
  };

  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const dto = forgotPasswordDto.parse(req.body);
      await DIContainer.forgotPassword.execute({ email: dto.email });
      // Always return success to prevent email enumeration
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      return next(error);
    }
  };

  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const dto = resetPasswordDto.parse(req.body);
      await DIContainer.resetPassword.execute({
        token: dto.token,
        newPassword: dto.newPassword,
      });
      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      return next(error);
    }
  };

  public changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = req.user!.userId;
      const dto = changePasswordDto.parse(req.body);
      await DIContainer.changePassword.execute({
        userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      });
      return res.status(200).json({ message: 'Password has been changed successfully' });
    } catch (error) {
      return next(error);
    }
  };
}
