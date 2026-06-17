import { Outlet } from "react-router-dom";

import { PageLoading } from "../components/consta/PageStatus";

import { useAuth, useIsAuthor } from "../auth/AuthContext";

export default function AuthorRoute() {
  const { loading } = useAuth();
  const isAuthor = useIsAuthor();

  if (loading) {
    return (
      <main className="lesson-shell">
        <PageLoading />
      </main>
    );
  }

  if (!isAuthor) {    return (
      <main className="lesson-shell">
        <p className="catalog-message catalog-error">Нужна роль методиста. Войдите как author@training.local</p>
        <a href="/login?next=/author" className="back-link">
          Войти
        </a>
      </main>
    );
  }

  return <Outlet />;
}
