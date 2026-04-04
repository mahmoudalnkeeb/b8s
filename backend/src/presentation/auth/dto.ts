import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerDto = z.object({
  email: z.email().toLowerCase().trim(),
  password: strongPassword,
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
  newPassword: strongPassword,
});

export const changePasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPassword,
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
