import type { Tool } from '../../data/portfolio';

export function ToolTile({ tool }: { tool: Tool }) {
  return (
    <span className="tool-tile">
      {tool.logo ? (
        <img className="tool-tile__logo" src={tool.logo} alt={tool.name} loading="lazy" decoding="async" />
      ) : (
        <>
          <span className="tool-tile__mono" aria-hidden="true">
            {tool.monogram}
          </span>
          <span className="tool-tile__name">{tool.name}</span>
        </>
      )}
    </span>
  );
}
