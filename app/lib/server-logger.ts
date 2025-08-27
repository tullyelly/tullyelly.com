import 'server-only';
import { debuglog } from 'node:util';

// Separate channels so we can filter via NODE_DEBUG
const log = debuglog('api:log');
const warn = debuglog('api:warn');
const error = debuglog('api:error');

export const logger = { log, warn, error };
