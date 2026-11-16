import { useEffect, useRef } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { useCoinJourney } from './hooks/useCoinJourney';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { About } from './components/sections/About';
import { Projects } from './components/sections/Projects';
import { Skills } from './components/sections/Skills';
import { Reviews } from './components/sections/Reviews';
import { Contact } from './components/sections/Contact';

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroCoinRef = useRef<HTMLDivElement>(null);
  const aboutSlotRef = useRef<HTMLDivElement>(null);

  // Runs after every section has registered its triggers (parent effects run last).
  useCoinJourney(heroRef, heroCoinRef, aboutSlotRef, mainRef);

  useEffect(() => {
    // Web fonts change line boxes → re-measure pins and scrub ranges once they land.
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Header />
      <main ref={mainRef}>
        <Hero sectionRef={heroRef} coinRef={heroCoinRef} />
        <About slotRef={aboutSlotRef} />
        <Projects />
        <Skills />
        <Reviews />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
