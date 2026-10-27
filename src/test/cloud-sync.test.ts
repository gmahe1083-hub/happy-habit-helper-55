import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync('public/app/cloud-sync.js', 'utf8');
function fixture() {
  let data = { shared: { customers: [] as { id: string }[] }, device: null, rental: null };
  let meta: unknown = null;
  let row: unknown = null;
  let idle = true;
  const applied: unknown[] = [];
  const saved: unknown[] = [];
  const root = {} as { BharatCloudSync?: { create: (options: unknown) => { check: (boot?: boolean) => Promise<void>; activate: () => void; upload: () => Promise<void> } } };
  runInNewContext(source, { window: root });
  const controller = root.BharatCloudSync?.create({
    readMeta: () => meta, writeMeta: (value: unknown) => { meta = value; },
    snapshot: () => data, empty: () => !data.shared.customers.length,
    latest: async () => row, idle: () => idle,
    recovery: async (value: unknown) => { saved.push(value); },
    apply: async (value: typeof data) => { data = value; applied.push(value); },
    refresh: () => {}, status: () => {},
    publish: async (payload: unknown) => ({ revision: 1, payload }),
  });
  if (!controller) throw new Error('Controller missing');
  return { controller, applied, saved, setIdle: (value: boolean) => { idle = value; },
    edit: () => { data = { ...data, shared: { customers: [{ id: 'local' }] } }; },
    remote: () => { row = { revision: 2, payload: { format: 'unified', data: { shared: { customers: [{ id: 'remote' }] }, device: null, rental: null } } }; } };
}
describe('Shared uploads across devices', () => {
  it('receives published entries without a manual restore on a clean device', async () => {
    const f = fixture(); f.controller.activate(); f.remote(); await f.controller.check();
    expect(f.applied).toEqual([{ shared: { customers: [{ id: 'remote' }] }, device: null, rental: null }]);
    expect(f.saved).toHaveLength(1);
  });
  it('never replaces unpublished local entries automatically', async () => {
    const f = fixture(); f.controller.activate(); f.edit(); f.remote(); await f.controller.check();
    expect(f.applied).toHaveLength(0);
  });
  it('waits for an active screen to close before applying', async () => {
    const f = fixture(); f.controller.activate(); f.setIdle(false); f.remote(); await f.controller.check();
    expect(f.applied).toHaveLength(0);
    f.setIdle(true); await f.controller.check(); expect(f.applied).toHaveLength(1);
  });
  it('marks uploaded entries clean so subsequent uploads can be received', async () => {
    const f = fixture(); f.controller.activate(); f.edit(); await f.controller.upload(); f.remote(); await f.controller.check();
    expect(f.applied).toHaveLength(1);
  });
});