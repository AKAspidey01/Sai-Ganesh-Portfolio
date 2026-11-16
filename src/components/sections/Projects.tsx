import { headings, projects } from '../../data/portfolio';
import { SectionPill } from '../ui/SectionPill';
import { SectionHeading } from '../ui/SectionHeading';
import { HorizontalPinnedGallery } from '../ui/HorizontalPinnedGallery';
import { ProjectCard } from '../ui/ProjectCard';

export function Projects() {
  return (
    <section id="work" className="section section--dark section--pinned" aria-labelledby="work-title">
      <div className="container">
        <SectionPill label={headings.work.pill} tone="dark" />
        <SectionHeading id="work-title" parts={headings.work.parts} tone="dark" />
      </div>
      <HorizontalPinnedGallery
        items={projects}
        getKey={(p) => p.id}
        label="Projects"
        className="hpg--projects"
        renderItem={(p) => <ProjectCard project={p} />}
      />
    </section>
  );
}
