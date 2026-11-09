"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageFrame } from "@/components/aloe-guard";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setSubmitted(true);
      setBusy(false);
    }, 600);
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
          <span className="eyebrow light">FARMSYSTEM | ACCOUNT RECOVERY</span>
          <h2>Secure access to<br />your Aloe records.</h2>
          <p>Reset instructions will be delivered to your verified grower email address.</p>
        </div>

        <div className="auth-page">
          <div className="auth-card">
            <p className="eyebrow">PASSWORD ASSISTANCE</p>
            <h1>Reset your password</h1>
            <p>Enter the email address associated with your FarmSystem account.</p>

            {submitted ? (
              <div
                className="notice-panel"
                style={{
                  marginTop: "24px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "18px",
                  borderRadius: "8px",
                }}
              >
                <strong style={{ color: "#166534", fontSize: "14px", display: "block" }}>
                  ✓ Recovery Instructions Sent
                </strong>
                <p style={{ margin: "8px 0", fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
                  If an account exists for <code>{email}</code>, an account recovery link has been dispatched.
                  Please check your inbox and spam folder.
                </p>
                <div style={{ marginTop: "16px" }}>
                  <Link href="/login" className="primary-button" style={{ display: "inline-block", textAlign: "center" }}>
                    Return to Sign in →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
                <label>
                  Registered Email address
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@gmail.com"
                  />
                </label>
                <button className="primary-button" disabled={busy} style={{ marginTop: "12px" }}>
                  {busy ? "Processing..." : "Send Reset Instructions"}
                </button>
              </form>
            )}

            <p className="auth-switch" style={{ marginTop: "20px" }}>
              Remember your password? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

