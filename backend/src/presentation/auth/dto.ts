import { z } from 'zod';

export const registerDto = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').trim(),
});

export const loginDto = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordDto = z.object({
  email: z.email().toLowerCase().trim(),
});

export const resetPasswordDto = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const changePasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
