import { Input } from '../ui';

/** 6-digit authenticator code field (numeric keypad, autofill from password managers). */
export function CodeInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={6}
      autoFocus={autoFocus}
      placeholder="000000"
      aria-label="6-digit code"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className="py-3 text-center font-ui text-2xl tracking-[0.5em] tabular-nums"
    />
  );
}
