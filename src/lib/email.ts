/**
 * Contact form → EmailJS.
 *
 * Keys come from Vite env vars (see .env.example). The SDK is imported on
 * submit, so it never weighs on the first page load.
 * Template variables: {{email}}, {{number}}, {{message}}.
 */
export interface ContactPayload {
  email: string;
  number: string;
  message: string;
}

export class EmailConfigError extends Error {}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) {
    throw new EmailConfigError('EmailJS keys are missing: copy .env.example to .env and fill them in.');
  }

  const { send } = await import('@emailjs/browser');
  await send(
    serviceId,
    templateId,
    { email: payload.email, number: payload.number, message: payload.message },
    {
      publicKey,
      // One send per 10 s from this browser: stops double-submits and casual spam.
      limitRate: { id: 'portfolio-contact', throttle: 10_000 },
    },
  );
}

/** EmailJS rejects with { status, text }; 429 = rate limited. */
export function isRateLimited(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { status?: number }).status === 429;
}
