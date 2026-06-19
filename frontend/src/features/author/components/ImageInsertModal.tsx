import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { uploadWikiImage } from "../../wiki/api/wikiApi";
import { CONTENT_ASSET_PATHS, contentAssetLabel } from "../../wiki/utils/contentAssets";
import { isAllowedWikiImageSrc } from "../../wiki/utils/wikiHtml";
import { BaseModal } from "../../../components/mui/BaseModal";

export type ImageInsertResult = {
  src: string;
  alt: string;
  caption?: string;
  width?: string;
};

type ImageInsertModalProps = {
  isOpen: boolean;
  onSubmit: (result: ImageInsertResult) => void;
  onCancel: () => void;
};

const WIDTH_OPTIONS = ["25", "50", "75", "100"];

export default function ImageInsertModal({ isOpen, onSubmit, onCancel }: ImageInsertModalProps) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [width, setWidth] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSrc("");
      setAlt("");
      setCaption("");
      setWidth("100");
      setError(null);
      setUploading(false);
    }
  }, [isOpen]);

  function handleSubmit() {
    const trimmedSrc = src.trim();
    const trimmedAlt = alt.trim();
    if (!trimmedSrc) {
      setError("Укажите адрес изображения или загрузите файл");
      return;
    }
    if (!isAllowedWikiImageSrc(trimmedSrc)) {
      setError("Допустимы пути /content/… или https://");
      return;
    }
    if (!trimmedAlt) {
      setError("Укажите описание изображения (alt)");
      return;
    }
    onSubmit({ src: trimmedSrc, alt: trimmedAlt, caption: caption.trim(), width });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const result = await uploadWikiImage(file);
      setSrc(result.image_path);
      if (!alt.trim()) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        setAlt(name || "Изображение");
      }
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Вставить изображение"
      footer={
        <>
          <Button variant="outlined" onClick={onCancel} disabled={uploading}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={uploading || !src.trim() || !alt.trim()}>
            Вставить
          </Button>
        </>
      }
    >
      <FormControl fullWidth margin="dense">
        <InputLabel id="asset-picker-label">Из каталога /content/</InputLabel>
        <Select
          labelId="asset-picker-label"
          label="Из каталога /content/"
          value=""
          displayEmpty
          onChange={(event) => {
            const path = event.target.value;
            if (path) {
              setSrc(path);
              if (!alt.trim()) {
                setAlt(contentAssetLabel(path));
              }
            }
          }}
        >
          <MenuItem value="">Выберите файл…</MenuItem>
          {CONTENT_ASSET_PATHS.map((path) => (
            <MenuItem key={path} value={path}>
              {contentAssetLabel(path)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Адрес (URL)"
        value={src}
        placeholder="/content/wiki/… или https://…"
        onChange={(event) => {
          setSrc(event.target.value);
          setError(null);
        }}
        fullWidth
        margin="dense"
        helperText="Путь к файлу в /content/ или внешняя ссылка https://"
      />
      <TextField
        label="Описание (alt)"
        value={alt}
        placeholder="Кратко опишите изображение"
        onChange={(event) => {
          setAlt(event.target.value);
          setError(null);
        }}
        fullWidth
        margin="dense"
        required
      />
      <TextField
        label="Подпись (необязательно)"
        value={caption}
        placeholder="Текст под изображением"
        onChange={(event) => setCaption(event.target.value)}
        fullWidth
        margin="dense"
      />
      <FormControl fullWidth margin="dense">
        <InputLabel id="image-width-label">Ширина</InputLabel>
        <Select
          labelId="image-width-label"
          label="Ширина"
          value={width}
          onChange={(event) => setWidth(event.target.value)}
        >
          {WIDTH_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}%
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div style={{ marginTop: "0.75rem" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/svg+xml"
          hidden
          onChange={handleFileChange}
        />
        <Button variant="outlined" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? "Загрузка…" : "Загрузить файл"}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          PNG, WebP или SVG, до 2 МБ
        </Typography>
      </div>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </BaseModal>
  );
}
