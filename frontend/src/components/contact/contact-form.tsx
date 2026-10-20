'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { inboxFor, type ContactFormId } from '@/lib/contact/types';
import { cn } from '@/lib/utils/cn';

const fieldClass =
  'mt-2 block w-full border border-neutral-300 bg-white px-4 py-3 text-lg text-primary-900 ' +
  'placeholder:text-neutral-400 transition-colors duration-300 hover:border-primary-300 ' +
  'focus:border-primary-500 focus:outline-2 focus:outline-offset-0 focus:outline-secondary-500';

const labelClass = 'font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase';

type State =
  | { status: 'idle' | 'sending' }
  | { status: 'sent'; name: string; email: string }
  | { status: 'error'; message: string };

/**
 * Name / email / message form. Sends to `POST /api/contact`, which saves the message (dashboard →
 * Messages) and emails it to the form's inbox. `form` picks the inbox and subject on the server:
 * the browser never chooses where email goes.
 */
export function ContactForm({
  form = 'general',
  messageLabel = 'Message',
  messagePlaceholder = 'Message',
}: {
  form?: ContactFormId;
  messageLabel?: string;
  messagePlaceholder?: string;
}) {
  const [state, setState] = useState<State>({ status: 'idle' });
  // When the form appeared: messages sent within a couple of seconds are from bots.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? '').trim();
    const name = field('name');
    const email = field('email');
    setState({ status: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          name,
          email,
          message: field('message'),
          page: window.location.pathname,
          website: field('website'),
          elapsedMs: shownAt.current ? Date.now() - shownAt.current : undefined,
        }),
      });
      const result = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Your message couldn’t be sent.');
      setState({ status: 'sent', name, email });
    } catch (error) {
      const inbox = inboxFor(form);
      setState({
        status: 'error',
        message:
          error instanceof Error && error.message !== 'Failed to fetch'
            ? error.message
            : `Your message couldn’t be sent. Please check your connection and try again${inbox ? `, or email us at ${inbox}` : ''}.`,
      });
    }
  };

  if (state.status === 'sent')
    return (
      <div role="status" className="border-l-2 border-secondary-500 bg-primary-50 p-6 sm:p-8">
        <p className="text-title-xl leading-tight text-primary-900">
          Thank you, {state.name.split(' ')[0]}
        </p>
        <p className="mt-3 text-lg leading-relaxed text-neutral-600">
          We’ve received your message and will reply to{' '}
          <span className="font-bold text-primary-900">{state.email}</span> as soon as we can.
        </p>
        <Button
          variant="tertiary"
          size="sm"
          className="mt-4"
          onClick={() => setState({ status: 'idle' })}
        >
          Send another message
        </Button>
      </div>
    );

  const sending = state.status === 'sending';
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Name"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="Email"
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>{messageLabel}</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={5000}
          placeholder={messagePlaceholder}
          className={cn(fieldClass, 'resize-y')}
        />
      </label>
      {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={sending}>
        {sending ? 'Sending…' : 'Send'}
        {!sending && <ArrowRightIcon />}
      </Button>
      <p aria-live="polite" className="text-base text-error-700 empty:hidden">
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
