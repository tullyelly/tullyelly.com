import 'server-only';
import { Env } from '@/lib/env';

export const isSentryEnabled = Env.DISABLE_SENTRY !== '1' && Env.NODE_ENV !== 'test';
