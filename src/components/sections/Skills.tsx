import { headings, proficiencies, tools } from '../../data/portfolio';
import { SectionPill } from '../ui/SectionPill';
import { SectionHeading } from '../ui/SectionHeading';
import { InfiniteMarquee } from '../ui/InfiniteMarquee';
import { ToolTile } from '../ui/ToolTile';
import { SkillProgress } from '../ui/SkillProgress';

export function Skills() {
  return (
    <section id="skills" className="section section--light skills" aria-labelledby="skills-title">
      <div className="container">
        <SectionPill label={headings.skills.pill} />
        <SectionHeading id="skills-title" parts={headings.skills.parts} />
      </div>
      <InfiniteMarquee items={tools} getKey={(t) => t.id} label="Tools I use" renderItem={(t) => <ToolTile tool={t} />} />
      <div className="container">
        <SkillProgress items={proficiencies} />
      </div>
    </section>
  );
}
