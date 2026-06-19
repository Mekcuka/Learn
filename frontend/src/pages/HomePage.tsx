import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";

import "../styles/portal-wiki.css";

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
          <Typography variant="h3" fontWeight="bold" component="h1">
            Здравствуйте, {name}
          </Typography>
          <Typography variant="h6" color="text.secondary" className="home-lead">
            Выберите, с чего начать: пошаговые уроки, самостоятельную работу или справочные статьи Wiki.
          </Typography>
        </div>

        <div className="home-portals">
          <Link to="/dashboard" className="home-portal-card-link">
            <Card className="home-portal-card home-portal-lessons" variant="outlined">
              <CardContent>
                <span className="home-portal-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
                  </svg>
                </span>
                <Typography variant="h5" fontWeight="bold" component="h2">
                  Уроки
                </Typography>
                <Typography color="text.secondary">
                  Каталог модулей с заданиями, скриншотами и проверкой в демо-приложении.
                </Typography>
                <Typography fontWeight="bold" color="primary" className="home-portal-cta">
                  Перейти к урокам →
                </Typography>
              </CardContent>
            </Card>
          </Link>

          <Link to="/self-study" className="home-portal-card-link">
            <Card className="home-portal-card home-portal-self-study" variant="outlined">
              <CardContent>
                <span className="home-portal-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </span>
                <Typography variant="h5" fontWeight="bold" component="h2">
                  Самостоятельная работа
                </Typography>
                <Typography color="text.secondary">
                  Тестовые задания с пошаговыми инструкциями и проверкой выполнения в демо.
                </Typography>
                <Typography fontWeight="bold" color="primary" className="home-portal-cta">
                  Перейти к заданиям →
                </Typography>
              </CardContent>
            </Card>
          </Link>

          <Link to="/wiki" className="home-portal-card-link">
            <Card className="home-portal-card home-portal-wiki" variant="outlined">
              <CardContent>
                <span className="home-portal-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l6.9 3.45L12 11.1 5.1 7.65 12 4.2zM4 9.8l7 3.5v7.05l-7-3.5V9.8zm9 10.55v-7.05l7-3.5v7.05l-7 3.5z" />
                  </svg>
                </span>
                <Typography variant="h5" fontWeight="bold" component="h2">
                  Wiki
                </Typography>
                <Typography color="text.secondary">
                  Статьи об интерфейсе демо, учебном аккаунте, карте, импорте и инструментах Learn.
                </Typography>
                <Typography fontWeight="bold" color="primary" className="home-portal-cta">
                  Открыть Wiki →
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
