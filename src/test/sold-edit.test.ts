import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function edit(fields: Record<string, string> = {}) {
  const source = readFileSync('public/app/trackers.js', 'utf8');
  const bundle = JSON.parse(source.slice(source.indexOf('{')).trim().replace(/;$/, ''));
  const sale = { id: 's1', deviceId: 'd1', customerId: 'c1', customerName: 'Old customer', customerPhone: '1111111111', customerLocation: 'Old address', notes: 'Old notes', devicePrice: 10000 };
  const state = { devices: [{ id: 'd1', status: 'sold' }], sales: [sale], masks: [], suppliers: [], customers: [{ id: 'c1', name: 'Old customer', phone: '1111111111', location: 'Old address' }] };
  const values = { sellDate: '2026-11-05', maskChoice: 'none', devicePrice: '12000', vendorExpense: '500', otherExpense: '200', receivedType: 'Online', customerName: 'Edited customer', customerPhone: '2222222222', customerLocation: 'New address', saleNotes: 'Edited notes', ...fields };
  const data = new Map([['bharat_surgicals_device_buy_sell_v1', JSON.stringify(state)], ['bharat_shared_v1', JSON.stringify({ customers: [{ id: 'c1', name: 'Old customer', phone: '1111111111', address: 'Old address', status: 'disabled' }], links: [], v: 1 })]]);
  const context: Record<string, any> = { state, window: {}, localStorage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) }, FormData: class { get(key: string) { return values[key as keyof typeof values] ?? null; } }, device: (id: string) => state.devices.find(d => d.id === id), maskQty: (m: { qty: number }) => m.qty, alert: vi.fn(), closeModal: vi.fn(), render: vi.fn() };
  runInNewContext(readFileSync('public/app/shared.js', 'utf8'), context);
  context['Shared'] = context['window'].Shared;
  context['save'] = () => {
    context['Shared'].sync(state.customers, 'device');
    state.customers = context['Shared'].customers().map(context['Shared'].toDevice);
    data.set('bharat_surgicals_device_buy_sell_v1', JSON.stringify(state));
    context['Shared'].reconcile();
  };
  const app: string = bundle.device.app;
  runInNewContext(app.slice(app.indexOf('function updateSale('), app.indexOf('function deleteSale(')), context);
  const ext: string = bundle.device.ext;
  const syncStart = ext.indexOf('const sync=()=>');
  runInNewContext('const S=Shared;\n' + ext.slice(syncStart, ext.indexOf("['openSale'", syncStart)), context);
  context['updateSale']({ preventDefault: vi.fn(), target: {} }, 's1');
  context['window'].__syncSaleCust();
  return { sale, shared: context['Shared'].get('c1'), saved: JSON.parse(data.get('bharat_surgicals_device_buy_sell_v1') ?? '{}').sales[0], context };
}

describe('Sold-device editing', () => {
  it('persists edited sale notes', () => {
    expect(edit().saved.notes).toBe('Edited notes');
  });
  it('allows existing notes to be cleared', () => {
    expect(edit({ saleNotes: '' }).saved.notes).toBe('');
  });
  it('keeps edited customer details after the detail-screen refresh', () => {
    const result = edit();
    expect(result.sale.customerName).toBe('Edited customer');
    expect(result.saved.customerPhone).toBe('2222222222');
    expect(result.saved.customerLocation).toBe('New address');
    expect(result.shared.name).toBe('Edited customer');
    expect(result.shared.status).toBe('disabled');
  });
  it('persists edited prices and payment details', () => {
    const result = edit();
    expect(result.saved.devicePrice).toBe(12000);
    expect(result.saved.vendorExpense).toBe(500);
    expect(result.saved.otherExpense).toBe(200);
    expect(result.saved.receivedType).toBe('Online');
  });
  it('does not save notes or customer changes when mask validation fails', () => {
    const result = edit({ maskChoice: 'mask', maskQty: '0', maskPrice: '100' });
    expect(result.saved.notes).toBe('Old notes');
    expect(result.shared.name).toBe('Old customer');
    expect(result.context['closeModal']).not.toHaveBeenCalled();
  });
});