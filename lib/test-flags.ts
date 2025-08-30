import 'server-only';

export const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT === '1';
export const testBypassHeader = 'x-test-bypass-auth';
