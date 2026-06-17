import { Navigate, Route, Routes } from "react-router-dom";

import AuthorRoute from "./auth/AuthorRoute";
import AuthorLessonPage from "./pages/AuthorLessonPage";
import AuthorModulesPage from "./pages/AuthorModulesPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LessonPage from "./pages/LessonPage";
import LoginPage from "./pages/LoginPage";
import WikiArticlePage from "./pages/WikiArticlePage";
import WikiPage from "./pages/WikiPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/wiki" element={<WikiPage />} />
      <Route path="/wiki/:articleId" element={<WikiArticlePage />} />
      <Route path="/lessons/:lessonId" element={<LessonPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/author" element={<AuthorRoute />}>
        <Route index element={<AuthorModulesPage />} />
        <Route path="lessons/:lessonId" element={<AuthorLessonPage />} />
      </Route>
      <Route path="/modules/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
