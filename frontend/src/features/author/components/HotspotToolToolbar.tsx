import CropFreeIcon from "@mui/icons-material/CropFree";
import PlaceIcon from "@mui/icons-material/Place";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";

import type { HotspotKind } from "../../../types/lesson";

import styles from "./HotspotToolToolbar.module.css";

export type HotspotToolMode = HotspotKind;

type HotspotToolToolbarProps = {
  value: HotspotToolMode;
  onChange: (mode: HotspotToolMode) => void;
};

export default function HotspotToolToolbar({ value, onChange }: HotspotToolToolbarProps) {
  return (
    <ToggleButtonGroup
      className={styles.toolbar}
      size="small"
      exclusive
      value={value}
      onChange={(_event, next: HotspotToolMode | null) => {
        if (next) {
          onChange(next);
        }
      }}
      aria-label="Инструмент разметки скриншота"
    >
      <Tooltip title="Прямоугольная зона с подсказкой">
        <ToggleButton value="region" aria-label="Зона">
          <CropFreeIcon fontSize="small" />
          <span>Зона</span>
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Область увеличения по клику ученика">
        <ToggleButton value="zoom" aria-label="Увеличение">
          <ZoomInMapIcon fontSize="small" />
          <span>Увеличение</span>
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Точка с всплывающей подсказкой">
        <ToggleButton value="pin" aria-label="Метка">
          <PlaceIcon fontSize="small" />
          <span>Метка</span>
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
