import type { ReactNode } from "react";

import PortalTopbar from "../../../components/PortalTopbar";

type AuthorConstructorLayoutProps = {
  children: ReactNode;
};

export default function AuthorConstructorLayout({ children }: AuthorConstructorLayoutProps) {
  return (
    <div className="catalog-layout catalog-layout--author-constructor">
      <PortalTopbar active="author" />
      <main className="lesson-shell author-layout author-constructor-shell">{children}</main>
    </div>
  );
}
