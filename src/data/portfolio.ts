/**
 * All repeated content lives here. Add/remove projects, reviews, tools or
 * socials without touching component logic.
 *
 * Items marked `// placeholder` are stand-ins (the reference shows only three
 * of each) — replace them with real work and real client quotes.
 */

export interface HeadingPart {
  text: string;
  /** Rendered in Pacifico with the handwriting reveal. */
  script?: boolean;
}

export interface Kpi {
  id: string;
  value: string;
  label: string;
  /** Corner of the KPI field this block occupies. */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface Project {
  id: string;
  title: string;
  category: string;
  href: string;
  /** Optional cover image (e.g. /projects/finance.webp). Falls back to a drawn dashboard mockup. */
  image?: string;
  /** Accent used by the fallback mockup. */
  accent?: string;
}

export interface Tool {
  id: string;
  name: string;
  /** Official SVG logo placed in /public/icons. Missing → monogram tile. */
  logo?: string;
  monogram: string;
}

export interface Proficiency {
  id: string;
  label: string;
  value: number; // 0–100
}

export interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatar?: string;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export const site = {
  initials: 'ASG',
  heroName: 'SAI GANESH',
  footerName: 'A.SAI GANESH',
  fullName: 'Anupoju Sai Ganesh',
  roleBadge: 'UI UX DESIGNER',
  roleSecondary: 'FRONT END DEVELOPER',
  location: 'ANDHRAPRADESH , INDIA',
  timeZone: 'Asia/Kolkata',
  timeZoneLabel: 'IST',
  cvHref: '/Sai-Ganesh-CV.pdf',
  copyrightYear: 2026,
};

export const nav = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

type HeadingConfig = { pill: string; parts: HeadingPart[] };

export const headings: Record<'about' | 'work' | 'skills' | 'reviews' | 'contact', HeadingConfig> = {
  about: { pill: 'About Me', parts: [{ text: 'More Than a ' }, { text: 'Designer', script: true }] },
  work: { pill: 'Selected Works', parts: [{ text: 'A Few Things ' }, { text: 'I’ve Made', script: true }] },
  skills: { pill: 'My Professional', parts: [{ text: 'Skills & ' }, { text: 'Tools', script: true }] },
  reviews: { pill: 'Testimonials', parts: [{ text: 'What My Clients ' }, { text: 'Say', script: true }] },
  contact: { pill: 'Contact Me', parts: [{ text: 'Get in ' }, { text: 'Touch', script: true }] },
};

export const kpis: Kpi[] = [
  { id: 'experience', value: '05', label: 'Years Experience', position: 'top-left' },
  { id: 'collabs', value: '20+', label: 'Successful Collaborations', position: 'top-right' },
  { id: 'projects', value: '180+', label: 'Projects Delivered', position: 'bottom-left' },
  { id: 'rating', value: '4.9', label: 'Overall Client Rating', position: 'bottom-right' },
];

export const projects: Project[] = [
  { id: 'finance-1', title: 'Finance Dashboard', category: 'Web App', href: '#', accent: '#d4f53c' },
  { id: 'finance-2', title: 'Finance Dashboard', category: 'Web App', href: '#', accent: '#d4f53c' },
  { id: 'finance-3', title: 'Finance Dashboard', category: 'Web App', href: '#', accent: '#d4f53c' },
  { id: 'clinic', title: 'Clinic Booking', category: 'Mobile App', href: '#', accent: '#7dc8ff' }, // placeholder
  { id: 'store', title: 'Store Analytics', category: 'Web App', href: '#', accent: '#f0626a' }, // placeholder
  { id: 'trips', title: 'Trip Planner', category: 'Landing Page', href: '#', accent: '#e3a6ff' }, // placeholder
];

export const tools: Tool[] = [
  { id: 'figma', name: 'Figma', monogram: 'Fg' },
  { id: 'react', name: 'React', monogram: 'Re' },
  { id: 'vscode', name: 'VS Code', monogram: 'VS' },
  { id: 'framer', name: 'Framer', monogram: 'Fr' },
  { id: 'typescript', name: 'TypeScript', monogram: 'TS' }, // placeholder
  { id: 'gsap', name: 'GSAP', monogram: 'Gs' }, // placeholder
  { id: 'illustrator', name: 'Illustrator', monogram: 'Ai' }, // placeholder
  { id: 'photoshop', name: 'Photoshop', monogram: 'Ps' }, // placeholder
];

export const proficiencies: Proficiency[] = [
  { id: 'uiux', label: 'UI UX Design', value: 90 },
  { id: 'frontend', label: 'Front End Development', value: 70 },
  { id: 'backend', label: 'Back End Development', value: 40 },
  { id: 'mobile', label: 'Mobile App Development', value: 50 },
];

export const reviews: Review[] = [
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    location: 'Bangalore , India',
    rating: 5,
    quote:
      'Codency transformed our idea into a polished, high-quality product faster than we expected. Their process was smooth, and easy to follow.',
  },
  {
    id: 'surya',
    name: 'Surya Lalitha',
    location: 'California , USA',
    rating: 5,
    quote:
      'Their attention to detail and clean design approach really stood out. The final product not only looks great but also performs seamlessly.',
  },
  {
    id: 'daniel',
    name: 'Daniel Weber',
    location: 'Dubai , UAE',
    rating: 5,
    quote:
      'From strategy to launch, everything was handled with clarity and professionalism. The team ensured we were aligned at every step.',
  },
  {
    id: 'placeholder-1', // placeholder
    name: 'Client Name',
    location: 'City , Country',
    rating: 5,
    quote: 'Replace with a real client quote. Two or three sentences reads best at this card size.',
  },
  {
    id: 'placeholder-2', // placeholder
    name: 'Client Name',
    location: 'City , Country',
    rating: 5,
    quote: 'Replace with a real client quote. Two or three sentences reads best at this card size.',
  },
];

export const contact = {
  phone: '+91 9014579785',
  phoneHref: 'tel:+919014579785',
  email: 'saiganesh.anupoju@gmail.com',
  callTitle: 'Want to call me?',
  callHint: 'Tap to call or send a message',
  mailTitle: 'Want to chat me?',
  mailHint: 'Send me a mail shortly',
  /** Phone country picker; the first entry is the default. `digits` = national number length. */
  countries: [
    { code: 'IN', dial: '+91', placeholder: '90000 00000', digits: 10 },
    { code: 'US', dial: '+1', placeholder: '(555) 000-0000', digits: 10 },
    { code: 'AE', dial: '+971', placeholder: '50 000 0000', digits: 9 },
    { code: 'GB', dial: '+44', placeholder: '7700 900000', digits: 10 },
  ],
};

/** Full-screen thank-you shown after the contact form is sent. */
export const thankYou = {
  brand: 'A SAI GANESH',
  title: 'THANK YOU',
  script: 'for Contacting Me!',
  message: 'I’ve received your message and will get in touch with you shortly.',
  back: 'Back to Portfolio',
  /** ms before the form resets and the page reloads */
  duration: 8000,
};

export const socials: SocialLink[] = [
  { id: 'linkedin', label: 'LINKEDIN', href: 'https://www.linkedin.com/' },
  { id: 'instagram', label: 'INSTAGRAM', href: 'https://www.instagram.com/' },
  { id: 'twitter', label: 'TWITTER', href: 'https://x.com/' },
  { id: 'gmail', label: 'GMAIL', href: 'mailto:saiganesh.anupoju@gmail.com' },
];
