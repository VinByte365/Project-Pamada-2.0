"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { leafImage } from "@/components/plant-assets";
import { api, clearToken, getToken } from "@/lib/api";

export { leafImage } from "@/components/plant-assets";

const publicLinks = [
  ["Home", "/"],
  ["About", "/about"],
];

const growerLinks = [
  ["Overview", "/dashboard", "O"],
  ["AI Scanner", "/detect", "✦"],
  ["Scan history", "/history", "◷"],
  ["Diagnoses", "/diagnoses", "D"],
  ["Maturity", "/maturity", "M"],
  ["Care guides", "/recommendations", "♥"],
  ["AI Chatbot", "/chat", "💬"],
  ["Soil sensors", "/sensors", "S"],
  ["Plants", "/plants", "P"],
  ["Farms", "/farms", "F"],
  ["Quality grades", "/gradings", "G"],
  ["Profit reports", "/reports", "R"],
  ["Community", "/community", "C"],
  ["My profile", "/profile", "U"],
  ["Settings", "/settings", "⚙"],
];

const adminLinks = [
  ["Admin Dashboard", "/admin", "📊"],
  ["User Management", "/admin?tab=users", "👥"],
  ["Plant Records", "/admin?tab=plants", "🌿"],
  ["Scan Records Audit", "/admin?tab=scans", "🔬"],
  ["Disease Library", "/admin?tab=diseases", "🩺"],
  ["Recommendations", "/admin?tab=recommendations", "💡"],
  ["AI Model Status", "/admin?tab=ai_model", "🧠"],
  ["Reports & Analytics", "/admin?tab=reports", "📈"],
  ["Activity Logs", "/admin?tab=activity", "📋"],
  ["Admin Profile", "/profile", "U"],
  ["System Settings", "/settings", "⚙"],
];

export function SiteHeader({ active = "Home" }: { active?: string }) {
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getToken()));
    if (getToken()) {
      api.auth.me().then((u) => {
        if (u?.role === "admin") setIsAdmin(true);
      }).catch(() => {});
    }
  }, []);

  return (
    <header className="topbar">
      <Link className="logo" href="/">
        <span className="logo-leaf" aria-hidden="true" />
        <span>Aloe<span>Guard</span></span>
      </Link>
      <nav className="main-nav" aria-label="Public navigation">
        {publicLinks.map(([label, href]) => (
          <Link className={active === label ? "active" : ""} key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      {hasToken ? (
        <Link className="login-button" href={isAdmin ? "/admin" : "/dashboard"}>
          {isAdmin ? "Admin Console →" : "Dashboard →"}
        </Link>
      ) : (
        <Link className="login-button" href="/login">Log in</Link>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <span className="footer-brand">
        <span className="logo-leaf" aria-hidden="true" /> AloeGuard
      </span>
      <span>FarmSystem · Aloe Vera Health Monitoring &amp; Crop Management</span>
      <span>Capstone project</span>
    </footer>
  );
}

export function PageFrame({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <main className="app-shell">
      <SiteHeader active={active} />
      {children}
      <SiteFooter />
    </main>
  );
}

export function AppFrame({ active, children }: { active: string; children: ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState("Grower");
  const [role, setRole] = useState("grower");

  useEffect(() => {
    api.auth.me()
      .then((user) => {
        if (!user) {
          if (!getToken()) {
            router.push("/login");
          }
          return;
        }
        setName(user.name || (user.role === "admin" ? "Administrator" : "Grower"));
        setRole(user.role || "grower");

        // If user is admin and visits a grower-only page, redirect immediately to /admin
        if (
          user.role === "admin" &&
          !active.toLowerCase().includes("admin") &&
          active !== "Settings" &&
          active !== "My profile"
        ) {
          router.replace("/admin");
        }
      })
      .catch(() => {
        if (!getToken()) {
          router.push("/login");
        }
      });
  }, [router, active]);

  async function logout() {
    await api.auth.logout();
    clearToken();
    router.push("/login");
  }

  const isAdmin = role === "admin" || active.toLowerCase().includes("admin");
  const visibleLinks = isAdmin ? adminLinks : growerLinks;

  return (
    <main className="app-shell">
      <div className="app-layout">
        <aside className="app-sidebar">
          <Link className="logo sidebar-logo" href={isAdmin ? "/admin" : "/dashboard"}>
            <span className="logo-leaf" aria-hidden="true" />
            <span>Aloe<span>Guard</span></span>
          </Link>
          <p className="sidebar-caption">
            {isAdmin ? "ADMINISTRATION CONSOLE" : "GROWER WORKSPACE"}
          </p>
          <nav className="sidebar-links" aria-label="Account navigation">
            {visibleLinks.map(([label, href, icon]) => (
              <Link className={active === label ? "active" : ""} key={href} href={href}>
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="user-chip">
              <span className="avatar">{name.charAt(0).toUpperCase()}</span>
              <span>
                <strong>{name}</strong>
                <small>{role.charAt(0).toUpperCase() + role.slice(1)}</small>
              </span>
            </div>
            <button className="sidebar-logout" onClick={logout} type="button">
              <span>Sign out</span>
            </button>
            <Link href="/" className="back-home">Back to home</Link>
          </div>
        </aside>
        <div className="app-main">
          <div className="mobile-brand">
            <Link className="logo" href={isAdmin ? "/admin" : "/dashboard"}>
              <span className="logo-leaf" aria-hidden="true" />
              <span>Aloe<span>Guard</span></span>
            </Link>
            <div style={{ display: "flex", gap: "10px" }}>
              {isAdmin ? (
                <>
                  <Link href="/admin">Admin Console</Link>
                  <Link href="/admin?tab=users">Users</Link>
                  <Link href="/admin?tab=scans">Scans</Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/farms">Farms</Link>
                  <Link href="/plants">Plants</Link>
                </>
              )}
            </div>
          </div>
          {children}
          <SiteFooter />
        </div>
      </div>
    </main>
  );
}

export function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article className="feature">
      <span className="feature-icon" aria-hidden="true">{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}

export function FeatureStrip() {
  return (
    <section className="feature-strip" aria-label="Platform features">
      <Feature icon="01" title="Farms & Plots" text="Organize Aloe Vera parcels and track soil conditions." />
      <Feature icon="02" title="Plant Inventory" text="Full plant life-cycle from seedling to harvest." />
      <Feature icon="AI" title="Health & Diagnosis" text="Log disease detection, symptoms, and treatments." />
      <Feature icon="NPK" title="NPK Soil Sensors" text="Live monitoring of Nitrogen, Phosphorus, Potassium & pH." />
    </section>
  );
}

export function Stat({
  icon,
  label,
  value,
  detail,
  warning = false,
}: {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  warning?: boolean;
}) {
  return (
    <article className={`stat ${warning ? "warning" : ""}`}>
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}

export { Detector } from "./plant-scanner";

export function AboutContent() {
  return (
    <section className="about-section standalone-page">
      <div className="about-copy">
        <p className="kicker">ABOUT THE CAPSTONE</p>
        <h1>Aloe Vera care<br /><span>starts with noticing.</span></h1>
        <p>
          AloeGuard connects farm parcel monitoring, plant life-cycle tracking, health diagnoses,
          NPK soil nutrients, maturity evaluation, harvest grading, and profit reports into a
          single integrated platform.
        </p>
        <div className="about-features">
          <Feature icon="F" title="Farms & Plots" text="Manage farm locations and soil types." />
          <Feature icon="P" title="Plant Records" text="Track individual plants and varieties." />
          <Feature icon="NPK" title="Soil Sensors" text="Real-time NPK and moisture telemetry." />
          <Feature icon="R" title="Profit Analytics" text="Yield, expenses, revenue and margin calculations." />
        </div>
      </div>
      <div className="about-photo" style={{ backgroundImage: `url(${leafImage})` }}>
        <span>Aloe Vera<br /><em>care</em></span>
      </div>
    </section>
  );
}
