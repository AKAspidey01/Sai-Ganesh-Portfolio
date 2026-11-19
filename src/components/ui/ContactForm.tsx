import { useRef, useState, type FormEvent } from 'react';
import { contact } from '../../data/portfolio';
import { isRateLimited, sendContactMessage } from '../../lib/email';
import { PixelFormation } from './PixelFormation';
import { ArrowUpRight, ChevronDown, MailSmallIcon } from './Icons';
import { ThankYou } from '../layout/ThankYou';

type Field = 'email' | 'phone' | 'message';
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; text: string; field?: Field };

/** National number digits, with a typed-in country code or leading 0 removed. */
function nationalDigits(raw: string, dial: string, digits: number): string {
  let d = raw.replace(/\D/g, '');
  const cc = dial.replace(/\D/g, '');
  if (d.length === digits + cc.length && d.startsWith(cc)) d = d.slice(cc.length);
  if (d.length === digits + 1 && d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Back to a fresh page, at the top (the thank-you page ends here). */
function reloadAtTop() {
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  // Dropping a #hash (e.g. #contact from "Let's talk") makes this a clean load at the top.
  window.location.replace(window.location.pathname + window.location.search);
}

/**
 * Email (required), phone (optional, country code picker defaulting to India)
 * and message (required) → EmailJS. On success a full-screen thank-you shows
 * for a few seconds, then the form resets and the page reloads.
 */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [country, setCountry] = useState(contact.countries[0].code);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [sent, setSent] = useState(false);
  const current = contact.countries.find((c) => c.code === country) ?? contact.countries[0];
  const sending = status.kind === 'sending';
  const invalid = (field: Field) => status.kind === 'error' && status.field === field;

  const fail = (text: string, field?: Field) => {
    // Clear first so an identical message is announced again.
    setStatus({ kind: 'idle' });
    requestAnimationFrame(() => setStatus({ kind: 'error', text, field }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const email = form.elements.namedItem('email') as HTMLInputElement;
    const phone = form.elements.namedItem('phone') as HTMLInputElement;
    const message = form.elements.namedItem('message') as HTMLTextAreaElement;

    if (!email.value.trim() || !email.checkValidity()) {
      fail(email.value.trim() ? 'Enter an email like name@example.com.' : 'Add your email so Sai can reply.', 'email');
      email.focus();
      return;
    }
    const digits = nationalDigits(phone.value, current.dial, current.digits);
    if (phone.value.trim() && (digits.length !== current.digits || (current.code === 'IN' && !/^[6-9]/.test(digits)))) {
      fail(`Enter a ${current.digits}-digit ${current.code} number, or leave it empty.`, 'phone');
      phone.focus();
      return;
    }
    if (!message.value.trim()) {
      fail('Add a message so Sai knows what you need.', 'message');
      message.focus();
      return;
    }

    setStatus({ kind: 'sending' });
    try {
      await sendContactMessage({
        email: email.value.trim(),
        number: digits ? `${current.dial} ${digits}` : 'Not provided',
        message: message.value.trim(),
      });
      setStatus({ kind: 'idle' });
      setSent(true);
    } catch (err) {
      fail(
        isRateLimited(err)
          ? 'You just sent a message — please wait a few seconds before sending another.'
          : `Couldn’t send right now. Please try again, or email ${contact.email}.`,
      );
    }
  };

  // Typing in the field that caused the error clears it.
  const clearFor = (field: Field) => () => {
    if (invalid(field)) setStatus({ kind: 'idle' });
  };

  return (
    <>
      <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate aria-labelledby="form-title" aria-busy={sending}>
        <h3 id="form-title" className="contact-form__title form-anim">
          Lets Start <em>The Conversation</em>
        </h3>

        <div className="field form-anim">
          <label htmlFor="cf-email" className="field__label">
            Email<span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="field__control">
            <MailSmallIcon className="field__icon" />
            <input
              id="cf-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@gmail.com"
              aria-invalid={invalid('email') || undefined}
              aria-describedby={invalid('email') ? 'cf-status' : undefined}
              onInput={clearFor('email')}
            />
          </div>
        </div>

        <div className="field form-anim">
          <label htmlFor="cf-phone" className="field__label">
            Phone number
          </label>
          <div className="field__control field__control--split">
            <span className="field__select">
              <label htmlFor="cf-country" className="sr-only">
                Country code
              </label>
              <select id="cf-country" name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                {contact.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.dial}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </span>
            <input
              id="cf-phone"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder={current.placeholder}
              aria-invalid={invalid('phone') || undefined}
              aria-describedby={invalid('phone') ? 'cf-status' : undefined}
              onInput={clearFor('phone')}
            />
          </div>
        </div>

        <div className="field form-anim">
          <label htmlFor="cf-message" className="field__label">
            Message<span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <div className="field__control field__control--area">
            <textarea
              id="cf-message"
              name="message"
              rows={4}
              required
              maxLength={4000}
              placeholder="Include a message..."
              aria-invalid={invalid('message') || undefined}
              aria-describedby={invalid('message') ? 'cf-status' : undefined}
              onInput={clearFor('message')}
            />
          </div>
        </div>

        <PixelFormation cols={18} rows={2} className="contact-form__submit-pf" contentClassName="contact-form__submit-in">
          <button type="submit" className="contact-form__submit" disabled={sending}>
            <span>{sending ? 'Sending…' : 'Send me your message!'}</span>
            <span className={`contact-form__submit-icon${sending ? ' is-sending' : ''}`} aria-hidden="true">
              <ArrowUpRight width={14} height={14} />
            </span>
          </button>
        </PixelFormation>

        <p id="cf-status" className={`contact-form__status contact-form__status--${status.kind}`} role="status" aria-live="polite">
          {status.kind === 'error' ? status.text : status.kind === 'sending' ? 'Sending your message…' : ''}
        </p>
      </form>

      {sent && (
        <ThankYou
          onDone={() => {
            formRef.current?.reset();
            reloadAtTop();
          }}
        />
      )}
    </>
  );
}
