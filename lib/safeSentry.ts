import 'server-only';
import { serverEnv } from '@/lib/env/server';

const env = serverEnv();
export const isSentryEnabled = env.DISABLE_SENTRY !== '1' && env.NODE_ENV !== 'test';
