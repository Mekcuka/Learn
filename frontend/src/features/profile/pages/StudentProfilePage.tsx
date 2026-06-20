import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getDashboard,
  LearnApiError,
  resetProgress,
  type ModuleDashboardItem,
} from "../../../api/learnApi";
import { useAuth } from "../../../auth/AuthContext";
import { ConfirmModal } from "../../../components/mui/ConfirmModal";
import { PageError, PageLoading } from "../../../components/mui/PageStatus";
import PortalTopbar from "../../../components/PortalTopbar";
import { moduleProgressLabel } from "../../../utils/lessonUi";

function roleLabel(role?: string): string {
  if (role === "author") return "Методист";
  return "Ученик";
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const [first, second] = parts;
    if (/^\d+$/.test(second!)) {
      return first!.slice(0, 2).toUpperCase();
    }
    return `${first![0] ?? ""}${second![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const loadStats = useCallback(() => {
    setLoading(true);
    setError(null);
    return getDashboard()
      .then((data) => setModules(data.modules))
      .catch((err: unknown) => {
        if (err instanceof LearnApiError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить статистику");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totalCompleted = useMemo(
    () => modules.reduce((sum, module) => sum + module.completed_lessons, 0),
    [modules],
  );
  const totalLessons = useMemo(
    () => modules.reduce((sum, module) => sum + module.total_lessons, 0),
    [modules],
  );
  const completedLessons = useMemo(
    () =>
      modules.flatMap((module) =>
        module.lessons
          .filter((lesson) => lesson.status === "completed")
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            moduleTitle: module.title,
          })),
      ),
    [modules],
  );

  async function handleResetConfirm() {
    setResetLoading(true);
    setResetError(null);
    try {
      const result = await resetProgress();
      setConfirmOpen(false);
      setToast({ kind: "success", text: result.message });
      await loadStats();
    } catch (err: unknown) {
      if (err instanceof LearnApiError) {
        setResetError(err.message);
      } else {
        setResetError("Не удалось сбросить статистику");
      }
    } finally {
      setResetLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="catalog-layout">
        <PortalTopbar />
        <PageLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-layout">
        <PortalTopbar />
        <PageError message={error} />
      </div>
    );
  }

  return (
    <div className="catalog-layout">
      <PortalTopbar />

      <main className="home-shell profile-shell">
        <Stack spacing={3}>
          {toast ? (
            <Alert
              severity={toast.kind}
              onClose={() => setToast(null)}
              role="status"
            >
              {toast.text}
            </Alert>
          ) : null}

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.light",
                  color: "primary.main",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                {userInitials(user.display_name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h4" fontWeight={800} component="h1" gutterBottom>
                  {user.display_name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Chip size="small" label={roleLabel(user.role)} color="primary" variant="outlined" />
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} component="h2" gutterBottom>
              Прогресс по урокам
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {moduleProgressLabel(totalCompleted, totalLessons)}
              {totalLessons > 0 ? ` · ${Math.round((totalCompleted / totalLessons) * 100)}%` : ""}
            </Typography>

            <Stack spacing={2.5}>
              {modules.map((module) => (
                <Box key={module.id}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                    <Typography fontWeight={600}>{module.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {moduleProgressLabel(module.completed_lessons, module.total_lessons)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={module.progress_percent}
                    sx={{ mt: 1, height: 8, borderRadius: 1 }}
                    aria-label={`Прогресс модуля ${module.title}`}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>

          {completedLessons.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} component="h2" gutterBottom>
                Пройденные уроки
              </Typography>
              <Stack spacing={1.5} component="ul" sx={{ m: 0, pl: 2.5 }}>
                {completedLessons.map((lesson) => (
                  <Box component="li" key={lesson.id}>
                    <Typography fontWeight={600}>{lesson.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lesson.moduleTitle}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ) : null}

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={700} component="h2" gutterBottom>
              Сброс статистики
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Весь прогресс по урокам будет удалён. После сброса можно начать обучение заново.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestartAltOutlinedIcon />}
              onClick={() => {
                setResetError(null);
                setConfirmOpen(true);
              }}
            >
              Сбросить статистику
            </Button>
          </Paper>
        </Stack>
      </main>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Сбросить статистику?"
        message="Прогресс по всем модулям и урокам будет удалён. Это действие нельзя отменить."
        confirmLabel="Сбросить"
        cancelLabel="Отмена"
        danger
        loading={resetLoading}
        error={resetError}
        onConfirm={() => void handleResetConfirm()}
        onCancel={() => {
          if (!resetLoading) {
            setConfirmOpen(false);
            setResetError(null);
          }
        }}
      />
    </div>
  );
}
