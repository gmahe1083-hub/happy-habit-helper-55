import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const root: { Shared?: any } = {};
runInNewContext(readFileSync('public/app/shared.js', 'utf8'), { window: root });
const shared = root.Shared;

describe('Dashboard value breakdowns', () => {
  it('shows device sale price separately from mask and net received', () => {
    expect(shared.saleDisplay({ devicePrice: 10000, maskPrice: 1000, vendorExpense: 500, otherExpense: 200 }))
      .toEqual({ device: 9000, mask: 1000, net: 9300, received: 10300 });
  });
  it('separates lent-device outstanding paid and not paid', () => {
    expect(shared.outstandingSplit([
      { purchasedType: 'lent', price: 7000, vendorPaid: false },
      { purchasedType: 'lent', price: 3000, vendorPaid: true },
      { purchasedType: 'purchased', price: 5000, vendorPaid: true },
    ])).toEqual({ unpaid: 7000, paid: 3000 });
  });
  it('splits rental income by running and completed rentals using rental-only payment amounts', () => {
    expect(shared.rentalIncomeSplit([{ id: 'a', status: 'active' }, { id: 'b', status: 'completed' }],
      [{ rentalId: 'a', rent: 2500 }, { rentalId: 'a', rent: 500 }, { rentalId: 'b', rent: 1200 }],
      (p: { rent: number }) => p.rent)).toEqual({ running: 3000, completed: 1200 });
  });
});