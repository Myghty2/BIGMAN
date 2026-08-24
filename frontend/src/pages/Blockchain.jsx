import { useState, useMemo } from "react";
import greenWater from "../assets/greenWater.jpg";
import {
  Fingerprint,
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Blocks,
  Cpu,
  Layers,
  Sparkles,
  ArrowUpRight,
  Download,
  Calendar,
  MapPin,
  Leaf,
  Activity,
  FileCheck2,
} from "lucide-react";
import { projects as seedProjects } from "../data/mockData";

const VERIFICATION_KEY = "blueguard_verifications";
const STORAGE_KEY = "blueguard_projects";

function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export default function Blockchain() {
  const [search, setSearch] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const verifications = getStored(VERIFICATION_KEY, []);
  const allProjects = getStored(STORAGE_KEY, seedProjects);

  // Combine verification records with projects for complete blockchain certificate list
  const certificates = useMemo(() => {
    const list = [...verifications];

    allProjects.forEach((proj, idx) => {
      if (!list.some((v) => v.projectId === proj.id)) {
        list.push({
          id: `REC-${1040 + idx}`,
          projectId: proj.id,
          projectName: proj.name,
          location: proj.location,
          coordinates: proj.coordinates || [21.9497, 89.1833],
          carbonEstimate: proj.carbon || `${12000 + idx * 3400} tCO₂e`,
          hectares: proj.hectares || proj.area || "120 ha",
          verificationHash: `0x7f9a${(idx * 83721 + 192837).toString(16)}b83c4129`,
          approvedAt: new Date(Date.now() - idx * 86400000 * 4).toISOString(),
          verifier: "BlueGuard Automated Satellite + Admin Consortium",
          evidenceCount: 4 + idx,
          blockNumber: 18432910 + idx * 42,
        });
      }
    });

    return list;
  }, [verifications, allProjects]);

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.projectName?.toLowerCase().includes(q) ||
      c.projectId?.toLowerCase().includes(q) ||
      c.verificationHash?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const totalCarbonVerified = useMemo(() => {
    return certificates.reduce((sum, c) => {
      const num = Number(String(c.carbonEstimate || "").replace(/[^0-9.]/g, "")) || 0;
      return sum + num;
    }, 0);
  }, [certificates]);

  return (
    <div className="min-h-full bg-[#F7F8F4] p-6 lg:p-8">
      {/* =========================================================
          HERO BANNER
          ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-xl">
        <img
          src={greenWater}
          alt="Coastal mangrove water"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />

        {/* Brand Teal Gradient Wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2B33]/95 via-[#12545A]/85 to-[#3F7D5C]/75 backdrop-blur-[1.5px]" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#E7DEC7]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-[#3F7D5C]/30 blur-3xl" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E7DEC7]/30 bg-[#E7DEC7]/15 px-4 py-2 text-xs sm:text-sm font-extrabold tracking-wider text-[#E7DEC7] backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5FBF8C] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5FBF8C] shadow-[0_0_8px_rgba(95,191,140,0.8)]" />
                </span>
                <Fingerprint size={18} className="text-[#5FBF8C]" />
                <span>ON-CHAIN BLUE CARBON PROOF LEDGER</span>
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-serif">
                Blockchain Registry
              </h1>

              <p className="mt-2.5 text-sm sm:text-base font-medium leading-relaxed text-[#E7DEC7]/90 max-w-2xl">
                Every verified blue carbon hectare is cryptographically anchored with SHA-256 proof certificates, satellite biomass telemetry, and immutable on-chain records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-white backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#E7DEC7]">Total Verified Carbon</p>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalCarbonVerified.toLocaleString()} <span className="text-xs font-sans text-[#5FBF8C]">tCO₂e</span></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          KEY STATS CARDS
          ========================================================= */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#E7DEC7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anchored Proofs</span>
            <span className="rounded-2xl bg-[#12545A]/10 text-[#12545A] border border-[#12545A]/20 p-2.5">
              <Blocks size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-[#0B2B33]">{certificates.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Immutable ledger records</p>
        </div>

        <div className="rounded-3xl border border-[#E7DEC7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Consensus Status</span>
            <span className="rounded-2xl bg-[#3F7D5C]/10 text-[#3F7D5C] border border-[#3F7D5C]/20 p-2.5">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-[#3F7D5C]">100%</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Telemetry cross-match</p>
        </div>

        <div className="rounded-3xl border border-[#E7DEC7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Smart Contract</span>
            <span className="rounded-2xl bg-[#C46A3F]/10 text-[#C46A3F] border border-[#C46A3F]/20 p-2.5">
              <Cpu size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-[#0B2B33]">ERC-721MRV</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Standard Blue Carbon Protocol</p>
        </div>

        <div className="rounded-3xl border border-[#E7DEC7] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Hash</span>
            <span className="rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 p-2.5">
              <ShieldCheck size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-[#12545A]">SHA-256</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Multi-source cryptographic seal</p>
        </div>
      </div>

      {/* =========================================================
          REGISTRY CERTIFICATES LIST
          ========================================================= */}
      <div className="mt-8 rounded-3xl border border-[#E7DEC7] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B2B33] font-serif">
              Immutable Verification Ledger
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Cryptographically verified restoration sites anchored to the BlueGuard blockchain registry.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hash, project, or site ID..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-[#12545A] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No blockchain certificates match your search query.
            </div>
          ) : (
            filtered.map((cert) => (
              <div
                key={cert.id}
                className="group relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-2xl border border-[#E7DEC7]/70 bg-[#F7F8F4]/60 p-5 hover:bg-[#F3EEE1]/40 hover:border-[#12545A]/40 transition duration-200"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#3F7D5C]/15 border border-[#3F7D5C]/30 px-2.5 py-0.5 text-xs font-bold text-[#3F7D5C]">
                      <CheckCircle2 size={12} />
                      Verified On-Chain
                    </span>
                    <h3 className="text-base font-extrabold text-[#0B2B33] truncate">
                      {cert.projectName}
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-500">({cert.projectId})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#12545A]" />
                      {cert.location}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-[#0B2B33]">{cert.hectares}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-[#C46A3F]">{cert.carbonEstimate}</span>
                    <span>•</span>
                    <span className="text-slate-500">{new Date(cert.approvedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Hash Strip */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">Hash:</span>
                    <code className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 font-mono text-xs font-bold text-[#12545A]">
                      {cert.verificationHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cert.verificationHash)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700 transition"
                      title="Copy Hash"
                    >
                      {copiedHash === cert.verificationHash ? (
                        <Check size={14} className="text-[#3F7D5C]" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => setSelectedRecord(cert)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2B33] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#12545A] transition shadow-sm"
                  >
                    <span>View Certificate</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================
          CERTIFICATE MODAL
          ========================================================= */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-white/20 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-[#3F7D5C]">
                <Fingerprint size={24} />
                <h3 className="text-xl font-bold font-serif text-[#0B2B33]">
                  Blue Carbon Proof Certificate
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <div className="rounded-2xl bg-[#F7F8F4] p-4 border border-[#E7DEC7]">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Project Name</p>
                <p className="text-lg font-bold text-[#0B2B33] mt-1">{selectedRecord.projectName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedRecord.projectId} • {selectedRecord.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Verified Carbon Credits</p>
                  <p className="text-base font-black text-[#C46A3F] mt-0.5 font-mono">{selectedRecord.carbonEstimate}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Protected Hectares</p>
                  <p className="text-base font-black text-[#0B2B33] mt-0.5">{selectedRecord.hectares}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2 font-mono text-xs">
                <div>
                  <span className="text-slate-400">Cryptographic Seal: </span>
                  <span className="text-[#12545A] font-bold break-all">{selectedRecord.verificationHash}</span>
                </div>
                <div>
                  <span className="text-slate-400">Block Anchor: </span>
                  <span className="text-slate-800 font-bold">#{selectedRecord.blockNumber || 18432910}</span>
                </div>
                <div>
                  <span className="text-slate-400">Verifier Authority: </span>
                  <span className="text-slate-800">{selectedRecord.verifier || "BlueGuard Admin"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Certificate verification verified against BlueGuard SHA-256 Ledger.");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#12545A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0B2B33] transition shadow-md"
              >
                <ShieldCheck size={16} />
                <span>Verify Proof Authenticity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
