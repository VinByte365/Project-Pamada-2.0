"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PageFrame } from "@/components/aloe-guard";
import { PasswordField } from "@/components/password-field";
import { api, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    const role = String(form.get("role") || "grower");

    if (password !== confirmPassword) {
      setError("Those passwords don't match yet.");
      setBusy(false);
      return;
    }

    try {
      const result = await api.auth.register({ name, email, password, role });
      if (result.token) {
        setToken(result.token);
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create your account.");
      setBusy(false);
    }
  }

  return (
    <PageFrame active="">
      <section className="auth-layout">
        <div
          className="auth-art register-art"
          style={{
            backgroundImage:
              "linear-gradient(180deg,rgba(9,52,39,.06),rgba(9,52,39,.75)),url('/aloe-hero.svg')",
          }}
        >
          <span className="eyebrow light">FARMSYSTEM | PRECISION ALOE MONITORING</span>
          <h2>Keep the small<br />details in view.</h2>
          <p>Join growers optimizing soil health, leaf maturity, and harvest yields.</p>
        </div>
        <div className="auth-page">
          <div className="auth-card">
            <p className="eyebrow">JOIN THE GROWER NETWORK</p>
            <h1>Create your account</h1>
            <p>Your farm records and sensor telemetry are saved privately to your account.</p>
            <form onSubmit={submit}>
              <label>
                Full name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="e.g. Louis Dadivas"
                />
              </label>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Account Role
                <select name="role" defaultValue="grower">
                  <option value="grower">Aloe Grower / Farm Operator</option>
                  <option value="agronomist">Agronomist / Field Inspector</option>
                  <option value="admin">Farm Administrator</option>
                </select>
              </label>
              <PasswordField name="password" label="Password" minLength={6} />
              <small className="field-hint">Use at least 6 characters.</small>
              <PasswordField name="confirmPassword" label="Confirm password" minLength={6} />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" disabled={busy}>
                {busy ? "Creating account..." : "Create FarmSystem Account"}
              </button>
            </form>
            <p className="auth-switch">
              Already registered? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
