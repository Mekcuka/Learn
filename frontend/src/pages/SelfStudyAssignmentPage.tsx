import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import "../styles/portal-wiki.css";

import {
  completeSelfStudyStepManual,
  getSelfStudyAssignment,
  LearnApiError,
  verifySelfStudyStep,
  type SelfStudyAssignmentDetail,
  type SelfStudyStepState,
  type VerifyResult,
} from "../api/selfStudyApi";
import LessonHtml from "../features/lesson/components/LessonHtml";
import { PageError, PageLoading } from "../components/mui/PageStatus";
import PortalTopbar from "../components/PortalTopbar";
import { useVerifyPolling } from "../hooks/useVerifyPolling";
import {
  selfStudyProgressLabel,
  selfStudyStepChipColor,
  selfStudyStepStatusLabel,
} from "../utils/selfStudyUi";

export default function SelfStudyAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<SelfStudyAssignmentDetail | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<VerifyResult | null>(null);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) {
      return;
    }
    const data = await getSelfStudyAssignment(assignmentId);
    setAssignment(data);
    const current =
      new URLSearchParams(window.location.search).get("step") ??
      data.current_step_id ??
      data.steps[0]?.id ??
      null;
    setActiveStepId(current);
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) {
      navigate("/self-study", { replace: true });
      return;
    }
    setLoading(true);
    loadAssignment()
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить задание");
      })
      .finally(() => setLoading(false));
  }, [assignmentId, loadAssignment, navigate]);

  const activeStep = useMemo(
    () => assignment?.steps.find((step) => step.id === activeStepId) ?? null,
    [assignment, activeStepId],
  );

  const stepStateMap = useMemo(() => {
    const map = new Map<string, SelfStudyStepState>();
    assignment?.step_states.forEach((state) => map.set(state.step_id, state));
    return map;
  }, [assignment]);

  const activeStepState = activeStep ? stepStateMap.get(activeStep.id) : undefined;

  const verifyFn = useCallback(async () => {
    if (!assignmentId || !activeStepId) {
      throw new Error("Шаг не найден");
    }
    return verifySelfStudyStep(assignmentId, activeStepId);
  }, [assignmentId, activeStepId]);

  const handleVerifyPassed = useCallback(async () => {
    await loadAssignment();
    setFeedback(null);
    setBusy(false);
  }, [loadAssignment]);

  const handleVerifyFailed = useCallback((result: VerifyResult) => {
    setFeedback(result);
    setBusy(false);
  }, []);

  const { polling, startPolling, stopPolling } = useVerifyPolling(verifyFn, {
    onPassed: handleVerifyPassed,
    onFailed: handleVerifyFailed,
  });

  const handleVerify = useCallback(async () => {
    if (!assignmentId || !activeStepId) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    stopPolling();
    try {
      const result = await verifySelfStudyStep(assignmentId, activeStepId);
      setFeedback(result);
      if (result.status === "passed") {
        await loadAssignment();
        setFeedback(null);
        setBusy(false);
        return;
      }
      if (result.status === "pending" && result.retry_after_seconds != null) {
        startPolling();
        return;
      }
      setBusy(false);
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось проверить шаг",
      });
      setBusy(false);
    }
  }, [activeStepId, assignmentId, loadAssignment, startPolling, stopPolling]);

  const handleCompleteManual = useCallback(async () => {
    if (!assignmentId || !activeStepId) {
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await completeSelfStudyStepManual(assignmentId, activeStepId);
      await loadAssignment();
    } catch (err) {
      setFeedback({
        status: "failed",
        message: err instanceof Error ? err.message : "Не удалось завершить шаг",
      });
    } finally {
      setBusy(false);
    }
  }, [activeStepId, assignmentId, loadAssignment]);

  if (loading) {
    return (
      <div className="catalog-layout">
        <PortalTopbar active="home" />
        <PageLoading label="Загрузка задания…" />
      </div>
    );
  }

  if (error || !assignment || !activeStep) {
    return (
      <div className="catalog-layout">
        <PortalTopbar active="home" />
        <PageError message={error ?? "Задание не найдено"} />
      </div>
    );
  }

  const isManual = activeStep.verify.type === "manual";
  const isCompleted = activeStepState?.status === "completed";
  const canInteract = activeStepState?.status === "active";

  return (
    <div className="catalog-layout">
      <PortalTopbar active="home" />
      <main className="self-study-assignment-shell">
        <div className="self-study-assignment-header">
          <Typography component={Link} to="/self-study" color="primary" className="self-study-back">
            ← К списку заданий
          </Typography>
          <Typography variant="h4" fontWeight="bold" component="h1">
            {assignment.title}
          </Typography>
          {assignment.description ? (
            <Typography color="text.secondary">{assignment.description}</Typography>
          ) : null}
          <LinearProgress variant="determinate" value={assignment.progress_percent} />
          <Typography variant="body2" color="text.secondary">
            {selfStudyProgressLabel(
              assignment.step_states.filter((s) => s.status === "completed").length,
              assignment.steps.length,
            )}{" "}
            · {assignment.progress_percent}%
          </Typography>
        </div>

        <div className="self-study-assignment-layout">
          <nav className="self-study-step-nav" aria-label="Шаги задания">
            <List disablePadding>
              {assignment.steps.map((step) => {
                const state = stepStateMap.get(step.id);
                return (
                  <ListItemButton
                    key={step.id}
                    selected={step.id === activeStepId}
                    disabled={state?.status === "locked"}
                    onClick={() => setActiveStepId(step.id)}
                  >
                    <ListItemText
                      primary={`${step.order}. ${step.title}`}
                      secondary={state ? selfStudyStepStatusLabel(state.status) : undefined}
                    />
                    {state ? (
                      <Chip
                        label={selfStudyStepStatusLabel(state.status)}
                        size="small"
                        color={selfStudyStepChipColor(state.status)}
                      />
                    ) : null}
                  </ListItemButton>
                );
              })}
            </List>
          </nav>

          <section className="self-study-step-panel">
            <div className="self-study-step-panel-header">
              <Typography variant="h5" fontWeight="bold" component="h2">
                Шаг {activeStep.order}: {activeStep.title}
              </Typography>
              {activeStepState ? (
                <Chip
                  label={selfStudyStepStatusLabel(activeStepState.status)}
                  color={selfStudyStepChipColor(activeStepState.status)}
                />
              ) : null}
            </div>

            <LessonHtml html={activeStep.instruction_html} className="self-study-instruction" />

            {feedback ? (
              <Typography
                role="status"
                color={feedback.status === "passed" ? "success.main" : "error"}
                className="self-study-feedback"
              >
                {feedback.message}
              </Typography>
            ) : null}

            <div className="self-study-step-actions">
              {!isCompleted && canInteract ? (
                isManual ? (
                  <Button
                    variant="contained"
                    onClick={() => void handleCompleteManual()}
                    disabled={busy}
                  >
                    Я выполнил
                  </Button>
                ) : (
                  <Button variant="contained" onClick={() => void handleVerify()} disabled={busy || polling}>
                    {polling ? "Проверка…" : "Проверить выполнение"}
                  </Button>
                )
              ) : null}

              {isCompleted ? (
                <Chip label="Шаг выполнен" color="success" />
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
