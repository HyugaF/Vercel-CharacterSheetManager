import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanConnectionString, isSslRequired } from './db.ts';

test('cleanConnectionString strips double and single quotes', () => {
  const quoted = '"postgresql://postgres.xxx:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"';
  const res = cleanConnectionString(quoted);
  assert.equal(res.url, 'postgresql://postgres.xxx:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
  assert.equal(res.error, undefined);

  const singleQuoted = "'postgresql://user:pass@ep-neon.tech/neondb'";
  const res2 = cleanConnectionString(singleQuoted);
  assert.equal(res2.url, 'postgresql://user:pass@ep-neon.tech/neondb');
});

test('cleanConnectionString detects and rejects HTTP REST URLs with helpful message', () => {
  const httpUrl = 'https://abcdefghijklm.supabase.co';
  const res = cleanConnectionString(httpUrl);
  assert.ok(res.error);
  assert.ok(res.error.includes('REST API URL'));
  assert.ok(res.error.includes('Connection string (URI)'));
});

test('cleanConnectionString validates protocol', () => {
  const invalid = 'mysql://user:pass@localhost:3306/db';
  const res = cleanConnectionString(invalid);
  assert.ok(res.error);
  assert.ok(res.error.includes('postgres:// atau postgresql://'));
});

test('isSslRequired detects cloud providers and remote hosts', () => {
  assert.equal(isSslRequired('postgresql://user:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'), true);
  assert.equal(isSslRequired('postgresql://user:pass@db.abcdef.supabase.co:5432/postgres'), true);
  assert.equal(isSslRequired('postgresql://user:pass@ep-123.neon.tech/neondb'), true);
  assert.equal(isSslRequired('postgresql://user:pass@localhost:5432/test'), false);
  assert.equal(isSslRequired('postgresql://user:pass@127.0.0.1:5432/test'), false);
  assert.equal(isSslRequired('postgresql://user:pass@remote.server.com:5432/test?sslmode=disable'), false);
});
