import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Leaf,
  Waves,
  Database,
  Menu,
  X,
  MapPin,
  Activity,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

const verifiedProjects = [
  {
    name: "Mangrove Guardians",
    location: "Maharashtra, India",
    type: "Mangrove Restoration",
    progress: 82,
    carbon: "12,480 tCO₂e",
  },
  {
    name: "Blue Coast Revival",
    location: "Gujarat, India",
    type: "Mangrove Restoration",
    progress: 68,
    carbon: "8,920 tCO₂e",
  },
  {
    name: "Seagrass Revival Initiative",
    location: "Tamil Nadu, India",
    type: "Seagrass Restoration",
    progress: 74,
    carbon: "6,340 tCO₂e",
  },
];

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Register",
    description:
      "Organizations register restoration projects and establish the foundation for transparent monitoring.",
    data: "PROJECT DATA",
    signal: "Registry",
  },
  {
    number: "02",
    icon: Waves,
    title: "Submit Evidence",
    description:
      "Project teams provide evidence, location data, timestamps and environmental records.",
    data: "FIELD EVIDENCE",
    signal: "Evidence",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Verify",
    description:
      "Evidence is checked against project data to create a transparent verification record.",
    data: "VERIFICATION",
    signal: "MRV Engine",
  },
];
function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenu(false);

    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="blueguard-page">
      {/* Background decoration */}
      <div className="background-orb background-orb-one"></div>
      <div className="background-orb background-orb-two"></div>

      {/* NAVBAR */}
      <header
        className={`landing-navbar ${
          scrolled ? "landing-navbar-scrolled" : ""
        }`}
      >
        <div className="navbar-logo">
          <div className="logo-mark">
            <Leaf size={20} strokeWidth={2.2} />
          </div>

          <span>BlueGuard</span>
        </div>

        {/* Desktop navigation */}
        <nav className="desktop-nav">
          <button onClick={() => scrollToSection("home")}>Home</button>

          <button onClick={() => scrollToSection("projects")}>
            Projects
          </button>

          <button onClick={() => scrollToSection("how-it-works")}>
            How It Works
          </button>

          <button onClick={() => scrollToSection("about")}>About</button>
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="navbar-login">
            Organization Login
            <ArrowRight size={16} />
          </Link>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenu && (
          <div className="mobile-nav">
            <button onClick={() => scrollToSection("home")}>Home</button>

            <button onClick={() => scrollToSection("projects")}>
              Projects
            </button>

            <button onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>

            <button onClick={() => scrollToSection("about")}>About</button>

            <Link to="/login" onClick={() => setMobileMenu(false)}>
              Organization Login
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <main id="home">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="status-dot"></span>
              Blue Carbon Registry & MRV Platform
            </div>

            <h1>
              Verify before
              <span> you trust.</span>
            </h1>

            <p className="hero-description">
              BlueGuard brings transparency to blue-carbon restoration by
              connecting projects, evidence and verification into one
              trustworthy digital registry.
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="primary-button">
                Register Organization
                <ArrowRight size={18} />
              </Link>

              <button
                className="secondary-button"
                onClick={() => scrollToSection("projects")}
              >
                Explore Projects
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-avatars">
                <div className="trust-avatar">
                  <Leaf size={15} />
                </div>

                <div className="trust-avatar">
                  <Waves size={15} />
                </div>

                <div className="trust-avatar">
                  <ShieldCheck size={15} />
                </div>
              </div>

              <div>
                <strong>Built for transparent restoration</strong>
                <span>Mangrove & seagrass projects</span>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual">
            <div className="hero-glow"></div>

            <div className="ecosystem-card">
              <div className="ecosystem-header">
                <div>
                  <span className="small-label">LIVE ECOSYSTEM</span>
                  <h3>Blue Carbon Network</h3>
                </div>

                <div className="live-indicator">
                  <span></span>
                  Live
                </div>
              </div>

              <div className="ecosystem-map">
                <div className="map-grid"></div>

                <div className="map-line map-line-one"></div>
                <div className="map-line map-line-two"></div>
                <div className="map-line map-line-three"></div>

                <div className="map-node node-one">
                  <span></span>
                </div>

                <div className="map-node node-two">
                  <span></span>
                </div>

                <div className="map-node node-three">
                  <span></span>
                </div>

                <div className="map-node node-four">
                  <span></span>
                </div>

                <div className="map-center">
                  <Leaf size={25} />
                </div>
              </div>

              <div className="ecosystem-stats">
                <div>
                  <span>Projects</span>
                  <strong>24</strong>
                </div>

                <div>
                  <span>Verified</span>
                  <strong>18</strong>
                </div>

                <div>
                  <span>Impact</span>
                  <strong>42.8K</strong>
                </div>
              </div>
            </div>

            <div className="floating-card verification-card">
              <div className="floating-icon verified-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <span>Verification</span>
                <strong>Verified Record</strong>
              </div>
            </div>

            <div className="floating-card monitoring-card">
              <div className="floating-icon monitoring-icon">
                <Activity size={18} />
              </div>

              <div>
                <span>Monitoring</span>
                <strong>82% Progress</strong>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="trust-strip">
          <div className="trust-strip-item">
            <ShieldCheck size={20} />
            <div>
              <strong>Evidence Based</strong>
              <span>Transparent project records</span>
            </div>
          </div>

          <div className="trust-strip-divider"></div>

          <div className="trust-strip-item">
            <MapPin size={20} />
            <div>
              <strong>Location Verified</strong>
              <span>Project-level geographic data</span>
            </div>
          </div>

          <div className="trust-strip-divider"></div>

          <div className="trust-strip-item">
            <LockKeyhole size={20} />
            <div>
              <strong>Traceable</strong>
              <span>Clear verification history</span>
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="content-section projects-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">VERIFIED PROJECTS</span>

              <h2>
                Restoration you can
                <span> actually see.</span>
              </h2>
            </div>

            <p>
              Explore restoration projects and the evidence behind their
              environmental progress.
            </p>
          </div>

          <div className="projects-grid">
            {verifiedProjects.map((project, index) => (
              <div className="project-card" key={index}>
                <div className={`project-image project-image-${index + 1}`}>
                  <div className="project-image-overlay"></div>

                  <div className="project-type">
                    <Leaf size={13} />
                    {project.type}
                  </div>

                  <div className="verified-badge">
                    <CheckCircle2 size={14} />
                    Verified
                  </div>
                </div>

                <div className="project-card-content">
                  <div className="project-location">
                    <MapPin size={14} />
                    {project.location}
                  </div>

                  <h3>{project.name}</h3>

                  <div className="project-progress-header">
                    <span>Restoration progress</span>
                    <strong>{project.progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>

                  <div className="project-footer">
                    <span>Estimated carbon impact</span>
                    <strong>{project.carbon}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-button-wrapper">
            <Link to="/projects" className="outline-button">
              View All Projects
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="content-section process-section">
          <div className="section-heading centered">
            <span className="section-eyebrow">HOW IT WORKS</span>

            <h2>
              From restoration
              <span> to verification.</span>
            </h2>

            <p>
              BlueGuard creates a clear evidence trail from the moment a
              project is registered to the moment its activity is verified.
            </p>
          </div>

          <div className="steps-container">
  {steps.map((step, index) => {
    const Icon = step.icon;

    return (
      <React.Fragment key={step.number}>
        <div
          className="step-card animated-step-card"
          style={{
            "--step-delay": `${index * 180}ms`,
          }}
        >
          <div className="step-scan"></div>

          <div className="step-top">
            <span className="step-number">{step.number}</span>

            <div className="step-icon">
              <Icon size={22} />
              <span className="step-icon-pulse"></span>
            </div>
          </div>

          <div className="step-status">
            <span className="status-dot"></span>
            ACTIVE PROCESS
          </div>

          <h3>{step.title}</h3>

          <p>{step.description}</p>

          <div className="step-data">
            <span>{step.data}</span>

            <div className="step-data-line">
              <span className="data-particle"></span>
            </div>

            <strong>{step.signal}</strong>
          </div>
        </div>

        {index < steps.length - 1 && (
          <div
            className="step-connector animated-step-connector"
            style={{
              "--connector-delay": `${index * 180 + 220}ms`,
            }}
          >
            <div className="connector-line"></div>

            <div className="connector-particle">
              <span></span>
            </div>

            <ArrowRight size={18} />
          </div>
        )}
      </React.Fragment>
    );
  })}
</div>
        </section>

        {/* ABOUT */}
        <section id="about" className="content-section about-section">
          <div className="about-visual">
            <div className="about-circle circle-one"></div>
            <div className="about-circle circle-two"></div>

            <div className="about-core">
              <Leaf size={42} />
              <span>BLUEGUARD</span>
              <small>Verify Before You Trust</small>
            </div>

            <div className="about-floating about-floating-one">
              <ShieldCheck size={17} />
              <span>Transparent</span>
            </div>

            <div className="about-floating about-floating-two">
              <Waves size={17} />
              <span>Blue Carbon</span>
            </div>
          </div>

          <div className="about-content">
            <span className="section-eyebrow">ABOUT BLUEGUARD</span>

            <h2>
              Making environmental
              <span> impact easier to trust.</span>
            </h2>

            <p>
              BlueGuard is a blockchain-oriented Blue Carbon Registry and MRV
              platform designed to make restoration activity more transparent.
            </p>

            <p>
              Organizations can register projects, submit evidence, monitor
              environmental indicators and build a traceable verification
              history.
            </p>

            <div className="about-points">
              <div>
                <CheckCircle2 size={18} />
                <span>Project registration</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Evidence collection</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Verification workflow</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Environmental monitoring</span>
              </div>
            </div>

            <Link to="/login" className="primary-button about-button">
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <div className="navbar-logo">
            <div className="logo-mark">
              <Leaf size={19} />
            </div>

            <span>BlueGuard</span>
          </div>

          <p>Verify Before You Trust.</p>
        </div>

        <div className="footer-right">
          <span>BlueGuard • SIH Prototype</span>

          <span className="footer-dot"></span>

          <span>Blue Carbon Registry & MRV</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;