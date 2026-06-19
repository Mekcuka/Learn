import type { SelfStudyAssignmentListItem, SelfStudyStepState } from "../api/selfStudyApi";

export function selfStudyProgressLabel(completed: number, total: number): string {
  if (total <= 0) {
    return "Нет шагов";
  }
  return `${completed} из ${total} шагов`;
}

export function selfStudyStatusLabel(status: SelfStudyAssignmentListItem["status"]): string {
  switch (status) {
    case "in_progress":
      return "В процессе";
    case "completed":
      return "Выполнено";
    case "not_started":
      return "Не начато";
    default:
      return status;
  }
}

export function selfStudyStepStatusLabel(status: SelfStudyStepState["status"]): string {
  switch (status) {
    case "active":
      return "В процессе";
    case "completed":
      return "Выполнен";
    case "locked":
      return "Не начат";
    default:
      return status;
  }
}

export function selfStudyStepChipColor(
  status: SelfStudyStepState["status"],
): "default" | "primary" | "success" {
  switch (status) {
    case "completed":
      return "success";
    case "active":
      return "primary";
    default:
      return "default";
  }
}
