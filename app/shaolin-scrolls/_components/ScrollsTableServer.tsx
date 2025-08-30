import { serverEnv } from '@/lib/env/server';
import { ScrollsTableClient, Release } from './ScrollsTableClient';

export default function ScrollsTableServer({ data }: { data: Release[] }) {
  const { VERCEL_GIT_COMMIT_SHA } = serverEnv();
  const build = VERCEL_GIT_COMMIT_SHA || 'local';
  return <ScrollsTableClient initialData={data} build={build} />;
}
