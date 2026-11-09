"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/aloe-guard";
import { api, getToken } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("grower");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    api.auth.me()
      .then((user) => {
        if (!user) {
          if (!getToken()) router.push("/login");
          return;
        }
        setName(user.name || "");
        setEmail(user.email || "");
        setRole(user.role || "grower");
        setPhoto(user.image || "");
      })
      .catch(() => {
        if (!getToken()) router.push("/login");
      });
  }, [router]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await api.auth.updateProfile({ name });
      setMessage("Your profile has been successfully updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  function previewPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    if (photo.startsWith("blob:")) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setMessage("Preview updated. Save changes to keep your preferences.");
  }

  return (
    <AppFrame active="My profile">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">YOUR ACCOUNT <span>•</span> OPERATOR PROFILE</p>
            <h1>Cultivator Profile</h1>
            <p>Manage your account credentials, operator role, and personal preferences.</p>
          </div>
        </div>

        {message && (
          <div className="alert-banner success" role="status">
            <span>{message}</span>
            <button className="text-button" onClick={() => setMessage("")} type="button">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={() => setError("")} type="button">✕</button>
          </div>
        )}

        <section className="panel profile-panel">
          <div className="profile-photo-section">
            <div className="profile-avatar">
              {photo ? (
                <Image src={photo} alt="Profile preview" width={75} height={75} unoptimized />
              ) : (
                <span>{name.charAt(0).toUpperCase() || "G"}</span>
              )}
            </div>
            <div>
              <h2>{name || "Cultivator"}</h2>
              <p>
                Role: <strong style={{ textTransform: "capitalize" }}>{role}</strong> · Backend Authenticated
              </p>
              <label className="secondary-button upload-button">
                Choose photo
                <input type="file" accept="image/*" onChange={previewPhoto} hidden />
              </label>
            </div>
          </div>

          <form className="profile-form" onSubmit={save}>
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              Email address
              <input value={email} type="email" disabled />
              <small>Managed securely by FarmSystem database.</small>
            </label>
            <label>
              Assigned Role
              <input value={role.charAt(0).toUpperCase() + role.slice(1)} disabled />
              <small>Determines access privileges and authorization tiers.</small>
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving changes..." : "Save Profile Changes"}
            </button>
          </form>
        </section>
      </section>
    </AppFrame>
  );
}
