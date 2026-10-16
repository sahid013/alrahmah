'use client';

import { useState } from 'react';
import { CampaignList } from './campaign-list';
import { CauseVisibility } from './cause-visibility';

/** Campaigns page: the show/hide switches, then the full list (refreshed after a switch). */
export function CampaignsView() {
  const [version, setVersion] = useState(0);
  return (
    <>
      <CauseVisibility onChanged={() => setVersion((v) => v + 1)} />
      <CampaignList key={version} />
    </>
  );
}
