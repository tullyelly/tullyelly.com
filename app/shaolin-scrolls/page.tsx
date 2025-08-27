import CreateRelease from '@/components/CreateRelease';
import ReleaseRowDetail from '@/components/ReleaseRowDetail';
import { getReleases } from '@/lib/releases';
import styles from './page.module.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  let releases: Awaited<ReturnType<typeof getReleases>> = [];
  try {
    releases = await getReleases(20);
  } catch (err) {
    console.error('[shaolin-scrolls] failed to load releases', err);
  }

  return (
    <main className={styles.container}>
      <h1>Shaolin Scrolls</h1>
      <div className={styles.create}>
        <CreateRelease />
      </div>
      {releases.length > 0 ? (
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
            {releases.map((item) => (
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
      ) : (
        <p>No releases available.</p>
      )}
    </main>
  );
}
