import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthorRoute from "./auth/AuthorRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { PageLoading } from "./components/mui/PageStatus";

const AuthorLessonPage = lazy(() => import("./pages/AuthorLessonPage"));
const AuthorModulesPage = lazy(() => import("./pages/AuthorModulesPage"));
const AuthorWikiEditPage = lazy(() => import("./pages/AuthorWikiEditPage"));
const AuthorWikiPage = lazy(() => import("./pages/AuthorWikiPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const SelfStudyAssignmentPage = lazy(() => import("./pages/SelfStudyAssignmentPage"));
const SelfStudyPage = lazy(() => import("./pages/SelfStudyPage"));
const WikiArticlePage = lazy(() => import("./pages/WikiArticlePage"));
const WikiPage = lazy(() => import("./pages/WikiPage"));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        }
      />
      <Route
        path="/wiki"
        element={
          <LazyPage>
            <WikiPage />
          </LazyPage>
        }
      />
      <Route
        path="/wiki/:articleId"
        element={
          <LazyPage>
            <WikiArticlePage />
          </LazyPage>
        }
      />
      <Route
        path="/lessons/:lessonId"
        element={
          <LazyPage>
            <LessonPage />
          </LazyPage>
        }
      />
      <Route
        path="/self-study"
        element={
          <LazyPage>
            <SelfStudyPage />
          </LazyPage>
        }
      />
      <Route
        path="/self-study/:assignmentId"
        element={
          <LazyPage>
            <SelfStudyAssignmentPage />
          </LazyPage>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/author" element={<AuthorRoute />}>
        <Route
          index
          element={
            <LazyPage>
              <AuthorModulesPage />
            </LazyPage>
          }
        />
        <Route
          path="lessons/:lessonId"
          element={
            <LazyPage>
              <AuthorLessonPage />
            </LazyPage>
          }
        />
        <Route
          path="wiki"
          element={
            <LazyPage>
              <AuthorWikiPage />
            </LazyPage>
          }
        />
        <Route
          path="wiki/new"
          element={
            <LazyPage>
              <AuthorWikiEditPage />
            </LazyPage>
          }
        />
        <Route
          path="wiki/:slug/edit"
          element={
            <LazyPage>
              <AuthorWikiEditPage />
            </LazyPage>
          }
        />
      </Route>
      <Route path="/modules/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
