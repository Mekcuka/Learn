import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { RefObject } from "react";
import { useNavigate } from "react-router-dom";

import type { AuthorLessonDetail } from "../../../api/authorApi";
import { authorLessonPreviewUrl } from "../../../utils/authorPreview";

export type ToolbarAction = "lesson" | "slide" | "publish" | null;

type AuthorLessonToolbarProps = {
  lesson: AuthorLessonDetail;
  toolbarAction?: ToolbarAction;
  busy?: boolean;
  autosaveDirty: boolean;
  autosaveSaving: boolean;
  validationHint: string | null;
  activeSlide: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  moreMenuAnchor: HTMLElement | null;
  onMoreMenuOpen: (anchor: HTMLElement) => void;
  onMoreMenuClose: () => void;
  onSaveLesson: () => void;
  onSaveSlide: () => void;
  onPublish: () => void;
  onToggleStoryboard: () => void;
  onExport: () => void;
  onDeleteLesson: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  storyboardMode: boolean;
};

function toolbarButtonClass(action: ToolbarAction, current: ToolbarAction): string {
  return current === action ? "author-toolbar-action-busy" : "";
}

export default function AuthorLessonToolbar({
  lesson,
  toolbarAction = null,
  busy = false,
  autosaveDirty,
  autosaveSaving,
  validationHint,
  activeSlide,
  importInputRef,
  moreMenuAnchor,
  onMoreMenuOpen,
  onMoreMenuClose,
  onSaveLesson,
  onSaveSlide,
  onPublish,
  onToggleStoryboard,
  onExport,
  onDeleteLesson,
  onImport,
  storyboardMode,
}: AuthorLessonToolbarProps) {
  const navigate = useNavigate();
  const actionInProgress = toolbarAction !== null || busy;

  return (
    <header className="author-lesson-header author-toolbar--sticky">
      <div className="author-lesson-heading">
        <Button
          size="small"
          variant="text"
          disableRipple
          disableFocusRipple
          className="author-back-link"
          onClick={() => navigate("/author")}
        >
          ← К списку уроков
        </Button>
        <Typography variant="h5" fontWeight="bold" component="h1">
          {lesson.title}
        </Typography>
        <div className="author-lesson-badges">
          {lesson.has_unpublished_changes && (
            <Chip size="small" color="warning" label="Черновик — опубликуйте для учеников" />
          )}
          {!lesson.has_unpublished_changes && lesson.published_at && (
            <Chip size="small" color="success" label="Опубликован" />
          )}
        </div>
      </div>
      <div className="author-toolbar">
        <div className="author-toolbar-primary">
          <Button
            variant="contained"
            disableRipple
            disableFocusRipple
            className={toolbarButtonClass("lesson", toolbarAction)}
            onClick={actionInProgress ? undefined : onSaveLesson}
          >
            {toolbarAction === "lesson" ? "Сохранение…" : "Сохранить урок"}
          </Button>
          {activeSlide && (
            <Button
              variant="outlined"
              disableRipple
              disableFocusRipple
              className={toolbarButtonClass("slide", toolbarAction)}
              onClick={actionInProgress ? undefined : onSaveSlide}
            >
              {toolbarAction === "slide" ? "Сохранение…" : "Сохранить слайд"}
            </Button>
          )}
          {autosaveDirty && (
            <Chip
              size="small"
              color="warning"
              aria-live="polite"
              label={autosaveSaving ? "Сохранение…" : "Несохранённые изменения"}
            />
          )}
          <Button
            variant="contained"
            color="secondary"
            disableRipple
            disableFocusRipple
            className={toolbarButtonClass("publish", toolbarAction)}
            onClick={actionInProgress ? undefined : onPublish}
          >
            {toolbarAction === "publish" ? "Публикация…" : "Опубликовать"}
          </Button>
        </div>
        <div className="author-toolbar-secondary">
          <Button variant="outlined" disableRipple disableFocusRipple onClick={onToggleStoryboard}>
            {storyboardMode ? "Редактор" : "Раскадровка"}
          </Button>
          <Tooltip title="Дополнительные действия">
            <IconButton
              aria-label="Дополнительные действия"
              disableRipple
              disableFocusRipple
              onClick={(event) => onMoreMenuOpen(event.currentTarget)}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={moreMenuAnchor} open={Boolean(moreMenuAnchor)} onClose={onMoreMenuClose}>
            <MenuItem
              onClick={() => {
                onMoreMenuClose();
                onExport();
              }}
            >
              Экспорт JSON
            </MenuItem>
            <MenuItem
              onClick={() => {
                onMoreMenuClose();
                importInputRef.current?.click();
              }}
            >
              Импорт JSON
            </MenuItem>
            <MenuItem
              component="a"
              href={authorLessonPreviewUrl(lesson.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMoreMenuClose}
            >
              Превью для ученика (опубликовано)
            </MenuItem>
            <MenuItem
              onClick={() => {
                onMoreMenuClose();
                onDeleteLesson();
              }}
              sx={{ color: "error.main" }}
            >
              Удалить урок
            </MenuItem>
          </Menu>
        </div>
        <input ref={importInputRef} type="file" accept="application/json" onChange={onImport} hidden />
      </div>
      {validationHint && (
        <Typography variant="caption" color="warning.main" className="author-validation-hint">
          {validationHint}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" className="author-shortcuts-hint">
        Ctrl+S — слайд · Ctrl+Shift+S — урок · ←/→ — слайды · Пробел+drag — панорама в редакторе
      </Typography>
    </header>
  );
}
