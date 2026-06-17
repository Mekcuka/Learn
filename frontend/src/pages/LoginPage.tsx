import { Button } from "@consta/uikit/Button";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { FormEvent, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { login, LearnApiError } from "../api/learnApi";
import { PageError } from "../components/consta/PageStatus";
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
      <Text size="2xl" weight="bold" as="h1">
        Вход в Learn
      </Text>
      <Text size="m" view="secondary" className="subtitle">
        Учебный портал ориентации в демо-приложении
      </Text>
      <form className="login-form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(value) => setEmail(value ?? "")}
          autoComplete="username"
          required
        />
        <TextField
          label="Пароль"
          type="password"
          value={password}
          onChange={(value) => setPassword(value ?? "")}
          autoComplete="current-password"
          required
        />
        {error && <PageError message={error} />}
        <Button
          type="submit"
          label={submitting ? "Вход…" : "Войти"}
          loading={submitting}
          disabled={submitting}
          width="full"
        />
      </form>
    </main>
  );
}
