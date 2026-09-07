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
  ["5% per annum", "Concessional rate", "Government Credit Line"],
  ["Up to Rs.50L", "Interest rate cap", "Direct Applicant Support"],
  ["100% DBT", "Transparent transfer", "Every transaction tracked"],
  ["3 Mins", "to get started", "Simple guidance"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Udyog-Saarthi home">
          <img src="/images/logo.png" alt="" className="brand-mark" />
          <span>Udyog-Saarthi</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#benefits">Benefits</a>
          <a href="#how-it-works">Specifications</a>
          <a href="#how-it-works">How-To</a>
          <a href="#contact">Contact Us</a>
        </nav>
        <button className="language-button" type="button">EN/हिं</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Udyog<span className="title-hyphen">-</span>Saarthi</h1>
          <div className="hero-actions">
            <a className="button button-dark" href="#how-it-works">Feasibility Checker <span aria-hidden="true">↗</span></a>
            <a className="button button-light" href="#contact"><span aria-hidden="true">◉</span> Voice-Saarthi</a>
          </div>
        </div>
        <div className="hero-art" aria-label="People supported by Udyog-Saarthi">
          <div className="image-panel">
            <img src="/images/face_man.png" alt="Young entrepreneur" className="hero-man" />
            <img src="/images/face_grandmother.png" alt="Rural entrepreneur" className="hero-grandmother" />
            <img src="/images/face_woman.png" alt="Woman entrepreneur" className="hero-woman" />
          </div>
        </div>
      </section>

      <section className="work-section" id="how-it-works">
        <div className="section-heading">
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
          <h2>Need Phone Guidance in your language?</h2>
        </div>
        <div className="phone-card">
          <a href="tel:+918983172377"><span aria-hidden="true">☎</span> +91 89831 72377</a>
          <span>Monday–Saturday<br /><small>0900–1900 hrs</small></span>
        </div>
      </section>

      <section className="backing" id="benefits">
        <div className="section-heading centered">
          <p className="supporting-label">Supporting rural entrepreneurship</p>
          <h2>Official Backing &amp; Concessional Credit</h2>
          <p>Empowering enterprise with reliable credit and local support.</p>
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
            <a className="brand" href="#top"><img src="/images/logo.png" alt="" className="brand-mark" /><span>UdyogSaarthi</span></a>
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
