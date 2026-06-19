import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { listWikiArticles, type WikiArticleListItem } from "../../wiki/api/wikiApi";
import { isAllowedWikiLinkHref } from "../../wiki/utils/wikiHtml";
import { BaseModal } from "../../../components/mui/BaseModal";

export type LinkInsertResult = {
  href: string;
  text?: string;
};

type LinkInsertModalProps = {
  isOpen: boolean;
  defaultText?: string;
  defaultHref?: string;
  onSubmit: (result: LinkInsertResult) => void;
  onCancel: () => void;
};

export default function LinkInsertModal({
  isOpen,
  defaultText = "",
  defaultHref = "",
  onSubmit,
  onCancel,
}: LinkInsertModalProps) {
  const [tab, setTab] = useState(0);
  const [href, setHref] = useState("");
  const [text, setText] = useState("");
  const [wikiArticles, setWikiArticles] = useState<WikiArticleListItem[]>([]);
  const [selectedWikiId, setSelectedWikiId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setHref(defaultHref);
    setText(defaultText);
    setTab(0);
    setError(null);
    setSelectedWikiId("");
    listWikiArticles()
      .then(setWikiArticles)
      .catch(() => setWikiArticles([]));
  }, [defaultHref, defaultText, isOpen]);

  function handleSubmit() {
    const trimmedHref = tab === 1 && selectedWikiId ? `/wiki/${selectedWikiId}` : href.trim();
    if (!trimmedHref) {
      setError("Укажите адрес ссылки");
      return;
    }
    if (!isAllowedWikiLinkHref(trimmedHref)) {
      setError("Допустимы https://, /wiki/…, /content/… или якорь #…");
      return;
    }
    onSubmit({ href: trimmedHref, text: text.trim() || undefined });
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Вставить ссылку"
      footer={
        <>
          <Button variant="outlined" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {defaultHref ? "Сохранить" : "Вставить"}
          </Button>
        </>
      }
    >
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 1 }}>
        <Tab label="URL" />
        <Tab label="Статья Wiki" />
      </Tabs>

      {tab === 0 && (
        <TextField
          label="Адрес (URL)"
          value={href}
          placeholder="https://… или /content/…"
          onChange={(event) => {
            setHref(event.target.value);
            setError(null);
          }}
          fullWidth
          margin="dense"
          helperText="Внешняя ссылка https:// или путь /content/…"
        />
      )}

      {tab === 1 && (
        <FormControl fullWidth margin="dense">
          <InputLabel id="wiki-link-label">Статья</InputLabel>
          <Select
            labelId="wiki-link-label"
            label="Статья"
            value={selectedWikiId}
            onChange={(event) => {
              setSelectedWikiId(event.target.value);
              setError(null);
            }}
          >
            {wikiArticles.map((article) => (
              <MenuItem key={article.id} value={article.id}>
                {article.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TextField
        label="Текст ссылки (необязательно)"
        value={text}
        placeholder="Если пусто — используется выделение"
        onChange={(event) => setText(event.target.value)}
        fullWidth
        margin="dense"
      />

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </BaseModal>
  );
}
