"use client";

/**
 * C07 Auth card (`#authCard`).
 *
 * Email + password login (OAuth2 FORM-encoded via `SaarthiApi.token`),
 * self-register (201 → auto-login), Me (profile), Logout.
 * JWT is persisted under `saarthi-jwt`. While unauthenticated a login
 * nudge is shown (feasibility + DPR need Bearer).
 *
 * Styling: semantic class names + `var(--…)` tokens owned by Agent 1's
 * tokens.css. No color hexes here.
 */

import { useEffect, useState } from "react";
import {
  ApiError,
  SaarthiApi,
  clearToken,
  getToken,
  setToken,
  type UserOut,
} from "../lib/api-client";

const PASSWORD_HINT = "Min 8 characters, with a letter and a digit.";

function passwordError(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password needs both a letter and a digit.";
  }
  return null;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.detail;
    if (err.status === 401) return "Incorrect email or password.";
    if (err.status === 403) return "This account is inactive.";
    if (err.status === 409) return "An account with this email already exists.";
    if (err.status === 422) return err.detail;
    return `Login failed (${err.status}): ${err.detail}`;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"login" | "register" | "me" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(getToken() !== null);
  }, []);

  async function handleLogin() {
    const pwErr = passwordError(password);
    if (pwErr) {
      setFieldError(pwErr);
      return;
    }
    setFieldError(null);
    setBusy("login");
    setNotice(null);
    try {
      const tok = await SaarthiApi.token(email.trim(), password);
      setToken(tok.access_token);
      setAuthed(true);
      setPassword("");
      const profile = await SaarthiApi.me();
      setUser(profile);
      setNotice(`Welcome${profile.full_name ? `, ${profile.full_name}` : ""}. You are logged in.`);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleRegister() {
    const pwErr = passwordError(password);
    if (pwErr) {
      setFieldError(pwErr);
      return;
    }
    setFieldError(null);
    setBusy("register");
    setNotice(null);
    try {
      await SaarthiApi.register({ email: email.trim(), password });
      // Registration returns 201 without a token — log in immediately.
      const tok = await SaarthiApi.token(email.trim(), password);
      setToken(tok.access_token);
      setAuthed(true);
      setPassword("");
      setUser(await SaarthiApi.me());
      setNotice("Account created — you are logged in.");
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleMe() {
    setBusy("me");
    setNotice(null);
    try {
      const profile = await SaarthiApi.me();
      setUser(profile);
      setAuthed(true);
      setNotice(`Logged in as ${profile.email} (${profile.role}).`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setAuthed(false);
        setUser(null);
      }
      setNotice(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setUser(null);
    setPassword("");
    setNotice("Logged out. Your form entries were kept.");
  }

  const working = busy !== null;

  return (
    <section
      id="authCard"
      className="auth-card"
      aria-label="Login"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <h2 style={{ color: "var(--fg)" }}>Login</h2>

      {!authed && (
        <p className="auth-nudge" style={{ color: "var(--muted)" }}>
          Log in to check feasibility and get your bank paper. Checking viability
          and DPR download need an account.
        </p>
      )}

      <label htmlFor="authEmail" style={{ color: "var(--fg)" }}>
        Email
      </label>
      <input
        id="authEmail"
        className="auth-input"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />

      <label htmlFor="authPassword" style={{ color: "var(--fg)" }}>
        Password
      </label>
      <input
        id="authPassword"
        className="auth-input"
        type="password"
        autoComplete="current-password"
        aria-describedby="authPwHint"
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (fieldError) setFieldError(null);
        }}
      />
      <p id="authPwHint" className="auth-hint" style={{ color: "var(--muted)" }}>
        {PASSWORD_HINT}
      </p>
      {fieldError && (
        <p role="alert" className="auth-error" style={{ color: "var(--danger)" }}>
          {fieldError}
        </p>
      )}

      <div className="auth-actions">
        <button
          type="button"
          onClick={handleLogin}
          disabled={working || email.trim() === "" || password === ""}
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          {busy === "login" ? "Logging in…" : "Login"}
        </button>
        <button
          type="button"
          onClick={handleRegister}
          disabled={working || email.trim() === "" || password === ""}
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        >
          {busy === "register" ? "Registering…" : "Register"}
        </button>
        <button
          type="button"
          onClick={handleMe}
          disabled={working}
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        >
          {busy === "me" ? "Checking…" : "Me"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={working || !authed}
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        >
          Logout
        </button>
      </div>

      {notice && (
        <p role="status" className="auth-notice" style={{ color: "var(--muted)" }}>
          {notice}
        </p>
      )}
      {authed && user && (
        <p className="auth-user" style={{ color: "var(--muted)" }}>
          {user.email} · {user.role}
        </p>
      )}
    </section>
  );
}
