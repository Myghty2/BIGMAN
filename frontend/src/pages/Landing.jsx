import React, { useState } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Imagery                                                             */
/* ------------------------------------------------------------------ */

const IMGS = {
  aerialMangrove: "https://images.unsplash.com/photo-1771985239333-cbf2ab43f566?w=1600&h=900&fit=crop&auto=format",
  mangroveCanopy: "https://images.unsplash.com/photo-1527432219784-b12207e328c2?w=1200&h=800&fit=crop&auto=format",
  mangroveRoots: "https://images.unsplash.com/photo-1717292741426-d050f4f25503?w=900&h=700&fit=crop&auto=format",
  turquoiseSea: "https://images.unsplash.com/photo-1560364897-91578ff41817?w=900&h=700&fit=crop&auto=format",
  aerialOcean: "https://images.unsplash.com/photo-1743004144286-bc05445c7f1a?w=1200&h=800&fit=crop&auto=format",
  marshland: "https://images.unsplash.com/photo-1760526664194-fc5745a576ec?w=900&h=700&fit=crop&auto=format",
};

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

function CheckIcon({ color = "#3F7D5C" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Nav                                                                  */
/* ------------------------------------------------------------------ */

function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ];
  return (
    <header style={{ background: "#f7f8f4", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: "1.2rem", color: "#F7F8F4", letterSpacing: "-0.02em" }}>BlueGuard</span>
        </a>

        <nav style={{ display: "flex", gap: 32, alignItems: "center" }} className="nav-desktop">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="nav-desktop">
          <Link
            to="/login"
            style={{ color: "#7AAAB1", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F7F8F4")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#7AAAB1")}
          >
            Login
          </Link>
          <Link
            to="/login"
            style={{ background: "#1C7A78", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", transition: "background 0.2s, box-shadow 0.2s", boxShadow: "0 2px 12px rgba(28,122,120,0.35)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#12545A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1C7A78"; }}
          >
            Get Started
          </Link>
        </div>

        <button className="nav-mobile-btn hidden" onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#F7F8F4" }}>
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        {links.map((l) => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ color: "#9BB5BA", padding: "10px 0", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {l.label}
          </a>
        ))}
        <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
          <Link to="/login" onClick={() => setOpen(false)} style={{ color: "#9BB5BA", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>Login</Link>
          <Link to="/login" onClick={() => setOpen(false)} style={{ background: "#1C7A78", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>Get Started</Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const caps = [
    { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Verified Evidence", description: "Trace every claim to its source" },
    { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1", label: "AI + Satellite Validation", description: "See real change from above" },
    { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", label: "Blockchain Integrity", description: "Trust records that cannot be altered" },
    { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Continuous Monitoring", description: "Stay informed as your site evolves" },
  ];
  const users = [
    { icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9", label: "Government\nRegulators", description: "Review with confidence" },
    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "Field Workers\n& NGOs", description: "Share progress simply" },
    { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Auditors &\nResearchers", description: "Explore trusted data" },
    { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Corporates &\nInvestors", description: "Fund measurable impact" },
  ];

  return (
    <section className="blueguard-hero" style={{ position: "relative", overflow: "hidden", minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "#071C21" }}>
        <img
          src={IMGS.aerialMangrove}
          alt="Aerial view of mangrove forest bordering dark coastal water"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, objectPosition: "center 30%" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, rgba(7,28,33,0.95) 0%, rgba(11,43,51,0.82) 50%, rgba(7,28,33,0.96) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(28,122,120,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="hero-shell" style={{ position: "relative", maxWidth: 980, width: "100%", margin: "0 auto", padding: "88px 24px 76px", textAlign: "center" }}>
        <div className="hero-eyebrow">
          <span className="hero-live-dot" />
          Real restoration deserves real proof
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <h1 className="hero-title" style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: "clamp(3rem, 8vw, 5.5rem)", color: "#F7F8F4", letterSpacing: "-0.04em", lineHeight: 1, margin: 0 }}>BlueGuard</h1>
        </div>

        <p className="hero-tagline" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(1.4rem, 3.5vw, 2.1rem)", color: "#88C49B", letterSpacing: "-0.01em", marginBottom: 14 }}>
          "Verify Before You Trust"
        </p>

        <p className="hero-description">
          From the people restoring coastlines to the people funding them, BlueGuard turns
          complex field data into clear, trustworthy proof everyone can understand.
        </p>

        <div className="hero-actions" style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 50, flexWrap: "wrap" }}>
          <Link
            to="/login"
            className="hero-primary-action"
          >
            Start Your Project <span aria-hidden="true">→</span>
          </Link>
          <a
            href="#how-it-works"
            className="hero-secondary-action"
          >
            See How It Works <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="hero-caps">
          {caps.map((c) => (
            <div key={c.label} className="cap-badge">
              <div className="cap-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8AD29F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
              </div>
              <div className="cap-copy">
                <span>{c.label}</span>
                <small>{c.description}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-divider" />

        <div className="hero-role-heading">
          <p>Built for the people behind real climate action</p>
          <span>Whatever your role, the evidence stays clear and accessible.</span>
        </div>
        <div className="hero-users">
          {users.map((u) => (
            <div key={u.label} className="hero-user-card">
              <div className="hero-user-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#48A6A1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={u.icon} /></svg>
              </div>
              <div className="hero-user-copy">
                <span>{u.label}</span>
                <small>{u.description}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Photo Mosaic Band                                                    */
/* ------------------------------------------------------------------ */

function PhotoBand() {
  const photos = [
    { src: IMGS.mangroveCanopy, alt: "Aerial view of mangrove canopy", label: "Mangrove canopy, SE Asia" },
    { src: IMGS.mangroveRoots, alt: "Underwater mangrove roots", label: "Submerged root systems" },
    { src: IMGS.turquoiseSea, alt: "Clear turquoise water with sunlight", label: "Seagrass bed, Indian Ocean" },
    { src: IMGS.marshland, alt: "Winding river through golden marshland", label: "Coastal wetland delta" },
  ];
  return (
    <section style={{ background: "#0B2B33", padding: 0 }}>
      <div className="photo-band" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", height: 280 }}>
        {photos.map((p, i) => (
          <div key={p.src} style={{ position: "relative", overflow: "hidden", background: "#071C21" }}>
            <img
              src={p.src}
              alt={p.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease", display: "block" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(7,28,33,0.72) 0%, transparent 60%)" }} />
            <span style={{ position: "absolute", bottom: 14, left: 14, fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(183,205,208,0.8)" }}>{p.label}</span>
            <div style={{ position: "absolute", top: 12, right: 12, fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#1C7A78", letterSpacing: "0.06em" }}>0{i + 1}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats Banner                                                         */
/* ------------------------------------------------------------------ */

function StatsBanner() {
  const stats = [
    { value: "2.4M", unit: "ha", label: "Registered site area" },
    { value: "187", unit: "k tCO₂e", label: "Credits verified on-chain" },
    { value: "94", unit: "%", label: "Satellite cross-match accuracy" },
    { value: "12", unit: "chains", label: "Blockchain anchors active" },
  ];
  return (
    <section style={{ background: "#F3EEE1", borderTop: "1px solid #E7DEC7", borderBottom: "1px solid #E7DEC7", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center" }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "2.4rem", color: "#0B2B33", letterSpacing: "-0.03em" }}>{s.value}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#1C7A78", fontWeight: 500 }}>{s.unit}</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "#6A9099", marginTop: 4, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                             */
/* ------------------------------------------------------------------ */

const FUNCS = [
  { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", title: "User Auth & Roles", desc: "Role-based access for regulators, field workers, auditors, and corporate partners with secure JWT authentication.", accent: "#1C7A78" },
  { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title: "Project Registration", desc: "Structured onboarding for mangrove and seagrass sites — GPS boundaries, ecosystem type, baseline biomass, and compliance metadata.", accent: "#1C7A78" },
  { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", title: "Evidence Submission", desc: "Upload geotagged photos, drone imagery, field measurements, and sensor data with IPFS content-addressed storage.", accent: "#3F7D5C" },
  { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1", title: "AI + Satellite Verification", desc: "Google Earth Engine NDVI analysis, OpenCV biomass estimation, and ML scoring cross-validated against submitted field data.", accent: "#3F7D5C" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Continuous Monitoring", desc: "Automated satellite passes on configurable intervals with anomaly detection for deforestation, bleaching, or encroachment events.", accent: "#1C7A78" },
  { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", title: "Blockchain Registry", desc: "Polygon smart contracts mint carbon credit NFTs for every verified project epoch. Immutable on-chain audit trail via Etherscan.", accent: "#12545A" },
  { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Reports & Export", desc: "Generate PDF and CSV audit reports compliant with Verra VCS and Gold Standard methodologies for regulatory submissions.", accent: "#3F7D5C" },
  { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", title: "Alerts & Notifications", desc: "Email and webhook alerts for verification milestones, anomaly flags, carbon credit issuance, and compliance deadlines.", accent: "#C46A3F" },
];

function Features() {
  return (
    <section id="features" style={{ background: "#F7F8F4", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#1C7A78", marginBottom: 10 }}>Platform capabilities</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 2.75rem)", color: "#0B2B33", letterSpacing: "-0.02em", maxWidth: 560, lineHeight: 1.2, margin: "0 0 12px" }}>Key Functionalities</h2>
          <p style={{ color: "#6A9099", fontSize: "1rem", maxWidth: 520, lineHeight: 1.75, margin: 0 }}>Every layer of the blue carbon lifecycle — from site registration to verified credit issuance — managed in one platform.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {FUNCS.map((f) => (
            <div key={f.title} className="func-card">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${f.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              </div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "1.05rem", color: "#0B2B33", letterSpacing: "-0.01em", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#6A9099", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Immersive Split Section                                              */
/* ------------------------------------------------------------------ */

function ImmersiveSplit() {
  return (
    <section id="how-it-works" className="split-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 480 }}>
      <div style={{ position: "relative", background: "#071C21", overflow: "hidden", minHeight: 340 }}>
        <img src={IMGS.aerialOcean} alt="Aerial view of lush mangrove forest meeting ocean" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 60%, rgba(11,43,51,0.6) 100%)" }} />
        <div style={{ position: "absolute", bottom: 32, left: 32, background: "rgba(7,28,33,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(28,122,120,0.3)", borderRadius: 12, padding: "16px 22px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3F7D5C", marginBottom: 4 }}>Latest verification</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#F7F8F4", letterSpacing: "-0.02em" }}>12,480 tCO₂e</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#4A7A82", marginTop: 2 }}>Mekong Delta · Block #18,432,917</div>
        </div>
      </div>
      <div style={{ background: "#0B2B33", display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 56px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#3F7D5C", marginBottom: 16 }}>Field to chain</p>
        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.7rem, 3vw, 2.5rem)", color: "#F7F8F4", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 20 }}>
          Every mangrove counted.<br />Every claim verified.
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#7AAAB1", lineHeight: 1.8, maxWidth: 440, marginBottom: 32 }}>
          BlueGuard combines satellite imagery from Google Earth Engine with AI-driven biomass
          models and cryptographic proof — so no restoration claim goes unverified, and no
          carbon credit goes unchallenged.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["Satellite pass every 5 days per site", "NDVI change detection triggers automatic review", "On-chain hash anchors every evidence bundle"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckIcon color="#3F7D5C" />
              <span style={{ fontSize: "0.875rem", color: "#9BB5BA", lineHeight: 1.6 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA Band                                                             */
/* ------------------------------------------------------------------ */

function CTABand() {
  return (
    <section style={{ background: "#1C7A78", padding: "64px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>Ready to get started?</p>
      <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.7rem, 4vw, 2.6rem)", color: "#fff", letterSpacing: "-0.02em", margin: "0 0 18px", lineHeight: 1.2 }}>
        Register your first blue carbon site today.
      </h2>
      <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.75 }}>
        Join field teams, regulators, and investors already using BlueGuard to verify and trust blue carbon claims.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        <Link
          to="/login"
          style={{ background: "#fff", color: "#12545A", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", transition: "transform 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          Create Account →
        </Link>
        <a
          href="#"
          style={{ background: "rgba(0,0,0,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "13px 28px", fontWeight: 500, fontSize: "0.95rem", textDecoration: "none", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
        >
          Request a Demo
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer style={{ background: "#0B2B33", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: "1.15rem", color: "#F7F8F4", letterSpacing: "-0.02em" }}>BlueGuard</span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.1em", color: "#7AAAB1", textTransform: "uppercase" }}>Verify Before You Trust</p>
        <p style={{ fontSize: "0.8rem", color: "#6A9099", marginTop: 6 }}>© 2024 BlueGuard. Blockchain-Based Blue Carbon Registry & MRV System.</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

function Landing() {
  return (
    <div className="blueguard-root" style={{ fontFamily: "var(--font-sans)", background: "#F7F8F4" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .blueguard-root {
          --color-navy: #0B2B33;
          --color-navy-dark: #071C21;
          --color-teal: #12545A;
          --color-teal-light: #1C7A78;
          --color-seagrass: #3F7D5C;
          --color-seagrass-dark: #2E5E44;
          --color-sand: #F3EEE1;
          --color-sand-dark: #E7DEC7;
          --color-coral: #C46A3F;
          --color-foam: #F7F8F4;
          --color-ink: #0E2124;
          --font-serif: 'Lora', Georgia, serif;
          --font-sans: 'Inter', system-ui, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        .blueguard-root * { box-sizing: border-box; }
        .blueguard-root { scroll-behavior: smooth; color: #0E2124; -webkit-font-smoothing: antialiased; }

        .blueguard-root ::-webkit-scrollbar { width: 6px; }
        .blueguard-root ::-webkit-scrollbar-track { background: transparent; }
        .blueguard-root ::-webkit-scrollbar-thumb { background: #1C7A78; border-radius: 3px; }

        .nav-link {
          position: relative;
          color: #9BB5BA;
          transition: color 0.2s;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-decoration: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #1C7A78;
          transition: width 0.25s;
        }
        .nav-link:hover { color: #F7F8F4; }
        .nav-link:hover::after { width: 100%; }

        .blueguard-hero::before,
        .blueguard-hero::after {
          content: '';
          position: absolute;
          z-index: 1;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          opacity: 0.16;
        }
        .blueguard-hero::before { top: 8%; left: -160px; background: #1C7A78; }
        .blueguard-hero::after { right: -170px; bottom: 8%; background: #3F7D5C; }
        .hero-shell { z-index: 2; }

        .hero-eyebrow {
          width: fit-content;
          margin: 0 auto 24px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid rgba(138,210,159,0.28);
          border-radius: 999px;
          background: rgba(7,28,33,0.58);
          backdrop-filter: blur(10px);
          color: #C9DEDA;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 8px 30px rgba(0,0,0,0.16);
        }
        .hero-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8AD29F;
          box-shadow: 0 0 0 0 rgba(138,210,159,0.55);
          animation: heroPulse 2.4s infinite;
        }
        .hero-title { text-shadow: 0 12px 48px rgba(0,0,0,0.38); }
        .hero-tagline { text-shadow: 0 0 28px rgba(138,210,159,0.22); }
        .hero-description {
          max-width: 650px;
          margin: 0 auto 30px;
          color: #BDD0D2;
          font-size: clamp(0.95rem, 1.7vw, 1.08rem);
          line-height: 1.75;
        }
        .hero-primary-action,
        .hero-secondary-action {
          min-width: 190px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 12px;
          padding: 14px 26px;
          font-size: 0.94rem;
          font-weight: 650;
          text-decoration: none;
          transition: transform 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .hero-primary-action {
          color: #fff;
          background: linear-gradient(135deg, #238E8B, #176A70);
          box-shadow: 0 10px 30px rgba(28,122,120,0.38);
        }
        .hero-secondary-action {
          color: #D5E5E6;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
        }
        .hero-primary-action:hover,
        .hero-secondary-action:hover { transform: translateY(-3px); }
        .hero-primary-action:hover { box-shadow: 0 14px 36px rgba(28,122,120,0.5); }
        .hero-secondary-action:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.34); }
        .hero-primary-action:focus-visible,
        .hero-secondary-action:focus-visible { outline: 3px solid rgba(138,210,159,0.55); outline-offset: 3px; }

        .hero-caps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 44px;
        }

        .cap-badge {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 78px;
          padding: 14px;
          text-align: left;
          background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.055));
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 14px;
          color: #E4EFF0;
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 26px rgba(0,0,0,0.13);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }
        .cap-badge:hover {
          transform: translateY(-4px);
          border-color: rgba(138,210,159,0.44);
          background: linear-gradient(145deg, rgba(255,255,255,0.16), rgba(28,122,120,0.12));
        }
        .cap-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(138,210,159,0.1);
          border: 1px solid rgba(138,210,159,0.19);
        }
        .cap-copy { display: flex; flex-direction: column; gap: 3px; }
        .cap-copy span { font-size: 0.76rem; font-weight: 650; line-height: 1.25; }
        .cap-copy small { color: #89A8AD; font-size: 0.65rem; line-height: 1.35; }

        .hero-divider {
          height: 1px;
          margin-bottom: 30px;
          background: linear-gradient(90deg, transparent, rgba(170,210,211,0.38), transparent);
        }
        .hero-role-heading { margin-bottom: 20px; }
        .hero-role-heading p {
          margin: 0 0 6px;
          color: #DCEAEC;
          font-size: 0.88rem;
          font-weight: 650;
        }
        .hero-role-heading span { color: #72969D; font-size: 0.76rem; }
        .hero-users {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .hero-user-card {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 76px;
          padding: 13px 14px;
          text-align: left;
          background: rgba(7,28,33,0.46);
          border: 1px solid rgba(72,166,161,0.27);
          border-radius: 14px;
          transition: transform 0.22s ease, background 0.22s ease, border-color 0.22s ease;
        }
        .hero-user-card:hover {
          transform: translateY(-3px);
          background: rgba(15,58,66,0.62);
          border-color: rgba(72,166,161,0.5);
        }
        .hero-user-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(28,122,120,0.22);
          border: 1px solid rgba(72,166,161,0.35);
        }
        .hero-user-copy { display: flex; flex-direction: column; gap: 3px; }
        .hero-user-copy span {
          color: #CDE0E2;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: pre-line;
          line-height: 1.3;
        }
        .hero-user-copy small { color: #6F969D; font-size: 0.63rem; line-height: 1.3; }

        @keyframes heroPulse {
          0% { box-shadow: 0 0 0 0 rgba(138,210,159,0.5); }
          65% { box-shadow: 0 0 0 8px rgba(138,210,159,0); }
          100% { box-shadow: 0 0 0 0 rgba(138,210,159,0); }
        }

        .func-card {
          background: #fff;
          border: 1px solid #E7DEC7;
          border-radius: 14px;
          padding: 28px 24px;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: default;
        }
        .func-card:hover {
          box-shadow: 0 8px 32px rgba(11,43,51,0.1);
          transform: translateY(-2px);
        }

        .mobile-menu {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: #0B2B33;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 16px 24px;
        }
        .mobile-menu.open { display: flex; }

        .nav-mobile-btn { display: none; }

        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .hero-caps, .hero-users { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .split-section { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 640px) {
          .hero-shell { padding: 70px 18px 58px !important; }
          .hero-eyebrow { font-size: 0.62rem; }
          .hero-description { font-size: 0.91rem; }
          .hero-actions { flex-direction: column; align-items: stretch; }
          .hero-primary-action, .hero-secondary-action { width: 100%; }
          .hero-caps, .hero-users { grid-template-columns: 1fr; }
          .cap-badge, .hero-user-card { min-height: 70px; }
          .photo-band { grid-template-columns: repeat(2, 1fr) !important; height: auto !important; }
          .photo-band > div { height: 200px; }
        }
      `}</style>

      <Nav />
      <Hero />
      <PhotoBand />
      <StatsBanner />
      <Features />
      <ImmersiveSplit />
      <CTABand />
      <Footer />
    </div>
  );
}

export default Landing;