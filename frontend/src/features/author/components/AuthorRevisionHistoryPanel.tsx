import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import {
  getAuthorLessonRevisions,
  rollbackAuthorLessonRevision,
  type AuthorLessonDetail,
  type LessonRevisionItem,
} from "../../../api/authorApi";
import { LearnApiError } from "../../../api/learnApi";
import { ConfirmModal } from "../../../components/mui/ConfirmModal";

type AuthorRevisionHistoryPanelProps = {
  lesson: AuthorLessonDetail;
  onLessonUpdated: (lesson: AuthorLessonDetail) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
};

function formatRevisionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU");
}

export default function AuthorRevisionHistoryPanel({
  lesson,
  onLessonUpdated,
  onError,
  onMessage,
}: AuthorRevisionHistoryPanelProps) {
  const [items, setItems] = useState<LessonRevisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAuthorLessonRevisions(lesson.id);
      setItems(response.items);
    } catch (err) {
      onError(err instanceof LearnApiError ? err.message : "Не удалось загрузить версии");
    } finally {
      setLoading(false);
    }
  }, [lesson.id, onError]);

  useEffect(() => {
    void loadRevisions();
  }, [loadRevisions]);

  async function confirmRollback() {
    if (!rollbackId) {
      return;
    }
    setBusy(true);
    try {
      const updated = await rollbackAuthorLessonRevision(lesson.id, rollbackId);
      onLessonUpdated(updated);
      onMessage("Урок откатан к выбранной версии");
      setRollbackId(null);
      await loadRevisions();
    } catch (err) {
      onError(err instanceof LearnApiError ? err.message : "Не удалось выполнить откат");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="author-revision-panel" aria-label="История версий">
      <Typography variant="subtitle2" fontWeight={700} component="h2">
        История версий
      </Typography>
      {loading && (
        <Typography variant="body2" color="text.secondary">
          Загрузка…
        </Typography>
      )}
      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Снимков пока нет. Они создаются при сохранении урока и публикации.
        </Typography>
      )}
      {!loading && items.length > 0 && (
        <ul className="author-revision-list">
          {items.map((item) => (
            <li key={item.id} className="author-revision-item">
              <div>
                <Typography variant="body2" fontWeight={600}>
                  {item.summary || "Снимок"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatRevisionDate(item.created_at)}
                </Typography>
              </div>
              <Button size="small" variant="outlined" onClick={() => setRollbackId(item.id)}>
                Откатить
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={rollbackId !== null}
        title="Откатить урок к этой версии?"
        message="Текущий опубликованный контент будет заменён. Черновик будет сброшен."
        confirmLabel="Откатить"
        danger
        loading={busy}
        onConfirm={() => void confirmRollback()}
        onCancel={() => setRollbackId(null)}
      />
    </section>
  );
}
