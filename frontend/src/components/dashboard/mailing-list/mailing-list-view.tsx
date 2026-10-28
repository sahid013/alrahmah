'use client';

import { useState } from 'react';
import { DownloadIcon, SearchIcon, TrashIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { downloadCsv, emailToolColumns, mailingColumns, toCsv } from '@/lib/dashboard/csv';
import { filterContacts, MAILING_VIEWS, type MailingView } from '@/lib/dashboard/mailing-list';
import { todayAtMasjid } from '@/lib/events/calendar';
import { addDaysIso } from '@/lib/events/schedule';
import { countryName, UK } from '@/lib/giving/countries';
import type { MailingContact } from '@/lib/mailing-list/types';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import {
  Badge,
  EmptyState,
  iconButton,
  Input,
  LoadingRows,
  Panel,
  shortDate,
  StatCard,
  td,
  th,
} from '../ui';

const nameOf = (c: MailingContact) => `${c.firstName} ${c.lastName}`.trim() || c.email;

/**
 * Donors who opted in to email updates on the donation form: who's subscribed, when and where
 * they opted in, unsubscribe / delete on request, and exports for the team's email tool.
 */
export function MailingListView() {
  const api = useDashboardApi();
  const { data, loading, error, reload } = useDashboardQuery(
    async (a) => ({ contacts: await a.mailingList.list(), campaigns: await a.campaigns.list() }),
    [],
  );
  const [view, setView] = useState<MailingView>('subscribed');
  const [search, setSearch] = useState('');
  /** The row and action in progress (other actions wait until it finishes). */
  const [busy, setBusy] = useState<{ email: string; action: 'toggle' | 'delete' }>();
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();

  const contacts = data?.contacts ?? [];
  const campaignTitle = new Map((data?.campaigns ?? []).map((c) => [c.id, c.title]));
  const shown = filterContacts(contacts, view, search);
  const subscribed = contacts.filter((c) => c.subscribed);
  /** Exports for sending email only ever include people who are still subscribed. */
  const sendable = shown.filter((c) => c.subscribed);
  const monthAgo = addDaysIso(todayAtMasjid(), -30);
  const today = todayAtMasjid();

  const act = async (
    c: MailingContact,
    action: 'toggle' | 'delete',
    run: () => Promise<void>,
    done: string,
  ) => {
    setBusy({ email: c.email, action });
    setNotice(undefined);
    try {
      await run();
      setNotice({ text: done });
      reload();
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : 'Something went wrong.', error: true });
    } finally {
      setBusy(undefined);
    }
  };

  const toggle = (c: MailingContact) =>
    act(
      c,
      'toggle',
      () => api.mailingList.setSubscribed(c.email, !c.subscribed),
      c.subscribed ? `Unsubscribed ${c.email}.` : `Subscribed ${c.email} again.`,
    );

  const remove = (c: MailingContact) => {
    if (
      !window.confirm(
        `Delete ${c.email} from the mailing list, with its record of consent? This can’t be undone. (To stop emails but keep the record, unsubscribe instead.)`,
      )
    )
      return;
    void act(c, 'delete', () => api.mailingList.remove(c.email), `Deleted ${c.email}.`);
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(sendable.map((c) => c.email).join(', '));
      setNotice({ text: `Copied ${sendable.length} email addresses.` });
    } catch {
      setNotice({ text: 'Couldn’t copy. Download the CSV instead.', error: true });
    }
  };

  const exports = [
    {
      title: 'Full list',
      description:
        'Everyone shown below with their record of consent: date, cause, payment and wording.',
      count: shown.length,
      action: (
        <Button
          size="sm"
          variant="outline"
          disabled={!shown.length}
          onClick={() =>
            downloadCsv(
              `mailing-list_${view}_${today}.csv`,
              toCsv(shown, mailingColumns(data?.campaigns ?? [])),
            )
          }
        >
          <DownloadIcon className="size-4" />
          Download CSV
        </Button>
      ),
    },
    {
      title: 'For your email tool',
      description:
        'Email, first and last name of subscribed contacts, ready to import into Mailchimp, Brevo and similar.',
      count: sendable.length,
      action: (
        <Button
          size="sm"
          variant="outline"
          disabled={!sendable.length}
          onClick={() =>
            downloadCsv(`mailing-list_import_${today}.csv`, toCsv(sendable, emailToolColumns))
          }
        >
          <DownloadIcon className="size-4" />
          Download CSV
        </Button>
      ),
    },
    {
      title: 'Email addresses',
      description: 'Subscribed addresses, comma separated, to paste into an email’s Bcc field.',
      count: sendable.length,
      action: (
        <Button size="sm" variant="outline" disabled={!sendable.length} onClick={copyEmails}>
          Copy addresses
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Subscribed" value={String(subscribed.length)} />
        <StatCard
          label="New in the last 30 days"
          value={String(subscribed.filter((c) => c.consentedAt.slice(0, 10) >= monthAgo).length)}
        />
        <StatCard
          label="Unsubscribed"
          value={String(contacts.length - subscribed.length)}
          hint="Kept as a record; never emailed"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {exports.map((x) => (
          <section key={x.title} className="flex flex-col border border-neutral-200 bg-white p-5">
            <h2 className="font-heading text-title-lg tracking-heading text-primary-900 uppercase">
              {x.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-neutral-500">{x.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-ui text-sm text-neutral-600 tabular-nums">{x.count} rows</span>
              {x.action}
            </div>
          </section>
        ))}
      </div>

      <p
        role="status"
        className={cn(
          'text-sm empty:hidden',
          notice?.error ? 'text-error-700' : 'text-success-700',
        )}
      >
        {notice?.text}
      </p>

      <Panel
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Mailing list"
              className="flex border border-neutral-200 bg-white"
            >
              {(Object.keys(MAILING_VIEWS) as MailingView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-4 py-2 font-label text-xs font-bold tracking-[0.12em] uppercase transition-colors not-last:border-r not-last:border-neutral-200',
                    view === v
                      ? 'bg-primary-500 text-white'
                      : 'text-primary-900 hover:bg-primary-50',
                  )}
                >
                  {MAILING_VIEWS[v]}
                </button>
              ))}
            </div>
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search the mailing list</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="search"
                placeholder="Name, email, organisation, town"
                className="py-1.5 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        }
      >
        {error ? (
          <EmptyState>Couldn’t load the mailing list: {error.message}</EmptyState>
        ) : loading && !data ? (
          <LoadingRows />
        ) : !shown.length ? (
          <EmptyState>
            {contacts.length
              ? 'Nobody matches.'
              : 'No one has opted in yet. Donors who tick “Keep me updated” on the donation form appear here once their donation goes through.'}
          </EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[56rem]">
              <thead>
                <tr>
                  <th className={th}>Contact</th>
                  <th className={th}>Location</th>
                  <th className={th}>Opted in</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const working = busy?.email === c.email ? busy.action : undefined;
                  return (
                    <tr key={c.email} className="hover:bg-primary-50/50">
                      <td className={td}>
                        <span className="block font-bold text-primary-900">{nameOf(c)}</span>
                        {c.organisation && (
                          <span className="block text-xs text-neutral-600">{c.organisation}</span>
                        )}
                        <a
                          href={`mailto:${c.email}`}
                          className="text-xs text-secondary-700 hover:underline"
                        >
                          {c.email}
                        </a>
                      </td>
                      <td className={td}>
                        <span className="block">{c.city}</span>
                        {c.country && c.country !== UK && (
                          <span className="block text-xs">{countryName(c.country)}</span>
                        )}
                      </td>
                      <td className={td}>
                        <span className="block font-ui whitespace-nowrap tabular-nums">
                          {shortDate(c.consentedAt)}
                        </span>
                        {c.consentCampaignId && (
                          <span className="block text-xs">
                            Giving to{' '}
                            {campaignTitle.get(c.consentCampaignId) ?? c.consentCampaignId}
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        <span className="flex flex-wrap gap-1.5">
                          {c.subscribed ? (
                            <Badge tone="success">Subscribed</Badge>
                          ) : (
                            <Badge>
                              Unsubscribed
                              {c.unsubscribedAt && ` · ${shortDate(c.unsubscribedAt)}`}
                            </Badge>
                          )}
                          {!c.livemode && <Badge tone="warning">Test payment</Badge>}
                        </span>
                      </td>
                      <td className={td}>
                        <span className="flex items-center justify-end gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            loading={working === 'toggle'}
                            disabled={!!busy}
                            onClick={() => void toggle(c)}
                          >
                            {c.subscribed ? 'Unsubscribe' : 'Resubscribe'}
                          </Button>
                          <button
                            type="button"
                            className={iconButton}
                            aria-label={`Delete ${c.email}`}
                            title="Delete"
                            aria-busy={working === 'delete'}
                            disabled={!!busy}
                            onClick={() => remove(c)}
                          >
                            {working === 'delete' ? <Spinner /> : <TrashIcon className="size-4" />}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
