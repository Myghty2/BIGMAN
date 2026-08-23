import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logo_transparent.png";

// ── Logo (transparent mangrove marine emblem) ──
const LOGO_SRC = logoImg;

// ── Image URLs ───────────────────────────────────────────────────────────────
const IMGS = {
  hero: "https://images.unsplash.com/photo-1691178131861-039146c3a933?w=1800&h=1100&fit=crop&auto=format",
  mangroveCoast: "https://images.unsplash.com/photo-1774960693005-e6a8aafc3397?w=900&h=560&fit=crop&auto=format",
  mangroveBlue: "https://images.unsplash.com/photo-1767917921018-3f998847486f?w=1000&h=1200&fit=crop&auto=format",
  seagrass: "https://images.unsplash.com/photo-1629215833206-ba050a68cd65?w=900&h=560&fit=crop&auto=format",
  mangroveCanopy: "https://images.unsplash.com/photo-1527432219784-b12207e328c2?w=1200&h=800&fit=crop&auto=format",
  mangroveRoots: "https://images.unsplash.com/photo-1717292741426-d050f4f25503?w=900&h=700&fit=crop&auto=format",
  turquoiseSea: "https://images.unsplash.com/photo-1560364897-91578ff41817?w=900&h=700&fit=crop&auto=format",
  marshland: "https://images.unsplash.com/photo-1760526664194-fc5745a576ec?w=900&h=700&fit=crop&auto=format",
  aerialOcean: "https://images.unsplash.com/photo-1743004144286-bc05445c7f1a?w=1200&h=800&fit=crop&auto=format",
};

// ── Global styles (fonts, theme vars, keyframes, responsive rules) ──────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      :root {
        --color-navy: #0B2B33;
        --color-navy-dark: #071C21;
        --color-teal: #12545A;
        --color-teal-light: #1C7A78;
        --color-seagrass: #3F7D5C;
        --color-seagrass-bright: #5FBF8C;
        --color-sand: #F3EEE1;
        --color-sand-dark: #E7DEC7;
        --color-coral: #C46A3F;
        --color-foam: #F7F8F4;
        --color-ink: #0E2124;
        --font-serif: 'Lora', Georgia, serif;
        --font-sans: 'Inter', system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; font-family: var(--font-sans); background-color: var(--color-foam); color: var(--color-ink); -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes floatSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes pulseGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
      @keyframes marineOrganicFloat {
        0%, 100% {
          transform: translateY(0px) rotate(0deg) scale(1);
          filter: drop-shadow(0 6px 18px rgba(95, 191, 140, 0.4)) drop-shadow(0 0 12px rgba(28, 122, 120, 0.3));
        }
        33% {
          transform: translateY(-8px) rotate(-2deg) scale(1.04);
          filter: drop-shadow(0 14px 28px rgba(95, 191, 140, 0.65)) drop-shadow(0 0 24px rgba(95, 191, 140, 0.5));
        }
        66% {
          transform: translateY(-3px) rotate(1.8deg) scale(1.02);
          filter: drop-shadow(0 8px 22px rgba(28, 122, 120, 0.5)) drop-shadow(0 0 16px rgba(63, 125, 92, 0.45));
        }
      }
      @keyframes logoAuraPulse {
        0%, 100% {
          transform: scale(0.92);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.22);
          opacity: 0.7;
        }
      }

      .nav-link { position: relative; color: #9BB5BA; transition: color 0.2s; font-size: 0.875rem; font-weight: 500; letter-spacing: 0.02em; text-decoration: none; }
      .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px; background: var(--color-teal-light); transition: width 0.25s; }
      .nav-link:hover { color: #F7F8F4; }
      .nav-link:hover::after { width: 100%; }

      .stat-frame { background: #fff; border: 1px solid var(--color-sand-dark); border-radius: 18px; padding: 28px 20px 24px; transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease; }
      .stat-frame:hover { box-shadow: 0 14px 40px rgba(11,43,51,0.12); transform: translateY(-3px); border-color: rgba(28,122,120,0.35); }
      .stat-icon-badge { width: 40px; height: 40px; border-radius: 11px; background: rgba(28,122,120,0.1); border: 1px solid rgba(28,122,120,0.22); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }

      .flow-step { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; flex: 1; min-width: 150px; position: relative; z-index: 2; }
      .step-num { width: 52px; height: 52px; border-radius: 50%; background: var(--color-teal); color: #fff; font-family: var(--font-mono); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: center; border: 2px solid var(--color-teal-light); flex-shrink: 0; transition: background 0.25s, transform 0.25s; }
      .flow-step:hover .step-num { background: var(--color-teal-light); transform: scale(1.08); }
      .workflow-row { position: relative; display: flex; gap: 8px; align-items: flex-start; justify-content: space-between; }
      .workflow-line { position: absolute; top: 26px; left: 8%; right: 8%; height: 2px; background: linear-gradient(90deg, rgba(28,122,120,0), rgba(28,122,120,0.55) 12%, rgba(28,122,120,0.55) 88%, rgba(28,122,120,0)); z-index: 1; }

      .pillar-card { background: rgba(255,255,255,0.7); border: 1px solid var(--color-sand-dark); border-radius: 14px; padding: 20px; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; }
      .pillar-card:hover { box-shadow: 0 10px 30px rgba(11,43,51,0.1); transform: translateY(-2px); border-color: rgba(28,122,120,0.3); }

      .mobile-menu { display: none; flex-direction: column; gap: 4px; background: var(--color-navy); border-top: 1px solid rgba(255,255,255,0.08); padding: 16px 24px; }
      .mobile-menu.open { display: flex; }

      @media (max-width: 900px) {
        .nav-desktop { display: none !important; }
        .nav-mobile-btn { display: flex !important; }
        .hero-caps { flex-wrap: wrap !important; }
        .hero-users { flex-wrap: wrap !important; gap: 24px !important; }
        .split-section { grid-template-columns: 1fr !important; }
        .about-grid { grid-template-columns: 1fr !important; }
        .about-image { min-height: 320px !important; order: -1; }
        .workflow-row { flex-direction: column; align-items: stretch; gap: 28px !important; }
        .workflow-line { display: none; }
        .flow-step { flex-direction: row !important; text-align: left !important; gap: 18px !important; }
        .hero-glass { padding: 48px 36px 38px !important; border-radius: 28px !important; }
      }
      @media (max-width: 640px) {
        .cap-badge { white-space: normal; }
        .hero-glass { padding: 36px 20px 28px !important; border-radius: 22px !important; }
      }
    `}</style>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon({ color = "#3F7D5C", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
function IconSvg({ path, size = 20, color = "#1C7A78", strokeWidth = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const PATHS = {
  map: "M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zm0-13v13m6-16v13",
  shieldCheck: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  satellite: "M5 13l4 4L20 6M8.5 3.5L12 7l-4 4-3.5-3.5a2 2 0 010-2.83l1.17-1.17a2 2 0 012.83 0zM16 12l4 4-4 4-3.5-3.5",
  link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  register: "M12 4v16m8-8H4",
  scan: "M4 7V5a2 2 0 012-2h2M4 17v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M8 12h8",
  brain: "M9.5 3a3.5 3.5 0 00-3.5 3.5v1A3.5 3.5 0 003 11a3.5 3.5 0 003 3.44V16a3.5 3.5 0 003.5 3.5m0-16.5a3.5 3.5 0 013.5 3.5v1a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.44V16a3.5 3.5 0 01-3.5 3.5m0-16.5v16.5",
  chainLink: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  coin: "M12 8v8m-3-5h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  flask: "M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 005.8 21h12.4a1.5 1.5 0 001.3-2.5L14 9V3",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useOnScreen(ref, rootMargin = "0px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3, rootMargin }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return visible;
}

function useCountUp(target, decimals, active, duration = 1400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let raf;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value);
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];
  return (
    <header style={{ background: "rgba(7,28,33,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <img src={LOGO_SRC} alt="BlueGuard logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1.2rem", color: "#F7F8F4", letterSpacing: "-0.02em" }}>BlueGuard</span>
        </Link>

        <nav style={{ display: "flex", gap: 32, alignItems: "center" }} className="nav-desktop">
          {links.map(l => (
            <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="nav-desktop">
          <Link to="/login" style={{ color: "#7AAAB1", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F7F8F4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#7AAAB1")}>Login</Link>
          <Link to="/login" style={{ background: "#1C7A78", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", transition: "background 0.2s, box-shadow 0.2s", boxShadow: "0 2px 12px rgba(28,122,120,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#12545A"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1C7A78"; }}>Get Started</Link>
        </div>

        <button className="nav-mobile-btn hidden" onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#F7F8F4", display: "none" }}>
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        {links.map(l => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ color: "#9BB5BA", padding: "10px 0", fontSize: "0.9rem", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{l.label}</a>
        ))}
        <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
          <Link to="/login" style={{ color: "#9BB5BA", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>Login</Link>
          <Link to="/login" style={{ background: "#1C7A78", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>Get Started</Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const caps = [
    { icon: PATHS.shieldCheck, label: "Verified Evidence" },
    { icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1", label: "AI + Satellite Validation" },
    { icon: PATHS.link, label: "Blockchain Integrity" },
    { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Continuous Monitoring" },
  ];
  const users = [
    { icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9", label: "Government\nRegulators" },
    { icon: PATHS.users, label: "Field Workers\n& NGOs" },
    { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Auditors &\nResearchers" },
    { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Corporates &\nInvestors" },
  ];

  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: "94vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {/* Full-bleed hero image, treated for legibility while staying vivid at the edges */}
      <div style={{ position: "absolute", inset: 0, background: "#071C21" }}>
        <img
          src={IMGS.hero}
          alt="Aerial heart-shaped lagoon surrounded by lush mangrove forest"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", filter: "brightness(0.9) saturate(1.25) contrast(1.05)" }}
        />
        {/* Teal-tinted brand wash instead of flat black, keeps the greens */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,28,33,0.55) 0%, rgba(11,43,51,0.35) 30%, rgba(7,28,33,0.5) 65%, rgba(7,28,33,0.92) 100%)" }} />
        {/* Focused vignette so the reading area is always darkest */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 62% 58% at 50% 46%, rgba(6,20,24,0.62) 0%, rgba(6,20,24,0.15) 60%, rgba(6,20,24,0) 100%)" }} />
      </div>

      <div style={{ position: "relative", maxWidth: 1040, margin: "0 auto", padding: "100px 24px 76px", textAlign: "center" }}>

        {/* Glass panel wraps the core message for strong contrast against the busy photo */}
        <div className="hero-glass" style={{
          background: "linear-gradient(180deg, rgba(7,28,33,0.56) 0%, rgba(7,28,33,0.76) 100%)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 36,
          padding: "68px 76px 54px",
          boxShadow: "0 35px 110px -15px rgba(0,0,0,0.6), 0 0 60px -10px rgba(95,191,140,0.22), inset 0 1px 1px 0 rgba(255,255,255,0.18)",
          animation: "fadeUp 0.8s ease both",
        }}>
          {/* Wordmark with Realistic Organic Logo Animation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 22 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Organic marine luminous aura glow ring */}
              <div style={{
                position: "absolute",
                inset: "-10px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(95,191,140,0.48) 0%, rgba(28,122,120,0.18) 60%, transparent 80%)",
                filter: "blur(10px)",
                animation: "logoAuraPulse 4.5s ease-in-out infinite",
                pointerEvents: "none",
              }} />
              <img
                src={LOGO_SRC}
                alt="BlueGuard logo"
                style={{
                  position: "relative",
                  width: 74,
                  height: 74,
                  objectFit: "contain",
                  animation: "marineOrganicFloat 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
                  willChange: "transform, filter",
                }}
              />
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(3.1rem, 8.2vw, 5.5rem)", color: "#F7F8F4", letterSpacing: "-0.04em", lineHeight: 1, margin: 0, textShadow: "0 8px 36px rgba(0,0,0,0.45)" }}>BlueGuard</h1>
          </div>

          {/* Tagline */}
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600, fontSize: "clamp(1.35rem, 3.2vw, 2.1rem)", color: "#7FD9A8", letterSpacing: "-0.01em", marginBottom: 24 }}>
            "Verify Before You Trust"
          </p>

          <p style={{ fontSize: "1.1rem", color: "rgba(225,238,240,0.94)", lineHeight: 1.85, maxWidth: 680, margin: "0 auto 40px" }}>
            A blockchain-anchored platform for registering, monitoring, and verifying blue carbon
            restoration projects, from mangrove coastlines to seagrass meadows, with satellite
            intelligence and immutable on-chain records.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link to="/login" style={{ background: "linear-gradient(135deg, #1C7A78 0%, #12545A 100%)", color: "#fff", borderRadius: 12, padding: "14px 32px", fontWeight: 600, fontSize: "0.98rem", textDecoration: "none", boxShadow: "0 6px 28px rgba(28,122,120,0.55), inset 0 1px 1px rgba(255,255,255,0.2)", transition: "all 0.25s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 34px rgba(28,122,120,0.7), inset 0 1px 1px rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(28,122,120,0.55), inset 0 1px 1px rgba(255,255,255,0.2)"; }}>
              Register a Project
            </Link>
            <Link to="/login" style={{ background: "rgba(255,255,255,0.08)", color: "#DCE8E9", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 12, padding: "14px 32px", fontWeight: 500, fontSize: "0.98rem", textDecoration: "none", transition: "all 0.25s ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}>
              Explore the Platform
            </Link>
          </div>
        </div>

        {/* Capability badges */}
        <div className="hero-caps" style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 44, marginBottom: 56, flexWrap: "wrap" }}>
          {caps.map(c => (
            <div key={c.label} className="cap-badge" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(7,28,33,0.65)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "11px 18px", fontSize: "0.82rem", fontWeight: 500, color: "#CFE1E3", whiteSpace: "nowrap" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5FBF8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
              {c.label}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 36 }} />

        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8FB4BB", marginBottom: 24 }}>Built for</p>
        <div className="hero-users" style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          {users.map(u => (
            <div key={u.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(28,122,120,0.18)", border: "1px solid rgba(95,191,140,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5FBF8C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={u.icon} /></svg>
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.73rem", color: "#B8CDD0", fontWeight: 500, whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.45 }}>{u.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: "relative", margin: "0 auto", bottom: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.45, paddingBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#7AAAB1" }}>scroll</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7AAAB1" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
      </div>
    </section>
  );
}

// ── Photo Mosaic Band ─────────────────────────────────────────────────────────
function PhotoBand() {
  const photos = [
    { src: IMGS.mangroveCanopy, alt: "Aerial view of mangrove canopy", label: "Mangrove canopy, SE Asia" },
    { src: IMGS.mangroveRoots, alt: "Underwater mangrove roots", label: "Submerged root systems" },
    { src: IMGS.turquoiseSea, alt: "Clear turquoise water with sunlight", label: "Seagrass bed, Indian Ocean" },
    { src: IMGS.marshland, alt: "Winding river through golden marshland", label: "Coastal wetland delta" },
  ];
  return (
    <section style={{ background: "#0B2B33", padding: "0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", height: 280 }}>
        {photos.map((p, i) => (
          <div key={p.src} style={{ position: "relative", overflow: "hidden", background: "#071C21" }}>
            <img src={p.src} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease", display: "block" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(7,28,33,0.72) 0%, transparent 60%)" }} />
            <span style={{ position: "absolute", bottom: 14, left: 14, fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(183,205,208,0.8)" }}>{p.label}</span>
            <div style={{ position: "absolute", top: 12, right: 12, fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#1C7A78", letterSpacing: "0.06em" }}>0{i + 1}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Stats Banner (framed + scroll-triggered count-up) ────────────────────────
function StatCard({ stat }) {
  const ref = useRef(null);
  const visible = useOnScreen(ref, "-60px");
  const match = stat.value.match(/^([\d.]+)([A-Za-z]*)$/);
  const numeric = match ? parseFloat(match[1]) : 0;
  const suffixLetter = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? 1 : 0;
  const displayNum = useCountUp(numeric, decimals, visible);

  return (
    <div
      ref={ref}
      className="stat-frame"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        textAlign: "center",
      }}
    >
      <div className="stat-icon-badge">
        <IconSvg path={stat.icon} size={19} color="#1C7A78" />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "2.3rem", color: "#0B2B33", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
          {displayNum}{suffixLetter}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#1C7A78", fontWeight: 500 }}>{stat.unit}</span>
      </div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "#6A9099", marginTop: 6, fontWeight: 500 }}>{stat.label}</p>
    </div>
  );
}

function StatsBanner() {
  const stats = [
    { value: "2.4M", unit: "ha", label: "Registered site area", icon: PATHS.map },
    { value: "187", unit: "k tCO₂e", label: "Credits verified on-chain", icon: PATHS.shieldCheck },
    { value: "94", unit: "%", label: "Satellite cross-match accuracy", icon: PATHS.satellite },
    { value: "12", unit: "chains", label: "Blockchain anchors active", icon: PATHS.link },
  ];
  return (
    <section style={{ background: "#F3EEE1", borderTop: "1px solid #E7DEC7", borderBottom: "1px solid #E7DEC7", padding: "56px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 22 }}>
        {stats.map(s => <StatCard key={s.label} stat={s} />)}
      </div>
    </section>
  );
}

// ── Current Projects ──────────────────────────────────────────────────────────
const PROJECTS = [
  {
    type: "Mangrove Restoration",
    verified: true,
    img: "https://images.unsplash.com/photo-1774960693005-e6a8aafc3397?w=900&h=420&fit=crop&auto=format",
    location: "Maharashtra, India",
    name: "Mangrove Guardians",
    progress: 82,
    carbon: "12,480",
  },
  {
    type: "Mangrove Restoration",
    verified: true,
    img: "https://images.unsplash.com/photo-1767917921018-3f998847486f?w=900&h=420&fit=crop&auto=format",
    location: "Gujarat, India",
    name: "Blue Coast Revival",
    progress: 68,
    carbon: "8,920",
  },
  {
    type: "Seagrass Restoration",
    verified: true,
    img: "https://images.unsplash.com/photo-1629215833206-ba050a68cd65?w=900&h=420&fit=crop&auto=format",
    location: "Tamil Nadu, India",
    name: "Seagrass Revival Initiative",
    progress: 74,
    carbon: "6,340",
  },
];

function Features() {
  return (
    <section id="features" style={{ background: "#F7F8F4", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 52 }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#1C7A78", marginBottom: 10 }}>On-chain registry</p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 2.75rem)", color: "#0B2B33", letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 10px" }}>
              Restoration you can<br /><span style={{ color: "#1C7A78" }}>actually see.</span>
            </h2>
            <p style={{ color: "#6A9099", fontSize: "1rem", maxWidth: 480, lineHeight: 1.7, margin: 0 }}>
              Every project on BlueGuard is satellite-verified and blockchain-anchored. Browse live sites and their numbers.
            </p>
          </div>
        </div>

        {/* Project cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {PROJECTS.map(p => (
            <div key={p.name}
              style={{ background: "#fff", border: "1px solid #E7DEC7", borderRadius: 16, overflow: "hidden", transition: "box-shadow 0.25s, transform 0.25s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(11,43,51,0.13)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              {/* Photo */}
              <div style={{ position: "relative", height: 200, overflow: "hidden", background: "#0B2B33" }}>
                <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                {/* Tags row */}
                <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", borderRadius: 100, padding: "4px 11px", fontSize: "0.68rem", fontWeight: 600, color: "#0B2B33", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    <img src={LOGO_SRC} alt="" style={{ width: 11, height: 11, objectFit: "contain" }} />
                    {p.type}
                  </span>
                  {p.verified && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#1C7A78", borderRadius: 100, padding: "4px 11px", fontSize: "0.68rem", fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>
                      <CheckIcon color="#fff" size={11} />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "22px 22px 24px" }}>
                {/* Location */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6A9099" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={{ fontSize: "0.78rem", color: "#6A9099", fontWeight: 500 }}>{p.location}</span>
                </div>

                {/* Name */}
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1.25rem", color: "#0B2B33", letterSpacing: "-0.01em", margin: "0 0 18px" }}>{p.name}</h3>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: "#6A9099", fontWeight: 500 }}>Restoration progress</span>
                    <span style={{ fontSize: "0.78rem", color: "#0B2B33", fontWeight: 700 }}>{p.progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#E7DEC7", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.progress}%`, background: "linear-gradient(90deg, #1C7A78, #3F7D5C)", borderRadius: 100, transition: "width 0.6s ease" }} />
                  </div>
                </div>

                {/* Carbon impact */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#6A9099" }}>Estimated carbon impact</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.92rem", fontWeight: 600, color: "#C46A3F" }}>
                    {p.carbon} <span style={{ fontSize: "0.72rem" }}>tCO₂e</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #0B2B33", borderRadius: 100, padding: "13px 32px", fontSize: "0.9rem", fontWeight: 600, color: "#0B2B33", textDecoration: "none", transition: "background 0.2s, color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0B2B33"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0B2B33"; }}>
            View All Projects →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Workflow / How It Works ────────────────────────────────────────────────────
function Workflow() {
  const steps = [
    { n: "01", title: "Register the Site", desc: "Field teams submit GPS boundaries, species mix, and baseline photos for a mangrove or seagrass site.", icon: PATHS.register },
    { n: "02", title: "Satellite Monitoring", desc: "Google Earth Engine pulls a fresh pass every 5 days and tracks NDVI canopy change automatically.", icon: PATHS.satellite },
    { n: "03", title: "AI Cross-Verification", desc: "Biomass models cross-match satellite signal against field evidence and flag anomalies for review.", icon: PATHS.brain },
    { n: "04", title: "Blockchain Anchoring", desc: "Every verified evidence bundle is hashed and anchored on-chain, immutable and publicly auditable.", icon: PATHS.chainLink },
    { n: "05", title: "Credits Issued", desc: "Verified carbon credits are minted to the registry, ready to trade, retire, or report against.", icon: PATHS.coin },
  ];
  return (
    <section id="how-it-works" style={{ background: "#0B2B33", padding: "104px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 68px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5FBF8C", marginBottom: 14 }}>Process</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 2.75rem)", color: "#F7F8F4", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 14px" }}>
            How a claim becomes<br />a verified credit.
          </h2>
          <p style={{ color: "#7AAAB1", fontSize: "1rem", lineHeight: 1.7, margin: 0 }}>
            Five checkpoints stand between a planting claim and a tradable credit, every one of them logged and auditable.
          </p>
        </div>

        <div className="workflow-row">
          <div className="workflow-line" />
          {steps.map(s => (
            <div key={s.n} className="flow-step">
              <div className="step-num">{s.n}</div>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1.05rem", color: "#F7F8F4", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#8FB4BB", lineHeight: 1.65, margin: 0, maxWidth: 220 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── About Us ───────────────────────────────────────────────────────────────────
function About() {
  const pillars = [
    { title: "Radical Transparency", desc: "Every hectare, scan, and credit traces back to raw satellite and field evidence with no black boxes.", icon: PATHS.eye },
    { title: "Science-First", desc: "Biomass and carbon models are peer-reviewed and validated against real government and NGO field data.", icon: PATHS.flask },
    { title: "Built With Field Teams", desc: "Designed alongside the NGOs and coastal communities doing the planting, so it fits real fieldwork.", icon: PATHS.users },
    { title: "Immutable By Design", desc: "Once anchored on-chain, a verification record can be audited by anyone, forever with no retroactive edits.", icon: PATHS.lock },
  ];
  return (
    <section id="about" style={{ background: "#F7F8F4", padding: "104px 0" }}>
      <div className="about-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 64, alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#1C7A78", marginBottom: 14 }}>About BlueGuard</p>
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", color: "#0B2B33", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 20px" }}>
            Built because blue carbon claims were too easy to fake.
          </h2>
          <p style={{ color: "#54767D", fontSize: "0.98rem", lineHeight: 1.8, margin: "0 0 16px" }}>
            Mangroves and seagrass meadows store carbon many times faster than land forests, but
            self-reported restoration numbers were routinely inflated, and buyers had no way to check.
            BlueGuard was built to close that gap.
          </p>
          <p style={{ color: "#54767D", fontSize: "0.98rem", lineHeight: 1.8, margin: "0 0 36px" }}>
            We pair satellite intelligence with on-the-ground evidence and anchor every verified
            claim on-chain, so regulators, investors, and communities can all trust the same number.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {pillars.map(p => (
              <div key={p.title} className="pillar-card">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(28,122,120,0.1)", border: "1px solid rgba(28,122,120,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <IconSvg path={p.icon} size={17} color="#1C7A78" strokeWidth={1.8} />
                </div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "0.92rem", color: "#0B2B33", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{p.title}</h4>
                <p style={{ fontSize: "0.78rem", color: "#6A9099", lineHeight: 1.55, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-image" style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 520, background: "#0B2B33" }}>
          <img src={IMGS.mangroveBlue} alt="Lush mangrove forest meeting turquoise water from above" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(7,28,33,0.75) 0%, transparent 45%)" }} />
          <div style={{ position: "absolute", bottom: 28, left: 28, right: 28, background: "rgba(7,28,33,0.82)", backdropFilter: "blur(8px)", border: "1px solid rgba(95,191,140,0.25)", borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5FBF8C", marginBottom: 6 }}>Since day one</div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "#F7F8F4", margin: 0, lineHeight: 1.5 }}>
              Field-verified before it was on-chain, now the two happen together.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Immersive Split Section ────────────────────────────────────────────────────
function ImmersiveSplit() {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 480 }} className="split-section">
      {/* Image half */}
      <div style={{ position: "relative", background: "#071C21", overflow: "hidden", minHeight: 340 }}>
        <img src={IMGS.aerialOcean} alt="Aerial view of lush mangrove forest meeting ocean" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 60%, rgba(11,43,51,0.6) 100%)" }} />
        {/* Overlaid stat */}
        <div style={{ position: "absolute", bottom: 32, left: 32, background: "rgba(7,28,33,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(28,122,120,0.3)", borderRadius: 12, padding: "16px 22px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3F7D5C", marginBottom: 4 }}>Latest verification</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#F7F8F4", letterSpacing: "-0.02em" }}>12,480 tCO₂e</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "#4A7A82", marginTop: 2 }}>Mekong Delta · Block #18,432,917</div>
        </div>
      </div>
      {/* Text half */}
      <div style={{ background: "#0B2B33", display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 56px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#3F7D5C", marginBottom: 16 }}>Field to chain</p>
        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "clamp(1.7rem, 3vw, 2.5rem)", color: "#F7F8F4", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 20 }}>
          Every mangrove counted.<br />Every claim verified.
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#7AAAB1", lineHeight: 1.8, maxWidth: 440, marginBottom: 32 }}>
          BlueGuard combines satellite imagery from Google Earth Engine with AI-driven biomass
          models and cryptographic proof so no restoration claim goes unverified, and no
          carbon credit goes unchallenged.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["Satellite pass every 5 days per site", "NDVI change detection triggers automatic review", "On-chain hash anchors every evidence bundle"].map(t => (
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

// ── CTA Band ──────────────────────────────────────────────────────────────────
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
        <Link to="/login" style={{ background: "#fff", color: "#12545A", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", transition: "transform 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
          Create Account →
        </Link>
        <Link to="/login" style={{ background: "rgba(0,0,0,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "13px 28px", fontWeight: 500, fontSize: "0.95rem", textDecoration: "none", transition: "background 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}>
          Sign In / Request Demo →
        </Link>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];
  return (
    <footer style={{ background: "#0B2B33", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={LOGO_SRC} alt="BlueGuard logo" style={{ width: 24, height: 24, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1.15rem", color: "#F7F8F4", letterSpacing: "-0.02em" }}>BlueGuard</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {links.map(l => <a key={l.label} href={l.href} className="nav-link">{l.label}</a>)}
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.1em", color: "#3A6570", textTransform: "uppercase" }}>Verify Before You Trust</p>
        <p style={{ fontSize: "0.8rem", color: "#2E5E6A", marginTop: 6 }}>© 2024 BlueGuard. Blockchain-Based Blue Carbon Registry & MRV System.</p>
      </div>
    </footer>
  );
}

// ── App / Landing Component ──────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "#F7F8F4" }}>
      <GlobalStyles />
      <Nav />
      <Hero />
      <PhotoBand />
      <StatsBanner />
      <Features />
      <Workflow />
      <About />
      <ImmersiveSplit />
      <CTABand />
      <Footer />
    </div>
  );
}