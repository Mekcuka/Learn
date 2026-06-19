import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  defaultVerifyConfig,
  parseAdvancedVerifyJson,
  type VerifyConfig,
} from "../../../utils/verifyConfigSchema";
import type { VerifyType } from "../../../utils/verifyTypes";

export type VerifyConfigFormProps = {
  verifyType: VerifyType;
  value: VerifyConfig;
  onChange: (config: VerifyConfig) => void;
  disabled?: boolean;
};

export default function VerifyConfigForm({
  verifyType,
  value,
  onChange,
  disabled = false,
}: VerifyConfigFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [advancedError, setAdvancedError] = useState<string | null>(null);

  function patch(patchValue: VerifyConfig) {
    onChange({ ...value, ...patchValue });
  }

  function handleAdvancedJsonChange(json: string) {
    setAdvancedJson(json);
    const { config, error } = parseAdvancedVerifyJson(json);
    setAdvancedError(error);
    if (!error) {
      onChange(config);
    }
  }

  function handleAdvancedToggle(expanded: boolean) {
    setAdvancedOpen(expanded);
    if (expanded) {
      setAdvancedJson(JSON.stringify(value ?? {}, null, 2));
      setAdvancedError(null);
    }
  }

  function renderTypedFields() {
    switch (verifyType) {
      case "manual":
        return (
          <Typography variant="body2" color="text.secondary">
            Дополнительные параметры не требуются — ученик подтверждает шаг кнопкой «Я выполнил».
          </Typography>
        );

      case "quiz_passed":
        return (
          <TextField
            label="Порог прохождения, %"
            type="number"
            value={value.pass_threshold_percent ?? defaultVerifyConfig("quiz_passed").pass_threshold_percent}
            onChange={(event) =>
              patch({ pass_threshold_percent: Number(event.target.value) })
            }
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            margin="normal"
            disabled={disabled}
          />
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Неподдерживаемый тип проверки — используйте «Вручную» или «Мини-квиз».
          </Typography>
        );
    }
  }

  return (
    <div className="author-verify-config-form">
      {renderTypedFields()}

      <Accordion
        expanded={advancedOpen}
        onChange={(_, expanded) => handleAdvancedToggle(expanded)}
        disableGutters
        elevation={0}
        className="author-verify-advanced"
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
          <Typography variant="body2">Расширенный режим (JSON)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="verify_config (JSON)"
            multiline
            minRows={4}
            value={advancedJson}
            onChange={(event) => handleAdvancedJsonChange(event.target.value)}
            fullWidth
            disabled={disabled}
            error={Boolean(advancedError)}
            helperText={advancedError ?? "Прямое редактирование всех полей конфигурации"}
          />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
