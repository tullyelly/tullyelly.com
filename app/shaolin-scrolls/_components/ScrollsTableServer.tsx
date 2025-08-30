import { env } from '@/lib/env/server';
import { ScrollsTableClient, Release } from './ScrollsTableClient';

export default function ScrollsTableServer({ data }: { data: Release[] }) {
  const build = env.VERCEL_GIT_COMMIT_SHA || 'local';
  return <ScrollsTableClient initialData={data} build={build} />;
}
