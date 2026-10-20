'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon, MailIcon, TrashIcon } from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui/button';
import { CONTACT_FORMS, type ContactMessage, type MessageStatus } from '@/lib/contact/types';
import { Badge, iconButton, shortDate } from '../ui';

/** One message, opened from the list (native modal dialog: focus trap, Esc to close). */
export function MessageDetail({
  message,
  onClose,
  onStatus,
  onRemove,
}: {
  message?: ContactMessage;
  onClose: () => void;
  onStatus: (message: ContactMessage, status: MessageStatus) => Promise<void>;
  onRemove: (message: ContactMessage) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<'status' | 'remove'>();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (message && !dialog.open) dialog.showModal();
    if (!message && dialog.open) dialog.close();
  }, [message]);

  const run = async (kind: 'status' | 'remove', action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
    } finally {
      setBusy(undefined);
    }
  };

  const m = message;
  const form = m && CONTACT_FORMS[m.form];
  const reply =
    m &&
    `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${form?.subject ?? 'Your message'}`)}` +
      `&body=${encodeURIComponent(`\n\n\nOn ${shortDate(m.createdAt)}, ${m.name} wrote:\n> ${m.message.replace(/\n/g, '\n> ')}`)}`;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="message-detail-title"
      className="m-0 ml-auto h-full max-h-none w-full max-w-lg bg-white p-0 backdrop:bg-primary-950/60"
    >
      {m && form && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
            <div className="min-w-0">
              <p className="font-label text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
                {shortDate(m.createdAt)} · {m.createdAt.slice(11, 16)} UTC
              </p>
              <h2
                id="message-detail-title"
                className="mt-1 text-title-xl break-words text-primary-900"
              >
                {m.name}
              </h2>
              <a
                href={`mailto:${m.email}`}
                className="text-sm break-all text-primary-500 hover:text-secondary-700"
              >
                {m.email}
              </a>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="indigo">{form.label}</Badge>
                {m.status === 'archived' && <Badge>Archived</Badge>}
              </div>
            </div>
            <button type="button" onClick={onClose} className={iconButton} aria-label="Close">
              <CloseIcon className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-base leading-relaxed whitespace-pre-wrap text-primary-950">
              {m.message}
            </p>
            <dl className="mt-8 space-y-1 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
              {m.page && (
                <div>
                  <dt className="inline">Sent from: </dt>
                  <dd className="inline">{m.page}</dd>
                </div>
              )}
              <div>
                <dt className="inline">Email notification: </dt>
                <dd className="inline">
                  {m.emailedTo ? (
                    `sent to ${m.emailedTo}`
                  ) : (
                    <span className="text-warning-700">not sent ({m.emailError ?? 'unknown'})</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-neutral-200 px-6 py-4">
            <ButtonLink href={reply ?? ''} size="sm">
              <MailIcon className="size-4" />
              Reply by email
            </ButtonLink>
            <Button
              variant="outline"
              size="sm"
              loading={busy === 'status'}
              disabled={!!busy}
              onClick={() =>
                run('status', () => onStatus(m, m.status === 'archived' ? 'read' : 'archived'))
              }
            >
              {m.status === 'archived' ? 'Move to inbox' : 'Archive'}
            </Button>
            {m.status !== 'archived' && (
              <Button
                variant="ghost"
                size="sm"
                disabled={!!busy}
                onClick={() => run('status', () => onStatus(m, 'new'))}
              >
                Mark as unread
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-error-700"
              loading={busy === 'remove'}
              disabled={!!busy}
              onClick={() => run('remove', () => onRemove(m))}
            >
              <TrashIcon className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
