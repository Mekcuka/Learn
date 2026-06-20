import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import RichTextEditor from "./RichTextEditor";

export type SlideEditorDraft = {
  instruction_html: string;
  caption_html: string;
  expected_result_html: string;
};

export type AuthorSlideEditorsHandle = {
  flush: () => SlideEditorDraft;
};

type AuthorSlideRichFieldProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
};

const AuthorSlideRichField = memo(function AuthorSlideRichField({
  label,
  value,
  onChange,
}: AuthorSlideRichFieldProps) {
  return (
    <RichTextEditor
      label={label}
      value={value}
      onChange={onChange}
      rows={2}
      editorMode="lesson"
      compact
    />
  );
});

type AuthorSlideEditorsProps = {
  slideId: string;
  instructionHtml: string;
  captionHtml: string;
  expectedResultHtml: string;
  busy: boolean;
  onInstructionChange: (html: string) => void;
  onSlidePatch: (slideId: string, patch: { caption_html: string; expected_result_html: string }) => void;
  onUploadClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const AuthorSlideEditors = forwardRef<AuthorSlideEditorsHandle, AuthorSlideEditorsProps>(
  function AuthorSlideEditors(
    {
      slideId,
      instructionHtml,
      captionHtml,
      expectedResultHtml,
      busy,
      onInstructionChange,
      onSlidePatch,
      onUploadClick,
      onDuplicate,
      onDelete,
    },
    ref,
  ) {
    const slideIdRef = useRef(slideId);
    const onInstructionChangeRef = useRef(onInstructionChange);
    const onSlidePatchRef = useRef(onSlidePatch);
    const draftsRef = useRef<SlideEditorDraft>({
      instruction_html: instructionHtml,
      caption_html: captionHtml,
      expected_result_html: expectedResultHtml,
    });

    onInstructionChangeRef.current = onInstructionChange;
    onSlidePatchRef.current = onSlidePatch;

    const syncDraftsToParent = useCallback((next: SlideEditorDraft, targetSlideId: string) => {
      onInstructionChangeRef.current(next.instruction_html);
      onSlidePatchRef.current(targetSlideId, {
        caption_html: next.caption_html,
        expected_result_html: next.expected_result_html,
      });
    }, []);

    const flushDrafts = useCallback((): SlideEditorDraft => {
      const pending = draftsRef.current;
      syncDraftsToParent(pending, slideIdRef.current);
      return pending;
    }, [syncDraftsToParent]);

    useEffect(() => {
      if (slideIdRef.current === slideId) {
        return;
      }

      flushDrafts();
      slideIdRef.current = slideId;
      draftsRef.current = {
        instruction_html: instructionHtml,
        caption_html: captionHtml,
        expected_result_html: expectedResultHtml,
      };
    }, [slideId, instructionHtml, captionHtml, expectedResultHtml, flushDrafts]);

    useImperativeHandle(ref, () => ({ flush: flushDrafts }), [flushDrafts]);

    const updateDraft = useCallback((patch: Partial<SlideEditorDraft>) => {
      draftsRef.current = { ...draftsRef.current, ...patch };
    }, []);

    const handleInstructionChange = useCallback(
      (instruction_html: string) => updateDraft({ instruction_html }),
      [updateDraft],
    );
    const handleCaptionChange = useCallback(
      (caption_html: string) => updateDraft({ caption_html }),
      [updateDraft],
    );
    const handleExpectedChange = useCallback(
      (expected_result_html: string) => updateDraft({ expected_result_html }),
      [updateDraft],
    );

    return (
      <div className="author-slide-editors">
        <div className="step-actions author-slide-toolbar">
          <Tooltip title="Загрузить PNG, WebP или SVG">
            <span>
              <Button variant="outlined" size="small" disabled={busy} onClick={onUploadClick}>
                Загрузить изображение
              </Button>
            </span>
          </Tooltip>
          <Button variant="outlined" size="small" disabled={busy} onClick={onDuplicate}>
            Дублировать
          </Button>
          <Button variant="outlined" size="small" color="error" disabled={busy} onClick={onDelete}>
            Удалить слайд
          </Button>
        </div>
        <AuthorSlideRichField
          key={`${slideId}-instruction`}
          label="Инструкция"
          value={instructionHtml}
          onChange={handleInstructionChange}
        />
        <AuthorSlideRichField
          key={`${slideId}-caption`}
          label="Подсказка"
          value={captionHtml}
          onChange={handleCaptionChange}
        />
        <AuthorSlideRichField
          key={`${slideId}-expected`}
          label="Ожидаемый результат"
          value={expectedResultHtml}
          onChange={handleExpectedChange}
        />
      </div>
    );
  },
);

export default AuthorSlideEditors;
