import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getMe, type User } from "../../api/learnApi";

type AuthContextValue = {
  user: User;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_USER: User = {
  id: "guest",
  email: "guest@local",
  display_name: "Ученик 1",
  role: "student",
};

const AUTHORING_DEV = import.meta.env.VITE_AUTHORING_ENABLED === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((token: string, nextUser: User) => {
    localStorage.setItem("learn_token", token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("learn_token");
    setUser(GUEST_USER);
  }, []);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(GUEST_USER))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ user, loading, setSession, logout }),
    [user, loading, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useIsAuthor() {
  const { user } = useAuth();
  return user?.role === "author" || AUTHORING_DEV;
}
