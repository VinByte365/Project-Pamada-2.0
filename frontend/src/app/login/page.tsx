"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PageFrame } from "@/components/aloe-guard";
import { PasswordField } from "@/components/password-field";
import { api, getToken, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) {
      api.auth.me()
        .then((u) => {
          if (u) {
            if (u.role === "admin") {
              router.replace("/admin");
            } else {
              router.replace("/dashboard");
            }
          }
        })
        .catch(() => {});
    }
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const result = await api.auth.login({ email, password });
      if (result.token) {
        setToken(result.token);
      }
      // Redirect admins directly to Admin Console; growers to Cultivation Dashboard
      if (result.user?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <PageFrame active="">
      <section className="auth-layout">
        <div
          className="auth-art"
          style={{
            backgroundImage:
              "linear-gradient(180deg,rgba(9,52,39,.06),rgba(9,52,39,.75)),url('/aloe-hero.svg')",
          }}
        >
          <span className="eyebrow light">FARMSYSTEM | ALOE VERA WORKSPACE</span>
          <h2>Thoughtful care<br />starts with a record.</h2>
          <p>Integrated telemetry for your farm plots, plants, soil sensors, and crop health.</p>
        </div>
        <div className="auth-page">
          <div className="auth-card">
            <p className="eyebrow">WELCOME BACK</p>
            <h1>Sign in to your account</h1>
            <p>Access your FarmSystem workspace, real-time telemetry, and field data.</p>
            <form onSubmit={submit}>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue="farmer@gmail.com"
                  placeholder="you@example.com"
                />
              </label>
              <PasswordField name="password" label="Password" defaultValue="farmpass123" />
              <div style={{ textAlign: "right", marginTop: "-6px" }}>
                <Link href="/forgot-password" style={{ fontSize: "11px", color: "var(--leaf)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>
                {busy ? "Signing in..." : "Sign in to FarmSystem"}
              </button>
            </form>
            <div style={{ marginTop: "16px", padding: "10px 14px", background: "#f4f6f1", border: "1px solid #e1e7dd", borderRadius: "6px", fontSize: "12px", color: "#374151" }}>
              <strong style={{ color: "var(--forest)" }}>Demo Login:</strong> <code>farmer@gmail.com</code> · Password: <code>farmpass123</code>
            </div>
            <p className="auth-switch">
              New to FarmSystem? <Link href="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
