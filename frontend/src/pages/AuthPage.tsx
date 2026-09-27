import { useState } from "react";
import * as api from "../api/client";
import type { AuthUser } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

interface Props {
  onAuthenticated: (token: string, user: AuthUser) => void;
}

type Mode = "login" | "signup" | "forgot-email" | "forgot-questions" | "forgot-reset";

const EMPTY_QUESTIONS = Array.from({ length: 1 }, () => ({ question: "", answer: "" }));

const SECURITY_QUESTION_OPTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was your childhood nickname?",
  "What is your favorite book?",
  "In what city were you born?",
  "What was the make of your first car?",
  "What is your favorite teacher's name?",
  "What street did you grow up on?",
  "What is your favorite food?",
  "What was the name of your first school?",
];

const inputClass =
  "w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700";

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>("login");

  // Login / signup fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState(EMPTY_QUESTIONS);

  // Shared error/status state
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [noAccountFound, setNoAccountFound] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot-password flow state
  const [forgotEmail, setForgotEmail] = useState("");
  const [questions, setQuestions] = useState<{ id: string; question: string }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function resetMessages() {
    setError("");
    setInfo("");
    setNoAccountFound(false);
  }

  function handleApiError(err: any, context: "login" | "other" = "other") {
    if (!err?.response) {
      setError("Can't reach the server. Make sure the backend is running.");
    } else if (err.response.status === 404 && context === "login") {
      setError("No account found with this email.");
      setNoAccountFound(true);
    } else {
      setError(err.response.data?.error || "Something went wrong");
    }
  }

  // --- Login / signup ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await api.login({ email, password });
        onAuthenticated(result.token, result.user);
      } else {
        const incomplete = securityQuestions.some((q) => !q.question.trim() || !q.answer.trim());
        if (incomplete) {
          setError("Please select a security question and provide an answer.");
          setLoading(false);
          return;
        }
        const result = await api.signup({
          email,
          password,
          name: name || undefined,
          securityQuestions,
        });
        onAuthenticated(result.token, result.user);
      }
    } catch (err: any) {
      handleApiError(err, mode === "login" ? "login" : "other");
    } finally {
      setLoading(false);
    }
  }

  function updateQuestion(index: number, field: "question" | "answer", value: string) {
    setSecurityQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function switchToSignup() {
    setMode("signup");
    resetMessages();
  }

  // --- Forgot password: step 1, look up questions by email ---
  async function handleForgotEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const result = await api.getSecurityQuestions(forgotEmail);
      setQuestions(result.questions);
      setAnswers({});
      setMode("forgot-questions");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  // --- Forgot password: step 2, verify answers ---
  async function handleAnswersSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const result = await api.verifySecurityAnswers({
        email: forgotEmail,
        answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] || "" })),
      });
      setResetToken(result.resetToken);
      setMode("forgot-reset");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  // --- Forgot password: step 3, set the new password ---
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ resetToken, newPassword });
      setMode("login");
      setPassword("");
      setEmail(forgotEmail);
      setInfo("Password reset. Please log in with your new password.");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  function backToLogin() {
    setMode("login");
    resetMessages();
    setForgotEmail("");
    setQuestions([]);
    setAnswers({});
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-card border border-ink-100 bg-white p-6">
        <h1 className="mb-1 text-lg font-semibold text-ink-900">Expense Tracker</h1>

        {/* --- LOGIN / SIGNUP --- */}
        {(mode === "login" || mode === "signup") && (
          <>
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
                  className={inputClass}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />

              {mode === "signup" && (
                <div className="space-y-3 rounded-lg border border-ink-100 p-3">
                  <p className="text-xs font-medium text-ink-600">
                    Set up a security question — you'll use this to reset your password if you
                    forget it (no email required).
                  </p>
                  {securityQuestions.map((q, i) => {
                    const pickedElsewhere = securityQuestions
                      .filter((_, idx) => idx !== i)
                      .map((sq) => sq.question);
                    return (
                      <div key={i} className="space-y-1">
                        <select
                          required
                          value={q.question}
                          onChange={(e) => updateQuestion(i, "question", e.target.value)}
                          className={inputClass}
                        >
                          <option value="" disabled>
                            Select a security question
                          </option>
                          {SECURITY_QUESTION_OPTIONS.filter(
                            (opt) => opt === q.question || !pickedElsewhere.includes(opt)
                          ).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Your answer"
                          required
                          value={q.answer}
                          onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-email");
                    resetMessages();
                    setForgotEmail(email);
                  }}
                  className="text-sm text-ink-600 underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              )}

              {info && <div className="text-sm text-ledger-green">{info}</div>}
              {error && (
                <div className="space-y-1.5">
                  <div className="text-sm text-ledger-rust">{error}</div>
                  {noAccountFound && (
                    <button
                      type="button"
                      onClick={switchToSignup}
                      className="text-sm font-medium text-ink-900 underline-offset-2 hover:underline"
                    >
                      Create an account with this email &rarr;
                    </button>
                  )}
                </div>
              )}

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
                resetMessages();
              }}
              className="mt-4 text-sm text-ink-600 underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </>
        )}

        {/* --- FORGOT PASSWORD: step 1, email --- */}
        {mode === "forgot-email" && (
          <>
            <p className="mb-4 text-sm text-ink-400">
              Enter your account email to answer your security questions.
            </p>
            <form onSubmit={handleForgotEmailSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={inputClass}
              />
              {error && <div className="text-sm text-ledger-rust">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>
            </form>
            <button
              onClick={backToLogin}
              className="mt-4 text-sm text-ink-600 underline-offset-2 hover:underline"
            >
              &larr; Back to login
            </button>
          </>
        )}

        {/* --- FORGOT PASSWORD: step 2, answer questions --- */}
        {mode === "forgot-questions" && (
          <>
            <p className="mb-4 text-sm text-ink-400">
              Answer your security question to verify it's you.
            </p>
            <form onSubmit={handleAnswersSubmit} className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="space-y-1">
                  <label className="text-xs font-medium text-ink-600">{q.question}</label>
                  <input
                    type="text"
                    required
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              ))}
              {error && <div className="text-sm text-ledger-rust">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify answers"}
              </button>
            </form>
            <button
              onClick={backToLogin}
              className="mt-4 text-sm text-ink-600 underline-offset-2 hover:underline"
            >
              &larr; Back to login
            </button>
          </>
        )}

        {/* --- FORGOT PASSWORD: step 3, set new password --- */}
        {mode === "forgot-reset" && (
          <>
            <p className="mb-4 text-sm text-ink-400">Choose a new password.</p>
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="New password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              {error && <div className="text-sm text-ledger-rust">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Saving..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}