import CreateRelease from '@/components/CreateRelease';
import ReleaseRowDetail from '@/components/ReleaseRowDetail';
import styles from './page.module.css';

interface ListItem {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  created_at: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`fetch failed: ${path}`);
  }
  return res.json();
}

export default async function ShaolinScrollsPage() {
  const list = await fetchJson<{ items: Array<{ id: number; release_name: string; status: string; release_type: string }> }>(
    '/api/releases?limit=20'
  );

  const items: ListItem[] = await Promise.all(
    list.items.map(async (item) => {
      const detail = await fetchJson<{ created_at: string }>(`/api/releases/${item.id}`);
      return { ...item, created_at: detail.created_at };
    })
  );

  return (
    <main className={styles.container}>
      <h1>Shaolin Scrolls</h1>
      <div className={styles.create}>
        <CreateRelease />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Release Name</th>
            <th scope="col">Status</th>
            <th scope="col">Type</th>
            <th scope="col">Created</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.release_name}</td>
              <td>{item.status}</td>
              <td>{item.release_type}</td>
              <td>
                <time dateTime={item.created_at}>{item.created_at}</time>
              </td>
              <td>
                <ReleaseRowDetail id={item.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

