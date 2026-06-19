import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { memo } from "react";

import type { HotspotItem } from "../../../types/lesson";
import { getHotspotKind, hotspotKindLabel } from "../../../utils/hotspots";

function stripHtmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getRowTitle(hotspot: HotspotItem): string {
  const label = hotspot.label?.trim();
  if (label) {
    return label;
  }
  const description = stripHtmlToText(hotspot.description_html ?? "");
  if (description) {
    return description.length > 48 ? `${description.slice(0, 48).trim()}…` : description;
  }
  return "Без подписи";
}

type HotspotEditorListItemProps = {
  hotspot: HotspotItem;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
};

const HotspotEditorListItem = memo(function HotspotEditorListItem({
  hotspot,
  index,
  active,
  onSelect,
}: HotspotEditorListItemProps) {
  const kind = getHotspotKind(hotspot);
  const title = getRowTitle(hotspot);

  return (
    <li
      data-hotspot-id={hotspot.id}
      className={`hotspot-editor-list-item${active ? " hotspot-editor-list-item-active" : ""}`}
      role="option"
      aria-selected={active}
      onClick={() => onSelect(hotspot.id)}
    >
      <span className="hotspot-editor-list-index" aria-hidden>
        {index + 1}
      </span>
      <Chip size="small" label={hotspotKindLabel(kind)} className={`hotspot-kind-badge hotspot-kind-badge--${kind}`} />
      <Typography variant="body2" component="span" className="hotspot-editor-list-title" noWrap title={title}>
        {title}
      </Typography>
    </li>
  );
});

type HotspotEditorListProps = {
  hotspots: HotspotItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const HotspotEditorList = memo(function HotspotEditorList({
  hotspots,
  selectedId,
  onSelect,
}: HotspotEditorListProps) {
  if (hotspots.length === 0) {
    return (
      <div className="hotspot-editor-list-panel">
        <Typography variant="body2" color="text.secondary" className="hotspot-editor-list-empty">
          Нет меток. Нарисуйте зону или поставьте метку на скриншоте.
        </Typography>
      </div>
    );
  }

  return (
    <div className="hotspot-editor-list-panel">
      <div className="hotspot-editor-list-header">
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Метки · {hotspots.length}
        </Typography>
      </div>
      <ul className="hotspot-editor-list" role="listbox" aria-label="Список меток">
        {hotspots.map((hotspot, index) => (
          <HotspotEditorListItem
            key={hotspot.id}
            hotspot={hotspot}
            index={index}
            active={selectedId === hotspot.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
});

export default HotspotEditorList;
