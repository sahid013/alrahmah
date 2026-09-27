'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils/cn';

const fieldClass =
  'mt-2 block w-full border border-neutral-300 bg-white px-4 py-3 text-lg text-primary-900 ' +
  'placeholder:text-neutral-400 transition-colors duration-300 hover:border-primary-300 ' +
  'focus:border-primary-500 focus:outline-2 focus:outline-offset-0 focus:outline-secondary-500';

const labelClass = 'font-label text-sm font-bold tracking-[0.12em] text-primary-900 uppercase';

/**
 * Name / email / message form. Until the backend has a contact endpoint, sending opens the
 * visitor's email app with the message filled in, addressed to the masjid.
 * TODO: POST to `/api/v1/contact` via `api.post` once the backend endpoint exists.
 */
export function ContactForm() {
  const [opened, setOpened] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const message = String(form.get('message') ?? '').trim();
    const subject = `Website enquiry from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            name="name"
            type="text"
            required
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
            autoComplete="email"
            placeholder="Email"
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>Message</span>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Message"
          className={cn(fieldClass, 'resize-y')}
        />
      </label>
      <Button type="submit" size="lg" className="w-full">
        Send
        <ArrowRightIcon />
      </Button>
      <p aria-live="polite" className="text-base text-neutral-500">
        {opened &&
          `Your email app should open with your message. If it doesn't, email us at ${siteConfig.contact.email}.`}
      </p>
    </form>
  );
}
