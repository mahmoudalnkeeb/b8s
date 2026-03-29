import { env } from '../loaders/env';

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '24h',
  },
  bcrypt: {
    saltRounds: 12,
  },
};
