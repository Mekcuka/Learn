import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { login, LearnApiError } from "../api/learnApi";
import { PageError } from "../components/mui/PageStatus";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { user, setSession } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState("author@training.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user.id !== "guest") {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      setSession(result.access_token, result.user);
      navigate(nextPath, { replace: true });
    } catch (err) {
      if (err instanceof LearnApiError) {
        setError(err.message);
      } else {
        setError("Не удалось войти. Проверьте подключение к серверу.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <Typography variant="h4" fontWeight="bold" component="h1">
        Вход в Learn
      </Typography>
      <Typography color="text.secondary" className="subtitle">
        Учебный портал ориентации в демо-приложении
      </Typography>
      <form className="login-form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
          fullWidth
        />
        <TextField
          label="Пароль"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          fullWidth
        />
        {error && <PageError message={error} />}
        <Button type="submit" variant="contained" fullWidth disabled={submitting}>
          {submitting ? "Вход…" : "Войти"}
        </Button>
      </form>
    </main>
  );
}
