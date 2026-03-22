import { env } from '../loaders/env';

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  },
  bcrypt: {
    saltRounds: 12,
  },
};
