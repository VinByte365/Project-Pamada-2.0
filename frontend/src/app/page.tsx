import Link from "next/link";
import { FeatureStrip, PageFrame, leafImage } from "@/components/aloe-guard";

export default function Home() {
  return <PageFrame active="Home">
    <section className="landing-hero">
      <div className="landing-copy">
        <p className="eyebrow light">ALOE VERA HEALTH, MADE CLEARER</p>
        <h1>Know your Aloe Vera.<br /><span>Grow with care.</span></h1>
        <p>AloeGuard keeps Aloe Vera photos and health records together, so growers can follow each plant over time.</p>
        <div className="hero-actions"><Link className="primary-button" href="/register">Get started <span aria-hidden="true">-&gt;</span></Link><Link className="light-link" href="/about">About AloeGuard</Link></div>
        <div className="hero-proof"><span className="proof-mark">A</span><span>Private Aloe Vera records</span><i /><span>Clear analysis status</span></div>
      </div>
      <div className="landing-visual" role="img" aria-label="Illustration of an aloe vera plant in a terracotta pot" style={{ backgroundImage: "url('/aloe-hero.svg')" }}><div className="visual-caption"><span>ALOE VERA | ALOE BARBADENSIS</span><strong>Small observations<br />make a difference.</strong></div></div>
    </section>
    <FeatureStrip />
    <section className="landing-intro"><div><p className="eyebrow">YOUR ALOE VERA JOURNAL</p><h2>One place for the<br /><span>details that matter.</span></h2></div><p>Save Aloe Vera photos and observations in a private history. Species identification, disease analysis, and NPK sensor readings will be shown only when their real integrations are available.</p></section>
    <section className="landing-cards">
      <Link href="/detect" className="landing-card"><span className="landing-card-icon">01</span><div><span className="eyebrow">ALOE VERA PHOTO</span><h3>Review an Aloe Vera image</h3><p>Save a photo as an unverified record while species identification is unavailable.</p><span className="card-link">Open Aloe Vera scanner <b>-&gt;</b></span></div></Link>
      <Link href="/dashboard" className="landing-card"><span className="landing-card-icon">02</span><div><span className="eyebrow">PRIVATE HISTORY</span><h3>Build your Aloe Vera history</h3><p>Review saved Aloe Vera photos and any verified assessments.</p><span className="card-link">View Aloe Vera dashboard <b>-&gt;</b></span></div></Link>
      <Link href="/sensors" className="landing-card"><span className="landing-card-icon">NPK</span><div><span className="eyebrow">SOIL MONITORING</span><h3>Check Aloe Vera soil status</h3><p>See whether an NPK sensor is connected to your Aloe Vera workspace.</p><span className="card-link">Open soil monitoring <b>-&gt;</b></span></div></Link>
    </section>
    <section className="landing-about"><div className="about-photo" style={{ backgroundImage: `url(${leafImage})` }} /><div><p className="eyebrow">THE CAPSTONE PROJECT</p><h2>Technology should make<br />Aloe Vera care feel <em>simpler.</em></h2><p>Designed for Aloe Vera growers who want a clearer view of saved photos, health assessments, and soil data without overstating what the system can identify.</p><Link className="text-link" href="/about">Read about AloeGuard -&gt;</Link></div></section>
    <section className="landing-cta"><div><p className="eyebrow light">YOUR ALOE VERA WORKSPACE</p><h2>Start keeping a closer record.</h2></div><Link className="primary-button" href="/register">Create your account -&gt;</Link></section>
  </PageFrame>;
}
