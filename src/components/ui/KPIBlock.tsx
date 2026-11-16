import type { Kpi } from '../../data/portfolio';
import { SplitChars } from './SplitChars';

export function KPIBlock({ kpi }: { kpi: Kpi }) {
  return (
    <p className={`kpi kpi--${kpi.position}`}>
      <SplitChars text={kpi.value} className="kpi__value" />
      <span className="kpi__label">{kpi.label}</span>
    </p>
  );
}
