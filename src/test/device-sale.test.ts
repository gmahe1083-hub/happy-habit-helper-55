import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function fixture(purchasedType = 'purchased', active = false, accepted = true) {
  const source = readFileSync('public/app/trackers.js', 'utf8');
  const bundle = JSON.parse(source.slice(source.indexOf('{')).trim().replace(/;$/, ''));
  const extension: string = bundle.device.ext;
  const begin = extension.indexOf('window.assignBackToSale=function');
  if (begin < 0) throw new Error('Return-to-sale action missing');
  const item = { id: 'd1', status: 'rental', purchasedType };
  const save = vi.fn();
  const root = {} as { assignBackToSale?: (id: string) => void };
  runInNewContext(extension.slice(begin), {
    window: root, device: () => item, Shared: { eqHist: () => active ? [{ status: 'active' }] : [], reconcile: vi.fn() },
    alert: vi.fn(), confirm: () => accepted, save, closeModal: vi.fn(), render: vi.fn(),
  });
  root.assignBackToSale?.('d1');
  return { item, save };
}

describe('Uploaded v33-2 return to sale', () => {
  it('returns an owned rental device to purchased stock', () => {
    expect(fixture().item.status).toBe('purchased');
  });
  it('keeps a lent device classified as lent', () => {
    expect(fixture('lent').item.status).toBe('lent');
  });
  it('does not move a currently rented device to sale', () => {
    const f = fixture('purchased', true);
    expect(f.item.status).toBe('rental');
    expect(f.save).not.toHaveBeenCalled();
  });
  it('does not change stock when confirmation is declined', () => {
    const f = fixture('purchased', false, false);
    expect(f.item.status).toBe('rental');
    expect(f.save).not.toHaveBeenCalled();
  });
});