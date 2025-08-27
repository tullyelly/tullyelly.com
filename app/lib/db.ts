import 'server-only'
import { Pool, type QueryResult } from 'pg'
import { debuglog } from 'node:util'
import { getDatabaseUrl, getRuntimeEnv } from './env'

let _pool: Pool | null = null

// Enable with: NODE_DEBUG=db node ...
const debug = debuglog('db')

type RuntimeEnv = 'development' | 'preview' | 'production'

function assertDbSafety(dbUrl: string) {
  const { vercelEnv, nodeEnv } = getRuntimeEnv()
  const env: RuntimeEnv = nodeEnv === 'test' ? 'development' : vercelEnv
  const host = new URL(dbUrl).hostname

  const allow: Record<RuntimeEnv, string[]> = {
    development: [
      'ep-round-forest-aeuxacm9.c-2.us-east-2.aws.neon.tech',
      'localhost',
      '127.0.0.1',
    ],
    preview: ['ep-steep-frog-ae7rg845.c-2.us-east-2.aws.neon.tech'],
    production: ['ep-jolly-flower-ae4bmy06.c-2.us-east-2.aws.neon.tech'],
  }

  if (!allow[env].includes(host)) {
    throw new Error(`Safety check failed: ${env} runtime cannot use DB host "${host}".`)
  }
  // swap any env var locally to verify the error above is thrown
}

export function getPool(): Pool {
  if (_pool) return _pool

  const dbUrl = getDatabaseUrl()
  assertDbSafety(dbUrl)

  const { vercelEnv, nodeEnv } = getRuntimeEnv()
  const env: RuntimeEnv = nodeEnv === 'test' ? 'development' : vercelEnv

  // Use node:util debug channel instead of console.* (respects NODE_DEBUG)
  if (env !== 'production') {
    const host = new URL(dbUrl).hostname
    debug('[env:%s] host=%s', env, host)
  }

  _pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 })
  return _pool
}

export function query<T = unknown>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params)
}