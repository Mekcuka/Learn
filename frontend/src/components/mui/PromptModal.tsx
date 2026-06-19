import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";

import { BaseModal } from "./BaseModal";

type PromptModalProps = {
  isOpen: boolean;
  title: string;
  message?: string;
  fieldLabel?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function PromptModal({
  isOpen,
  title,
  message,
  fieldLabel,
  defaultValue = "",
  placeholder,
  submitLabel = "Добавить",
  cancelLabel = "Отмена",
  onSubmit,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [defaultValue, isOpen]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      message={message}
      footer={
        <>
          <Button variant="outlined" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="contained" disabled={!value.trim()} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <TextField
        label={fieldLabel}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
        }}
        autoFocus
        fullWidth
        margin="dense"
      />
    </BaseModal>
  );
}

type CalloutTypeItem = {
  label: string;
  value: "info" | "warning" | "tip";
};

const CALLOUT_TYPE_ITEMS: CalloutTypeItem[] = [
  { label: "Информация", value: "info" },
  { label: "Предупреждение", value: "warning" },
  { label: "Совет", value: "tip" },
];

type CalloutTypeModalProps = {
  isOpen: boolean;
  onSubmit: (type: CalloutTypeItem["value"]) => void;
  onCancel: () => void;
};

export function CalloutTypeModal({ isOpen, onSubmit, onCancel }: CalloutTypeModalProps) {
  const [selected, setSelected] = useState<CalloutTypeItem["value"]>(CALLOUT_TYPE_ITEMS[0].value);

  useEffect(() => {
    if (isOpen) {
      setSelected(CALLOUT_TYPE_ITEMS[0].value);
    }
  }, [isOpen]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Тип выноски"
      footer={
        <>
          <Button variant="outlined" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="contained" onClick={() => onSubmit(selected)}>
            Добавить
          </Button>
        </>
      }
    >
      <FormControl>
        <RadioGroup value={selected} onChange={(event) => setSelected(event.target.value as CalloutTypeItem["value"])}>
          {CALLOUT_TYPE_ITEMS.map((item) => (
            <FormControlLabel key={item.value} value={item.value} control={<Radio />} label={item.label} />
          ))}
        </RadioGroup>
      </FormControl>
    </BaseModal>
  );
}

type AlertModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function AlertModal({ isOpen, title, message, onClose }: AlertModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      footer={
        <Button variant="contained" onClick={onClose}>
          Понятно
        </Button>
      }
    />
  );
}
