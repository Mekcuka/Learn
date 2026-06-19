import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { memo } from "react";

import type { HotspotItem } from "../../../types/lesson";
import {
  CALLOUT_SIDE_OPTIONS,
  CALLOUT_WIDTH_OPTIONS,
  getHotspotFillColor,
  getHotspotFillEnabled,
  getHotspotKind,
  HOTSPOT_FILL_PALETTE,
  hotspotKindLabel,
  isPinHotspot,
  isRectHotspot,
} from "../../../utils/hotspots";
import RichTextEditor from "./RichTextEditor";

type HotspotEditorPropertiesProps = {
  hotspot: HotspotItem | null;
  showNumericFields?: boolean;
  onUpdate: (id: string, patch: Partial<HotspotItem>) => void;
  onRemove: (id: string) => void;
  onCoordChange: (patch: Partial<Pick<HotspotItem, "x_pct" | "y_pct" | "width_pct" | "height_pct">>) => void;
};

const HotspotEditorProperties = memo(function HotspotEditorProperties({
  hotspot,
  showNumericFields = true,
  onUpdate,
  onRemove,
  onCoordChange,
}: HotspotEditorPropertiesProps) {
  if (!hotspot) {
    return (
      <div className="hotspot-editor-properties hotspot-editor-properties--empty">
        <Typography variant="body2" color="text.secondary">
          Выберите метку на скриншоте или в списке
        </Typography>
      </div>
    );
  }

  const kind = getHotspotKind(hotspot);
  const selectedIsPin = isPinHotspot(hotspot);
  const coordFields = ["x_pct", "y_pct", ...(selectedIsPin ? [] : (["width_pct", "height_pct"] as const))] as const;

  return (
    <div className="hotspot-editor-properties">
      <div className="hotspot-editor-properties-header">
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Свойства · {hotspotKindLabel(kind)}
        </Typography>
      </div>

      <div className="hotspot-editor-properties-body">
        <TextField
          size="small"
          value={hotspot.label}
          label="Подпись"
          placeholder="Подпись"
          onChange={(event) => onUpdate(hotspot.id, { label: event.target.value })}
          fullWidth
        />

        <div className="hotspot-editor-properties-description">
          <RichTextEditor
            label="Описание для ученика"
            value={hotspot.description_html ?? ""}
            onChange={(description_html) => onUpdate(hotspot.id, { description_html })}
            rows={3}
            editorMode="lesson"
            toolbarMode="full"
          />
        </div>

        {selectedIsPin ? (
          <>
            <FormControl size="small" fullWidth>
              <InputLabel id="hotspot-callout-width-label">Ширина выноски</InputLabel>
              <Select
                labelId="hotspot-callout-width-label"
                label="Ширина выноски"
                value={hotspot.callout_width ?? "normal"}
                onChange={(event) =>
                  onUpdate(hotspot.id, { callout_width: event.target.value as HotspotItem["callout_width"] })
                }
              >
                {CALLOUT_WIDTH_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="hotspot-callout-side-label">Положение выноски</InputLabel>
              <Select
                labelId="hotspot-callout-side-label"
                label="Положение выноски"
                value={hotspot.callout_side ?? "auto"}
                onChange={(event) =>
                  onUpdate(hotspot.id, { callout_side: event.target.value as HotspotItem["callout_side"] })
                }
              >
                {CALLOUT_SIDE_OPTIONS.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        ) : null}

        {showNumericFields ? (
          <div className="hotspot-editor-coords">
            <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
              Координаты (%)
            </Typography>
            <div className="hotspot-editor-coords-grid">
              {coordFields.map((field) => (
                <TextField
                  key={field}
                  size="small"
                  type="number"
                  label={field.replace("_pct", "")}
                  value={hotspot[field]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isNaN(value)) {
                      return;
                    }
                    onCoordChange({ [field]: value });
                  }}
                  inputProps={{ step: 0.1, min: 0, max: 100 }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="hotspot-editor-properties-actions">
          {isRectHotspot(hotspot) || selectedIsPin ? (
            <div className="hotspot-editor-fill-controls">
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={getHotspotFillEnabled(hotspot)}
                    onChange={(event) => onUpdate(hotspot.id, { fill_enabled: event.target.checked })}
                  />
                }
                label="Заливка"
              />
              {getHotspotFillEnabled(hotspot) ? (
                <Box className="hotspot-fill-palette" role="radiogroup" aria-label="Цвет заливки">
                  {HOTSPOT_FILL_PALETTE.map((entry) => (
                    <Tooltip key={entry.id} title={entry.label}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={getHotspotFillColor(hotspot) === entry.id}
                        aria-label={entry.label}
                        className={`hotspot-fill-swatch${
                          getHotspotFillColor(hotspot) === entry.id ? " hotspot-fill-swatch-active" : ""
                        }`}
                        style={{ backgroundColor: entry.border }}
                        onClick={() => onUpdate(hotspot.id, { fill_color: entry.id })}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ) : null}
            </div>
          ) : null}
          {kind === "region" ? (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={hotspot.pulse !== false}
                  onChange={(event) => onUpdate(hotspot.id, { pulse: event.target.checked })}
                />
              }
              label="Пульс"
            />
          ) : null}
          <Button size="small" variant="outlined" color="error" onClick={() => onRemove(hotspot.id)}>
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
});

export default HotspotEditorProperties;
