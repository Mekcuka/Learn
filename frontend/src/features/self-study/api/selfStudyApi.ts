import { httpRequest, LearnApiError } from "../../../api/httpClient";
import type { VerifyResult } from "../../../types/api";

export type { VerifyResult };
export { LearnApiError };

export type SelfStudyAssignmentListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  total_steps: number;
  completed_steps: number;
};

export type SelfStudyStep = {
  id: string;
  order: number;
  title: string;
  instruction_html: string;
  deep_link: string | null;
  verify: { type: string; config: Record<string, unknown> };
};

export type SelfStudyStepState = {
  step_id: string;
  status: "locked" | "active" | "completed";
  completed_at: string | null;
  verify_result: Record<string, unknown> | null;
};

export type SelfStudyAssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress_percent: number;
  current_step_id: string | null;
  project_id: string | null;
  steps: SelfStudyStep[];
  step_states: SelfStudyStepState[];
};

export async function getSelfStudyAssignments() {
  const data = await httpRequest<{ items: SelfStudyAssignmentListItem[] }>(
    "/api/v1/learn/self-study/assignments",
  );
  return data.items;
}

export async function getSelfStudyAssignment(assignmentId: string) {
  return httpRequest<SelfStudyAssignmentDetail>(
    `/api/v1/learn/self-study/assignments/${assignmentId}`,
  );
}

export async function startSelfStudyStep(assignmentId: string, stepId: string) {
  return httpRequest<{ step_id: string; started_at: string }>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/start`,
    { method: "POST", body: "{}" },
  );
}

export async function verifySelfStudyStep(assignmentId: string, stepId: string) {
  return httpRequest<VerifyResult>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/verify`,
    { method: "POST", body: "{}" },
  );
}

export async function completeSelfStudyStepManual(assignmentId: string, stepId: string) {
  return httpRequest<{ step_id: string; status: string }>(
    `/api/v1/learn/self-study/assignments/${assignmentId}/steps/${stepId}/complete-manual`,
    { method: "POST", body: "{}" },
  );
}
