"use client";
import { useState } from "react";
export function PasswordField({ name, label, required = true, minLength, defaultValue }: { name: string; label: string; required?: boolean; minLength?: number; defaultValue?: string }) {
  const [visible, setVisible] = useState(false);
  return <label>{label}<span className="password-wrap"><input name={name} defaultValue={defaultValue} type={visible ? "text" : "password"} required={required} minLength={minLength} autoComplete={name === "password" ? "current-password" : "new-password"} /><button type="button" onClick={() => setVisible(v => !v)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? "Hide" : "Show"}</button></span></label>;
}
