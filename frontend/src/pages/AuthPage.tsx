import { useState } from "react";
import * as api from "../api/client";
import type { AuthUser } from "../api/client";

interface Props {
  onAuthenticated: (token: string, user: AuthUser) => void;
}

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.signup({ email, password, name: name || undefined });
      onAuthenticated(result.token, result.user);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-card border border-ink-100 bg-white p-6">
        <h1 className="mb-1 text-lg font-semibold text-ink-900">Expense Tracker</h1>
        <p className="mb-4 text-sm text-ink-400">
          {mode === "login" ? "Log in to your account" : "Create a new account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700"
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-700"
          />

          {error && <div className="text-sm text-ledger-rust">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="mt-4 text-sm text-ink-600 underline-offset-2 hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}