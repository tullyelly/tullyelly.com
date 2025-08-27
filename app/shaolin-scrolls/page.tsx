import CreateRelease from '@/components/CreateRelease';
import ReleaseRowDetail from '@/components/ReleaseRowDetail';
import { getReleases } from '@/lib/releases';
import { logger } from '@/app/lib/server-logger';
import styles from './page.module.css';

export const runtime = 'nodejs';

export default async function ShaolinScrollsPage() {
  try {
    logger.log('[ShaolinScrollsPage] loading releases');
    const items = await getReleases(20);
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
  } catch (err) {
    logger.error('[ShaolinScrollsPage] failed to load releases', err);
    throw err;
  }
}

