import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useMotion } from '../../hooks/useMotion';
import { fadeUp, pixelFormation } from '../../lib/motion';
import { contact, headings } from '../../data/portfolio';
import { SectionPill } from '../ui/SectionPill';
import { SectionHeading } from '../ui/SectionHeading';
import { PixelFormation } from '../ui/PixelFormation';
import { ContactForm } from '../ui/ContactForm';
import { MailIcon, PhoneIcon } from '../ui/Icons';

export function Contact() {
  const ref = useRef<HTMLElement>(null);

  useMotion(ref, (env) => {
    const root = ref.current;
    if (env.reduce || !root) return;
    const play = { toggleActions: 'play none none reverse' } as const;

    // Left column: icons assemble from pixels, copy simply fades in.
    root.querySelectorAll<HTMLElement>('.contact-item').forEach((item) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 85%', ...play } });
      const icon = item.querySelector('.contact-item__icon');
      if (icon) tl.add(pixelFormation(icon, env, { zoom: 1.8, blur: 6 }), 0);
      tl.fromTo(item.querySelectorAll('.contact-item__text > *'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, stagger: 0.12, ease: 'power1.out' }, 0.35);
    });

    // Right column: every field rises on its own beat; the button forms last.
    const form = root.querySelector<HTMLElement>('.contact-form');
    if (form) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: form, start: 'top 82%', ...play } });
      tl.fromTo(form, { autoAlpha: 0, y: env.desktop ? 50 : 24 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0)
        .add(fadeUp(form.querySelectorAll('.form-anim'), env, { stagger: 0.12, duration: 0.7 }), 0.2);
      const submit = form.querySelector('.contact-form__submit-pf');
      if (submit) tl.add(pixelFormation(submit, env, { zoom: 1.25, blur: 8 }), 0.65);
    }
  });

  return (
    <section ref={ref} id="contact" className="section section--light contact" aria-labelledby="contact-title">
      <div className="container">
        <SectionPill label={headings.contact.pill} />
        <SectionHeading id="contact-title" parts={headings.contact.parts} />

        <div className="contact__grid">
          <address className="contact__info">
            <div className="contact-item">
              <PixelFormation cols={6} rows={6} className="contact-item__icon">
                <PhoneIcon />
              </PixelFormation>
              <div className="contact-item__text">
                <p className="contact-item__title">{contact.callTitle}</p>
                <p className="contact-item__hint">{contact.callHint}</p>
                <a className="contact-item__link" href={contact.phoneHref}>
                  {contact.phone}
                </a>
              </div>
            </div>
            <div className="contact-item">
              <PixelFormation cols={6} rows={6} className="contact-item__icon">
                <MailIcon />
              </PixelFormation>
              <div className="contact-item__text">
                <p className="contact-item__title">{contact.mailTitle}</p>
                <p className="contact-item__hint">{contact.mailHint}</p>
                <a className="contact-item__link" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </div>
            </div>
          </address>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
