import 'client-only';
import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ANNOUNCEMENT: z.string().optional(),
  NEXT_PUBLIC_DEBUG_DB_META: z.string().optional(),
});

const _client = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ANNOUNCEMENT: process.env.NEXT_PUBLIC_ANNOUNCEMENT,
  NEXT_PUBLIC_DEBUG_DB_META: process.env.NEXT_PUBLIC_DEBUG_DB_META,
});
if (!_client.success) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Invalid client env', _client.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }
}

export const env = _client.success ? _client.data : ({} as z.infer<typeof clientSchema>);
