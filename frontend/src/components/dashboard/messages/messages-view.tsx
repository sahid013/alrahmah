'use client';

import { useState } from 'react';
import {
  CONTACT_FORM_IDS,
  CONTACT_FORMS,
  type ContactFormId,
  type ContactMessage,
  type MessageStatus,
} from '@/lib/contact/types';
import { cn } from '@/lib/utils/cn';
import { useDashboardApi, useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, LoadingRows, Panel, Select, shortDate, td, th } from '../ui';
import { MessageDetail } from './message-detail';

type View = 'inbox' | 'new' | 'archived';
const VIEWS: Record<View, string> = { inbox: 'Inbox', new: 'Unread', archived: 'Archived' };

const inView = (m: ContactMessage, view: View) =>
  view === 'archived'
    ? m.status === 'archived'
    : view === 'new'
      ? m.status === 'new'
      : m.status !== 'archived';

/** Contact form messages: Inbox / Unread / Archived, filter by form, open one to read and reply. */
export function MessagesView() {
  const api = useDashboardApi();
  const { data, loading, error, reload } = useDashboardQuery((a) => a.messages.list(), []);
  const [view, setView] = useState<View>('inbox');
  const [form, setForm] = useState<ContactFormId | ''>('');
  const [openId, setOpenId] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const messages = data ?? [];
  const shown = messages.filter((m) => inView(m, view) && (!form || m.form === form));
  const unread = messages.filter((m) => m.status === 'new').length;
  const open = messages.find((m) => m.id === openId);

  const setStatus = async (m: ContactMessage, status: MessageStatus) => {
    try {
      await api.messages.setStatus(m.id, status);
      if (status !== 'read') setOpenId(undefined);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not update the message.');
    }
  };

  const openMessage = (m: ContactMessage) => {
    setOpenId(m.id);
    setNotice(undefined);
    if (m.status === 'new') void setStatus(m, 'read');
  };

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(`Delete the message from ${m.name}? This can’t be undone.`)) return;
    try {
      await api.messages.remove(m.id);
      setOpenId(undefined);
      setNotice(`Deleted the message from ${m.name}.`);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not delete the message.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div
          role="tablist"
          aria-label="Messages"
          className="flex border border-neutral-200 bg-white"
        >
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 font-label text-xs font-bold tracking-[0.12em] uppercase transition-colors not-last:border-r not-last:border-neutral-200',
                view === v ? 'bg-primary-500 text-white' : 'text-primary-900 hover:bg-primary-50',
              )}
            >
              {VIEWS[v]}
              {v === 'new' && unread > 0 && <span className="ml-1.5 font-ui">{unread}</span>}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-500">
          Form
          <Select
            value={form}
            onChange={(e) => setForm(e.target.value as ContactFormId | '')}
            className="w-auto"
          >
            <option value="">All forms</option>
            {CONTACT_FORM_IDS.map((id) => (
              <option key={id} value={id}>
                {CONTACT_FORMS[id].label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <p role="status" className="text-sm text-success-700 empty:hidden">
        {notice}
      </p>

      <Panel>
        {error ? (
          <EmptyState>Couldn’t load messages: {error.message}</EmptyState>
        ) : loading && !data ? (
          <LoadingRows />
        ) : !shown.length ? (
          <EmptyState>
            {view === 'archived' ? 'No archived messages.' : 'No messages here yet.'}
          </EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead>
                <tr>
                  <th className={th}>Received</th>
                  <th className={th}>From</th>
                  <th className={th}>Form</th>
                  <th className={th}>Message</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => {
                  const isNew = m.status === 'new';
                  return (
                    <tr
                      key={m.id}
                      onClick={() => openMessage(m)}
                      className={cn(
                        'cursor-pointer hover:bg-primary-50',
                        isNew && 'bg-secondary-50',
                      )}
                    >
                      <td className={cn(td, 'whitespace-nowrap')}>
                        {shortDate(m.createdAt)}
                        {isNew && (
                          <span className="ml-2">
                            <Badge tone="sky">New</Badge>
                          </span>
                        )}
                      </td>
                      <td className={td}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMessage(m);
                          }}
                          className={cn(
                            'text-left text-primary-900 hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-secondary-500',
                            isNew && 'font-bold',
                          )}
                        >
                          {m.name}
                        </button>
                        <span className="block text-xs text-neutral-400">{m.email}</span>
                      </td>
                      <td className={td}>
                        <Badge tone="indigo">{CONTACT_FORMS[m.form].label}</Badge>
                      </td>
                      <td className={cn(td, 'max-w-md')}>
                        <span className="line-clamp-2">{m.message}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <MessageDetail
        message={open}
        onClose={() => setOpenId(undefined)}
        onStatus={setStatus}
        onRemove={remove}
      />
    </div>
  );
}
