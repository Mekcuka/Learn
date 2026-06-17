import { Text } from "@consta/uikit/Text";
import { Link } from "react-router-dom";

import { useAuth, useIsAuthor } from "../auth/AuthContext";

type PortalTopbarProps = {
  active?: "home" | "lessons" | "wiki" | "author";
};

const MAIN_NAV = [
  { key: "lessons" as const, label: "Уроки", path: "/dashboard" },
  { key: "wiki" as const, label: "Wiki", path: "/wiki" },
];

export default function PortalTopbar({ active }: PortalTopbarProps) {
  const { user } = useAuth();
  const isAuthor = useIsAuthor();

  return (
    <header className="catalog-topbar">
      <div className="catalog-brand portal-brand">
        <Link to="/" className="catalog-logo" style={{ textDecoration: "none", color: "inherit" }}>
          Learn
        </Link>
        <nav className="portal-nav" aria-label="Разделы портала">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`portal-nav-link ${active === item.key ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="portal-topbar-end">
          <Text size="s" view="secondary" className="portal-user-name">
            {user.display_name}
          </Text>
          {isAuthor && (
            <Link
              to="/author"
              className={`portal-nav-link ${active === "author" ? "active" : ""}`}
            >
              Редактор
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
