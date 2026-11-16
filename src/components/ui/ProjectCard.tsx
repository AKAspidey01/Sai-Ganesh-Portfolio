import type { Project } from '../../data/portfolio';
import { ArrowUpRight } from './Icons';
import { DashboardMock } from './DashboardMock';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a className="project-card" href={project.href}>
      <span className="project-card__tag">{project.category}</span>
      <span className="project-card__media">
        <span className="hpg__parallax">
          {project.image ? (
            <img src={project.image} alt="" loading="lazy" decoding="async" />
          ) : (
            <DashboardMock accent={project.accent} />
          )}
        </span>
      </span>
      <span className="project-card__foot">
        <span className="project-card__title">{project.title}</span>
        <ArrowUpRight className="project-card__arrow" />
      </span>
    </a>
  );
}
