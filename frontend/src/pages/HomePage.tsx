import { Link } from "react-router-dom";

import PortalTopbar from "../components/PortalTopbar";
import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const name = user.display_name;

  return (
    <div className="catalog-layout">
      <PortalTopbar active="home" />

      <main className="home-shell">
        <div className="home-hero">
          <h1>Здравствуйте, {name}</h1>
          <p className="home-lead">Выберите, с чего начать: пошаговые уроки в демо или справочные статьи Wiki.</p>
        </div>

        <div className="home-portals">
          <Link to="/dashboard" className="home-portal-card home-portal-lessons">
            <span className="home-portal-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
              </svg>
            </span>
            <h2>Уроки</h2>
            <p>Каталог модулей с заданиями, скриншотами и проверкой в демо-приложении.</p>
            <span className="home-portal-cta">Перейти к урокам →</span>
          </Link>

          <Link to="/wiki" className="home-portal-card home-portal-wiki">
            <span className="home-portal-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l6.9 3.45L12 11.1 5.1 7.65 12 4.2zM4 9.8l7 3.5v7.05l-7-3.5V9.8zm9 10.55v-7.05l7-3.5v7.05l-7 3.5z" />
              </svg>
            </span>
            <h2>Wiki</h2>
            <p>Статьи об интерфейсе демо, учебном аккаунте, карте, импорте и инструментах Learn.</p>
            <span className="home-portal-cta">Открыть Wiki →</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
