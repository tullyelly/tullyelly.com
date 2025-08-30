import { Env } from '@/lib/env';
import { ScrollsTableClient, Release } from './ScrollsTableClient';

export default function ScrollsTableServer({ data }: { data: Release[] }) {
  const build = Env.COMMIT_SHA || 'local';
  return <ScrollsTableClient initialData={data} build={build} />;
}
