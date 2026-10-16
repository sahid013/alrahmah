import { describe, expect, it } from 'vitest';
import { programToRow, rowToProgram, type CampaignRow } from './rows';

const row: CampaignRow = {
  id: 'last-10-nights',
  title: 'Last 10 Nights',
  summary: 'Give every night.',
  status: 'active',
  sort_order: 2,
  giving: {
    kind: 'daily',
    firstDate: '2027-02-27',
    count: 10,
    unit: 'night',
    chargeTime: '21:00',
    periodLabel: 'the last 10 nights of Ramadan',
    presets: [1, 5, 10, 20],
  },
  icon: 'moon',
  price: null,
  tracker: null,
  image: null,
  cta_label: 'Donate',
};

describe('campaign rows', () => {
  it('become website programmes with the donate link set from the id', () => {
    const p = rowToProgram(row);
    expect(p).toMatchObject({
      id: 'last-10-nights',
      icon: 'moon',
      cta: { href: '/donate/last-10-nights' },
    });
    expect(p.giving.kind).toBe('daily');
    expect(p).not.toHaveProperty('price');
  });

  it('round-trip, keeping status and position', () => {
    const back = programToRow(rowToProgram(row), 'draft', 5);
    expect(back).toMatchObject({ ...row, status: 'draft', sort_order: 5 });
  });

  it('default to the standard form and reject bad giving settings', () => {
    expect(rowToProgram({ ...row, giving: { kind: 'regular' } }).giving).toEqual({
      kind: 'regular',
    });
    expect(() => rowToProgram({ ...row, giving: { kind: 'daily', count: 0 } })).toThrow();
  });
});
