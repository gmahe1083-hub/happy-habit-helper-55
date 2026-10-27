import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

function firstPayment(amount: number, monthly: number) {
  const source = readFileSync('public/app/trackers.js', 'utf8');
  const bundle = JSON.parse(source.slice(source.indexOf('{')).trim().replace(/;$/, ''));
  const extension: string = bundle.rental.ext;
  const begin = extension.indexOf('window.fixFirstPay=function');
  const end = extension.indexOf('\n(function(){let ch=false;', begin);
  if (begin < 0 || end < 0) throw new Error('First-payment correction is missing');
  const payment = { rentalId: 'r1', amount, rentalAmount: amount, date: '2026-10-01', periodFrom: '2026-10-01', periodDue: '2026-10-31' };
  const context = {
    window: {} as { fixFirstPay?: (r: unknown, oldStart: string) => boolean },
    state: { payments: [payment] },
    periodFor: (start: string) => ({ from: start, due: start === '2026-10-05' ? '2026-11-04' : '2026-10-31' }),
  };
  runInNewContext(extension.slice(begin, end), context);
  context.window.fixFirstPay?.({ id: 'r1', startDate: '2026-10-05', monthly, monthlyHistory: [{ amount: monthly }] }, '2026-10-01');
  return payment;
}

describe('Uploaded v20 first-payment correction', () => {
  it('caps rental income at the edited monthly rate without changing money received', () => {
    const payment = firstPayment(2000, 1500);
    expect(payment.rentalAmount).toBe(1500);
    expect(payment.amount).toBe(2000);
  });
  it('does not inflate a payment below the monthly rate', () => {
    expect(firstPayment(500, 1500).rentalAmount).toBe(500);
  });
  it('moves the first payment and billing period to the edited checkout date', () => {
    const payment = firstPayment(2000, 1500);
    expect(payment.date).toBe('2026-10-05');
    expect(payment.periodFrom).toBe('2026-10-05');
    expect(payment.periodDue).toBe('2026-11-04');
  });
});