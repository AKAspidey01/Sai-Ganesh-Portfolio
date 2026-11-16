import { useRef, useState, type FormEvent } from 'react';
import { contact } from '../../data/portfolio';
import { PixelFormation } from './PixelFormation';
import { ArrowUpRight, ChevronDown, MailSmallIcon } from './Icons';

type Status = { kind: 'idle' | 'error' | 'ok'; text: string };

/**
 * No backend: a valid submission opens the visitor's mail app with the
 * message prefilled. Swap `handleSubmit` for a fetch() to Formspree,
 * Resend, etc. when a backend exists.
 */
export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [country, setCountry] = useState(contact.countries[0].code);
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' });
  const placeholder = contact.countries.find((c) => c.code === country)?.placeholder ?? '';

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.elements.namedItem('email') as HTMLInputElement;
    const phone = form.elements.namedItem('phone') as HTMLInputElement;
    const message = form.elements.namedItem('message') as HTMLTextAreaElement;

    if (!message.value.trim()) {
      setStatus({ kind: 'error', text: 'Add a message so Sai knows what you need.' });
      message.focus();
      return;
    }
    if (email.value && !email.checkValidity()) {
      setStatus({ kind: 'error', text: 'Enter an email like name@example.com, or leave it empty.' });
      email.focus();
      return;
    }

    const body = [message.value.trim(), '', email.value && `Reply to: ${email.value}`, phone.value && `Phone (${country}): ${phone.value}`]
      .filter(Boolean)
      .join('\n');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Project enquiry from your portfolio')}&body=${encodeURIComponent(body)}`;
    setStatus({ kind: 'ok', text: 'Your mail app is opening with the message ready to send.' });
  };

  return (
    <form ref={formRef} className="contact-form" onSubmit={handleSubmit} noValidate aria-labelledby="form-title">
      <h3 id="form-title" className="contact-form__title form-anim">
        Lets Start <em>The Conversation</em>
      </h3>

      <div className="field form-anim">
        <label htmlFor="cf-email" className="field__label">
          Email
        </label>
        <div className="field__control">
          <MailSmallIcon className="field__icon" />
          <input id="cf-email" name="email" type="email" autoComplete="email" placeholder="example@gmail.com" />
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
                  {c.code}
                </option>
              ))}
            </select>
            <ChevronDown />
          </span>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder={placeholder} />
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
            placeholder="Include a message..."
            aria-describedby="cf-status"
            aria-invalid={status.kind === 'error' || undefined}
          />
        </div>
      </div>

      <PixelFormation cols={18} rows={2} className="contact-form__submit-pf" contentClassName="contact-form__submit-in">
        <button type="submit" className="contact-form__submit">
          <span>Send me your message!</span>
          <span className="contact-form__submit-icon" aria-hidden="true">
            <ArrowUpRight width={14} height={14} />
          </span>
        </button>
      </PixelFormation>

      <p id="cf-status" className={`contact-form__status contact-form__status--${status.kind}`} role="status" aria-live="polite">
        {status.text}
      </p>
    </form>
  );
}
