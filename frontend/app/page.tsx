import { Mic, Phone, ArrowUpRight } from "lucide-react";
import "./globals.css";

const steps = [
  {
    number: "01",
    title: "Describe Your Business",
    copy: "Tell us what you want to build, where you want to build it, and what you need to get started.",
  },
  {
    number: "02",
    title: "AI Feasibility Analysis",
    copy: "Get a clear, local view of demand, competition, opportunity, and the scheme support available to you.",
  },
  {
    number: "03",
    title: "Get Your DPR",
    copy: "Create a ready-to-share project report built around your business idea and verified scheme rules.",
  },
];

const metrics = [
  ["5%", "per annum", "Interest rate"],
  ["Up to Rs.50L", "loan support", "Project funding"],
  ["100%", "DBT", "Transparent transfer"],
  ["3 Mins", "to get started", "Simple guidance"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Udyog-Saarthi home">
          <img src="/images/logo_icon.jpg" alt="" className="brand-mark" />
          <span>Udyog-Saarthi</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#benefits">Benefits</a>
          <a href="#how-it-works">Specifications</a>
          <a href="#how-it-works">How-To</a>
          <a href="#contact">Contact Us</a>
        </nav>
        <button className="language-button" type="button">IN / EN <span aria-hidden="true">⌄</span></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Udyog-Saarthi</h1>
          <div className="hero-actions">
            <a className="button button-dark" href="#how-it-works">Feasibility Checker <ArrowUpRight size={15} /></a>
            <a className="button button-light" href="#contact"><Mic size={15} /> Voice-Saarthi</a>
          </div>
        </div>
        <div className="hero-art" aria-label="People supported by Udyog-Saarthi">
          <div className="image-panel">
            <img src="/images/face_woman.jpg" alt="Woman entrepreneur" className="hero-woman" />
            <img src="/images/face_man.jpg" alt="Young entrepreneur" className="hero-man" />
          </div>
        </div>
      </section>

      <section className="work-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">Your journey, made clear</p>
          <h2>How does UdyogSaarthi Work?</h2>
        </div>
        <div className="step-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guidance" id="contact">
        <div>
          <p className="eyebrow eyebrow-on-dark">Need a little help?</p>
          <h2>Need Phone Guidance in your language?</h2>
        </div>
        <div className="phone-card">
          <a href="tel:+918983172377"><Phone size={16} /> +91 89831 72377</a>
          <span>Monday–Saturday<br /><small>0900–1900 hrs</small></span>
        </div>
      </section>

      <section className="backing" id="benefits">
        <div className="section-heading centered">
          <p className="eyebrow">Built for confidence</p>
          <h2>Official Backing &amp; Concessional Credit</h2>
          <p>Clear information, transparent support, and guidance you can trust.</p>
        </div>
        <div className="metric-grid">
          {metrics.map(([value, label, caption]) => (
            <div className="metric-card" key={value}>
              <strong>{value}</strong>
              <span>{label}</span>
              <small>{caption}</small>
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#top"><img src="/images/logo_icon.jpg" alt="" className="brand-mark" /><span>UdyogSaarthi</span></a>
            <p>Independent Rural Enterprise Advisory Platform</p>
            <span className="footer-copy">A trusted starting point for rural entrepreneurs seeking practical advice, local insight, and better access to opportunity.</span>
          </div>
          <div className="footer-links">
            <div><b>Explore</b><a href="#how-it-works">Feasibility Assessment</a><a href="#benefits">Scheme Directory</a><a href="#contact">Phone Guidance</a></div>
            <div><b>Information</b><a href="#top">About UdyogSaarthi</a><a href="#benefits">Concessional Credit</a><a href="#contact">Contact Us</a></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2025 UdyogSaarthi. Built for better beginnings.</span><span>English &nbsp; हिन्दी &nbsp; বাংলা</span></div>
      </footer>
    </main>
  );
}
