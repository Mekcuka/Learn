import type { ReactNode } from "react";

import PortalTopbar from "../../../components/PortalTopbar";

type LessonShellProps = {
  children: ReactNode;
};

export default function LessonShell({ children }: LessonShellProps) {
  return (
    <div className="catalog-layout catalog-layout--lesson">
      <PortalTopbar active="lessons" />
      <div className="lesson-shell">{children}</div>
    </div>
  );
}
