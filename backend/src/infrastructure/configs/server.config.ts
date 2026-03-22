import { env } from '../loaders/env';

export const serverConfig = {
  port: env.PORT || process.env['PORT'] || 3000,
};
