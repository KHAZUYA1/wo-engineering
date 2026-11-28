import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import FormPreviewModal from "./FormPreviewModal";
import SettingsModal from "./SettingsModal";
import {
  ClipboardList,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  LogOut,
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  FileSpreadsheet,
  MessageSquare,
  Mail,
  Send,
  FileCheck2,
  Building2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Settings,
  Printer,
  ImagePlus,
  Trash2,
  Shield,
  Layers,
  Cpu,
  Factory,
  Activity,
} from "lucide-react";

const DEFAULT_DEPARTMENTS = [
  "PRODUKSI",
  "QA",
  "QC",
  "DEVELOPMENT",
  "CUTTING",
  "FINISHING",
  "PO",
  "ACCOUNTING",
  "HRD",
  "PPIC",
];

const DEFAULT_CATEGORIES = [
  "Mechanical",
  "Electrical",
  "Panel & Control",
  "Genset & Power Supply",
  "Compressor & Pneumatic",
  "Hydrant & Fire Protection",
  "Water Pump & Plumbing",
  "HVAC & Air Conditioning",
  "Building & Civil",
  "Facility & Infrastructure",
  "IT & Networking",
  "CCTV & Security",
  "Tools & Equipment",
  "Furniture & Perlengkapan",
  "Fabrication & Modification",
  "Installation & Relocation",
  "Repair & Troubleshooting",
  "Material & Sparepart Request",
  "General Maintenance",
  "Other Requests",
];

const DEFAULT_SETTINGS = {
  adminPin: "Ypdf091001",
  targetWhatsapp: "6282270189045",
  targetEmail: "yuda@pgcm.co.kr",
  notifFooterNote: "",
  ticketPrefix: "WO",
  theme: "slate",
  bgStyle: "gradient",
  motionMode: "3d-dynamic",
  customBgColor: "",
  customBgImageDataUrl: "",
  bgOverlayOpacity: 55,
  brandSymbol: "clipboard",
  customLogoDataUrl: "",
  appTitle: "Engineering Work Order & Waiting List",
  loginSubtitle:
    "Isi Surat Permintaan Pekerjaan (FM-IT-SOP-01-01) langsung di sistem, download/cetak PDF untuk tanda tangan manual, dan pantau antrian Engineering secara real-time di PC maupun HP.",
  announcementText: "",
  cardDensity: "comfortable",
  showStatsCards: true,
  showWorkflowHint: true,
  showLiveIndicator: true,
  companyName: "PT. Sino Indah Jaya",
  docNumber: "FM-IT-SOP-01-01",
  docIssueDate: "01 Desember 2025",
  docRevision: "01",
  docPage: "1 dari 1",
  presidentDirectorName: "Mr. KANG BYOUNGHA",
  requireMgmtApproval: true,
  allowUserPrintForm: true,
  showResetButton: true,
  departments: DEFAULT_DEPARTMENTS,
  categories: DEFAULT_CATEGORIES,
};

const THEME_STYLES = {
  slate: {
    gradientBg: "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950",
    solidBg: "bg-slate-950",
    header: "bg-slate-950/85",
    accentBtn:
      "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-cyan-500/25",
    subText: "text-cyan-300",
    badgeBox: "bg-gradient-to-br from-blue-500 to-cyan-400",
    glowA: "bg-cyan-500/25",
    glowB: "bg-blue-600/25",
    particle: "bg-cyan-300/40",
  },
  indigo: {
    gradientBg: "bg-gradient-to-br from-indigo-950 via-slate-950 to-fuchsia-950",
    solidBg: "bg-indigo-950",
    header: "bg-indigo-950/85",
    accentBtn:
      "bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25",
    subText: "text-indigo-300",
    badgeBox: "bg-gradient-to-br from-indigo-500 to-cyan-400",
    glowA: "bg-indigo-500/25",
    glowB: "bg-fuchsia-500/20",
    particle: "bg-indigo-300/40",
  },
  blue: {
    gradientBg: "bg-gradient-to-br from-blue-950 via-slate-950 to-sky-950",
    solidBg: "bg-blue-950",
    header: "bg-blue-950/85",
    accentBtn:
      "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25",
    subText: "text-sky-300",
    badgeBox: "bg-gradient-to-br from-sky-400 to-blue-600",
    glowA: "bg-sky-500/25",
    glowB: "bg-blue-500/20",
    particle: "bg-sky-300/40",
  },
  emerald: {
    gradientBg: "bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950",
    solidBg: "bg-emerald-950",
    header: "bg-emerald-950/85",
    accentBtn:
      "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25",
    subText: "text-emerald-300",
    badgeBox: "bg-gradient-to-br from-emerald-400 to-teal-500",
    glowA: "bg-emerald-500/25",
    glowB: "bg-teal-500/20",
    particle: "bg-emerald-300/40",
  },
  amber: {
    gradientBg: "bg-gradient-to-br from-stone-950 via-zinc-950 to-amber-950",
    solidBg: "bg-stone-950",
    header: "bg-stone-950/85",
    accentBtn:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25",
    subText: "text-amber-300",
    badgeBox: "bg-gradient-to-br from-amber-400 to-orange-500",
    glowA: "bg-amber-500/20",
    glowB: "bg-orange-500/20",
    particle: "bg-amber-300/40",
  },
  zinc: {
    gradientBg: "bg-gradient-to-br from-zinc-950 via-neutral-950 to-slate-900",
    solidBg: "bg-zinc-950",
    header: "bg-zinc-950/85",
    accentBtn:
      "bg-gradient-to-r from-zinc-700 to-slate-600 hover:from-zinc-600 hover:to-slate-500 shadow-lg shadow-black/35",
    subText: "text-zinc-300",
    badgeBox: "bg-gradient-to-br from-zinc-600 to-slate-500",
    glowA: "bg-slate-400/15",
    glowB: "bg-zinc-500/15",
    particle: "bg-slate-300/35",
  },
};

const PRIORITY_META = {
  P1: {
    label: "P1 - Critical / Urgent",
    short: "P1",
    rank: 1,
    badge: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-600",
  },
  P2: {
    label: "P2 - High Priority",
    short: "P2",
    rank: 2,
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    dot: "bg-amber-500",
  },
  P3: {
    label: "P3 - Normal (FIFO)",
    short: "P3",
    rank: 3,
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-500",
  },
};

const STATUS_META = {
  "Waiting List": {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  "In Progress": {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Wrench,
  },
  "Pending Material": {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Package,
  },
  Done: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

const PARTICLES = [
  { left: "10%", top: "18%", size: "w-1.5 h-1.5", delay: "0s", dur: "7s" },
  { left: "26%", top: "72%", size: "w-2 h-2", delay: "1.5s", dur: "9s" },
  { left: "52%", top: "24%", size: "w-1.5 h-1.5", delay: "2.2s", dur: "8s" },
  { left: "74%", top: "64%", size: "w-2 h-2", delay: "0.8s", dur: "10s" },
  { left: "88%", top: "30%", size: "w-1.5 h-1.5", delay: "3s", dur: "7.5s" },
];

const COLLECTION_NAME = "work_orders";

function BrandMark({ settings, iconSizeClass = "w-6 h-6" }) {
  if (settings.brandSymbol === "custom" && settings.customLogoDataUrl) {
    return (
      <img
        src={settings.customLogoDataUrl}
        alt="Logo Perusahaan"
        className="w-full h-full object-cover"
      />
    );
  }

  const iconMap = {
    clipboard: ClipboardList,
    wrench: Wrench,
    shield: Shield,
    layers: Layers,
    cpu: Cpu,
    factory: Factory,
  };
  const IconComp = iconMap[settings.brandSymbol] || ClipboardList;
  return <IconComp className={iconSizeClass} />;
}

// Kartu 3D ringan: tilt halus di desktop & depth lift di mobile
function Tilt3DCard({ children, className = "", motionMode = "3d-dynamic" }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, sx: 50, sy: 50 });

  const handleMouseMove = (e) => {
    if (motionMode !== "3d-dynamic") return;
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 7,
      ry: (px - 0.5) * 9,
      sx: Math.round(px * 100),
      sy: Math.round(py * 100),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, sx: 50, sy: 50 });
  };

  const is3D = motionMode === "3d-dynamic";
  const hasTilt = is3D && (tilt.rx !== 0 || tilt.ry !== 0);

  return (
    <div style={{ perspective: is3D ? "1100px" : undefined }}>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          is3D
            ? {
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${
                  hasTilt ? "8px" : "0px"
                })`,
                transformStyle: "preserve-3d",
              }
            : undefined
        }
        className={`relative overflow-hidden transition-all duration-200 ease-out ${
          motionMode === "lite"
            ? ""
            : "hover:-translate-y-0.5 hover:shadow-xl"
        } ${className}`}
      >
        {is3D && hasTilt && (
          <div
            className="pointer-events-none absolute inset-0 opacity-35 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${tilt.sx}% ${tilt.sy}%, rgba(56,189,248,0.26), transparent 62%)`,
            }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function FuturisticBackdrop({ activeTheme, settings }) {
  const overlayOpacity = Math.min(
    0.92,
    Math.max(0.1, (settings.bgOverlayOpacity ?? 55) / 100),
  );
  const motionMode = settings.motionMode || "3d-dynamic";

  return (
    <>
      <style>{`
        @keyframes floatGlowA {
          0%, 100% { transform: translate3d(0px, 0px, 0px) scale(1); }
          50% { transform: translate3d(42px, 28px, 0px) scale(1.12); }
        }
        @keyframes floatGlowB {
          0%, 100% { transform: translate3d(0px, 0px, 0px) scale(1.06); }
          50% { transform: translate3d(-38px, -32px, 0px) scale(0.95); }
        }
        @keyframes scanBeam {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes particleRise {
          0% { transform: translateY(16px) scale(0.8); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: translateY(-34px) scale(1.15); opacity: 0; }
        }
        .animate-glow-a {
          animation: floatGlowA 11s ease-in-out infinite;
          will-change: transform;
        }
        .animate-glow-b {
          animation: floatGlowB 14s ease-in-out infinite;
          will-change: transform;
        }
        .animate-scan-beam {
          animation: scanBeam 9s linear infinite;
          will-change: transform;
        }
        .animate-particle {
          animation: particleRise var(--dur, 8s) ease-in-out var(--delay, 0s) infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {settings.customBgImageDataUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 transition-all duration-500 pointer-events-none"
          style={{
            backgroundImage: `url("${settings.customBgImageDataUrl}")`,
          }}
        />
      )}

      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: settings.customBgColor || "#030712",
          opacity: settings.customBgImageDataUrl ? overlayOpacity : 0.45,
        }}
      />

      {settings.bgStyle !== "solid" && motionMode !== "lite" && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className={`w-96 h-96 rounded-full blur-3xl ${activeTheme.glowA} animate-glow-a absolute -top-24 -left-24`}
          />
          <div
            className={`w-[28rem] h-[28rem] rounded-full blur-3xl ${activeTheme.glowB} animate-glow-b absolute -bottom-28 -right-20`}
          />
          {PARTICLES.map((p, idx) => (
            <span
              key={idx}
              style={{
                left: p.left,
                top: p.top,
                "--delay": p.delay,
                "--dur": p.dur,
              }}
              className={`rounded-full ${p.size} ${activeTheme.particle} animate-particle absolute`}
            />
          ))}
        </div>
      )}

      {settings.bgStyle === "grid" && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="w-full h-full opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(56, 189, 248, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.16) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          {motionMode !== "lite" && (
            <div className="w-full h-24 bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent animate-scan-beam" />
          )}
        </div>
      )}
    </>
  );
}

function buildNotificationText(ticket, eventType = "NEW_WO", currentSettings) {
  const docNumber = currentSettings?.docNumber || "FM-IT-SOP-01-01";
  const headerMap = {
    NEW_WO: "WORK ORDER BARU MASUK (WAITING LIST)",
    ESCALATION: "ESKALASI PRIORITAS WORK ORDER (APPROVAL MANAGEMENT)",
    STATUS_UPDATE: "UPDATE STATUS WORK ORDER ENGINEERING",
    MANUAL_LOG: "DOKUMENTASI LOG WORK ORDER ENGINEERING",
  };

  const lines = [
    `*${headerMap[eventType] || "INFO WORK ORDER"}*`,
    `No. Form: *${ticket.id}* (${docNumber})`,
    `Departemen: *${ticket.department}* | Section: ${ticket.section || "-"}`,
    `Pemohon: *${ticket.requesterName}* (NIP: ${ticket.requesterNip || "-"})`,
    `Jenis Pekerjaan: *${ticket.jobType || "Repair"}*`,
    `Judul / Keterangan: ${ticket.title}`,
    `Kategori & Lokasi: ${ticket.category} | ${ticket.lineLocation || "-"}`,
    `Prioritas: *${PRIORITY_META[ticket.priority]?.label || ticket.priority}*`,
    ticket.approvedByManagement
      ? `Disetujui Management: *${ticket.approvedByManagement}*`
      : `Disetujui Management: -`,
    `Status Saat Ini: *${ticket.status}*`,
    `PIC Engineering: ${ticket.assignedPic || "Belum ditugaskan"}`,
    `Waktu Input: ${ticket.createdAt}`,
    ticket.completedAt ? `Waktu Selesai: ${ticket.completedAt}` : null,
    currentSettings?.notifFooterNote ? `\n${currentSettings.notifFooterNote}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tickets, setTickets] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [dbError, setDbError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [session, setSession] = useState(null);
  const [loginRole, setLoginRole] = useState("user");
  const [loginName, setLoginName] = useState("");
  const [loginDept, setLoginDept] = useState("PRODUKSI");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    department: "PRODUKSI",
    requesterName: "",
    requesterNip: "",
    section: "",
    jobType: "Repair",
    reqSupervisor: "",
    reqChief: "",
    reqManager: "",
    reqGm: "",
    category: "Mechanical",
    lineLocation: "",
    photoDataUrl: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const [manageTicket, setManageTicket] = useState(null);
  const [manageTab, setManageTab] = useState("status");
  const [manageState, setManageState] = useState({
    priority: "P3",
    approvedByManagement: "",
    escalationReason: "",
    status: "Waiting List",
    assignedPic: "",
    handoverStatus: "Menunggu Berkas TTD Manual",
    engineeringNotes: "",
    engAdmin: "",
    engSupervisor: "",
    engChief: "",
    engManagerHrd: "",
    receivedDate: "",
    receivedTime: "",
    receiverName: "",
    executorType: "Team Engineer",
    manPowerLogs: [],
    materialLogs: [],
    vendorSectionHead: "",
    vendorProjectHead: "",
    vendorName: "",
  });
  const [manageError, setManageError] = useState("");

  const [previewTicket, setPreviewTicket] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [notifBanner, setNotifBanner] = useState(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "wo_config");
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        list.sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        );
        setTickets(list);
        setIsLoadingDb(false);
        setDbError("");
      },
      (err) => {
        console.error("Firestore error:", err);
        setDbError(
          "Gagal terhubung ke database Cloud Firestore. Periksa koneksi internet atau aturan Firestore.",
        );
        setIsLoadingDb(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleSaveSettings = async (newSettings) => {
    await setDoc(doc(db, "settings", "wo_config"), newSettings, { merge: true });
    setSettings(newSettings);
  };

  const openWhatsAppNotification = (text) => {
    const phone = (settings.targetWhatsapp || "6282270189045").replace(
      /\D/g,
      "",
    );
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openEmailNotification = (ticket, text) => {
    const email = settings.targetEmail || "yuda@pgcm.co.kr";
    const subject = `[WO Engineering] ${ticket.id} - ${ticket.department} (${ticket.priority} | ${ticket.status})`;
    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(text)}`;
    window.location.href = mailto;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginName.trim()) {
      setLoginError("Nama pengguna wajib diisi.");
      return;
    }

    if (loginRole === "admin") {
      if (loginPin !== settings.adminPin) {
        setLoginError("Password / PIN Admin salah. Periksa kembali di menu Setting.");
        return;
      }
      setSession({
        role: "admin",
        name: loginName.trim(),
        department: "ENGINEERING",
      });
    } else {
      setSession({
        role: "user",
        name: loginName.trim(),
        department: loginDept,
      });
    }
  };

  const handleLogout = () => {
    setSession(null);
    setLoginPin("");
    setLoginError("");
  };

  const activeQueue = useMemo(() => {
    const active = tickets.filter((t) => t.status !== "Done");
    return [...active].sort((a, b) => {
      const rankA = PRIORITY_META[a.priority]?.rank ?? 9;
      const rankB = PRIORITY_META[b.priority]?.rank ?? 9;
      if (rankA !== rankB) return rankA - rankB;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }, [tickets]);

  const queuePositionMap = useMemo(() => {
    const map = {};
    activeQueue.forEach((t, idx) => {
      map[t.id] = idx + 1;
    });
    return map;
  }, [activeQueue]);

  const completedTickets = useMemo(
    () => tickets.filter((t) => t.status === "Done"),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const base = activeTab === "queue" ? activeQueue : completedTickets;
    return base.filter((t) => {
      if (filterDept !== "ALL" && t.department !== filterDept) return false;
      if (filterPriority !== "ALL" && t.priority !== filterPriority)
        return false;
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          t.id,
          t.requesterNip,
          t.section,
          t.jobType,
          t.department,
          t.requesterName,
          t.title,
          t.description,
          t.lineLocation,
          t.assignedPic,
          t.approvedByManagement,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    activeTab,
    activeQueue,
    completedTickets,
    filterDept,
    filterPriority,
    filterStatus,
    searchQuery,
  ]);

  const openCreateModal = () => {
    setFormError("");
    setFormData({
      department:
        session?.role === "user"
          ? session.department
          : settings.departments[0] || "PRODUKSI",
      requesterName: session?.role === "user" ? session.name : "",
      requesterNip: "",
      section: "",
      jobType: "Repair",
      reqSupervisor: "",
      reqChief: "",
      reqManager: "",
      reqGm: "",
      category: settings.categories[0] || "Mechanical",
      lineLocation: "",
      photoDataUrl: "",
      description: "",
    });
    setIsCreateOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 540;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData((prev) => ({
          ...prev,
          photoDataUrl: canvas.toDataURL("image/jpeg", 0.75),
        }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.requesterName.trim() || !formData.description.trim()) {
      setFormError(
        "Lengkapi Nama Yang Meminta dan Keterangan Masalah / Permintaan.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const counterRef = doc(db, "counters", "wo_counter");
      const nextCount = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const current = counterDoc.exists() ? counterDoc.data().count || 0 : 0;
        const updated = current + 1;
        transaction.set(counterRef, { count: updated }, { merge: true });
        return updated;
      });

      const nextNum = String(nextCount).padStart(3, "0");
      const prefix = settings.ticketPrefix || "WO";
      const ticketId = `${prefix}-${now.getFullYear()}-${nextNum}`;

      const cleanDesc = formData.description.trim();
      const summaryTitle =
        cleanDesc.length > 75 ? `${cleanDesc.slice(0, 75)}...` : cleanDesc;

      const newTicket = {
        id: ticketId,
        createdAt: stamp,
        requestDate: dateStr,
        completedAt: "",
        department: formData.department,
        requesterName: formData.requesterName.trim(),
        requesterNip: formData.requesterNip.trim(),
        section: formData.section.trim() || formData.lineLocation.trim(),
        jobType: formData.jobType,
        reqSupervisor: formData.reqSupervisor.trim(),
        reqChief: formData.reqChief.trim(),
        reqManager: formData.reqManager.trim(),
        reqGm: formData.reqGm.trim(),
        writtenFormNo: ticketId,
        divisionHeadSignedBy:
          formData.reqGm.trim() ||
          formData.reqManager.trim() ||
          formData.reqChief.trim() ||
          formData.reqSupervisor.trim() ||
          "TTD Manual Pada Form Cetak",
        handoverStatus: "Menunggu Berkas TTD Manual",
        title: summaryTitle,
        category: formData.category,
        lineLocation:
          formData.lineLocation.trim() || formData.section.trim() || "-",
        layoutNote: "",
        photoDataUrl: formData.photoDataUrl || "",
        description: cleanDesc,
        priority: "P3",
        approvedByManagement: "",
        escalationReason: "",
        status: "Waiting List",
        assignedPic: "",
        engineeringNotes: "",
        engAdmin: "",
        engSupervisor: "",
        engChief: "",
        engManagerHrd: "",
        receivedDate: "",
        receivedTime: "",
        receiverName: "",
        executorType: "Team Engineer",
        manPowerLogs: [],
        materialLogs: [],
        vendorSectionHead: "",
        vendorProjectHead: "",
        vendorName: "",
      };

      await setDoc(doc(db, COLLECTION_NAME, ticketId), newTicket);

      setIsCreateOpen(false);
      setActiveTab("queue");
      setPreviewTicket(newTicket);
      setNotifBanner({
        ticket: newTicket,
        eventType: "NEW_WO",
        message: `Form ${newTicket.id} terbit otomatis berurutan! Silakan Preview, Download PDF, atau Print untuk TTD manual sampai Division Head terkait.`,
      });
    } catch (err) {
      console.error("Gagal menyimpan WO:", err);
      setFormError(
        "Gagal menyimpan ke server Firebase. Periksa koneksi internet Anda lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = (ticket) => {
    setManageError("");
    setManageTab("status");
    setManageTicket(ticket);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    setManageState({
      priority: ticket.priority,
      approvedByManagement: ticket.approvedByManagement || "",
      escalationReason: ticket.escalationReason || "",
      status: ticket.status,
      assignedPic: ticket.assignedPic || "",
      handoverStatus: ticket.handoverStatus || "Berkas TTD Diterima Engineering",
      engineeringNotes: ticket.engineeringNotes || "",
      engAdmin: ticket.engAdmin || session?.name || "",
      engSupervisor: ticket.engSupervisor || "",
      engChief: ticket.engChief || "",
      engManagerHrd: ticket.engManagerHrd || "",
      receivedDate: ticket.receivedDate || todayStr,
      receivedTime: ticket.receivedTime || timeStr,
      receiverName: ticket.receiverName || session?.name || "",
      executorType: ticket.executorType || "Team Engineer",
      manPowerLogs: Array.isArray(ticket.manPowerLogs) ? ticket.manPowerLogs : [],
      materialLogs: Array.isArray(ticket.materialLogs) ? ticket.materialLogs : [],
      vendorSectionHead: ticket.vendorSectionHead || "",
      vendorProjectHead: ticket.vendorProjectHead || "",
      vendorName: ticket.vendorName || "",
    });
  };

  const addManPowerRow = () => {
    setManageState((prev) => ({
      ...prev,
      manPowerLogs: [
        ...prev.manPowerLogs,
        {
          name: "",
          nip: "",
          date: "",
          startTime: "",
          endTime: "",
          total: "",
          sign: "",
        },
      ],
    }));
  };

  const updateManPowerRow = (idx, field, val) => {
    setManageState((prev) => {
      const copy = [...prev.manPowerLogs];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, manPowerLogs: copy };
    });
  };

  const removeManPowerRow = (idx) => {
    setManageState((prev) => ({
      ...prev,
      manPowerLogs: prev.manPowerLogs.filter((_, i) => i !== idx),
    }));
  };

  const addMaterialRow = () => {
    setManageState((prev) => ({
      ...prev,
      materialLogs: [
        ...prev.materialLogs,
        {
          name: "",
          qty: "",
          unit: "",
          description: "",
          remark: "",
          whSign: "",
        },
      ],
    }));
  };

  const updateMaterialRow = (idx, field, val) => {
    setManageState((prev) => {
      const copy = [...prev.materialLogs];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, materialLogs: copy };
    });
  };

  const removeMaterialRow = (idx) => {
    setManageState((prev) => ({
      ...prev,
      materialLogs: prev.materialLogs.filter((_, i) => i !== idx),
    }));
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    setManageError("");

    const isEscalated =
      manageState.priority === "P1" || manageState.priority === "P2";

    if (
      settings.requireMgmtApproval !== false &&
      isEscalated &&
      !manageState.approvedByManagement.trim()
    ) {
      setManageError(
        "SOP Management: Menaikkan prioritas ke P1 atau P2 WAJIB mengisi nama pihak Management yang menyetujui.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const priorityChanged = manageState.priority !== manageTicket.priority;
      const statusChanged = manageState.status !== manageTicket.status;

      const updatedFields = {
        priority: manageState.priority,
        approvedByManagement: isEscalated
          ? manageState.approvedByManagement.trim()
          : "",
        escalationReason: isEscalated
          ? manageState.escalationReason.trim() || "Persetujuan Management"
          : "",
        status: manageState.status,
        assignedPic: manageState.assignedPic.trim(),
        handoverStatus: manageState.handoverStatus,
        engineeringNotes: manageState.engineeringNotes.trim(),
        engAdmin: manageState.engAdmin.trim(),
        engSupervisor: manageState.engSupervisor.trim(),
        engChief: manageState.engChief.trim(),
        engManagerHrd: manageState.engManagerHrd.trim(),
        receivedDate: manageState.receivedDate.trim(),
        receivedTime: manageState.receivedTime.trim(),
        receiverName: manageState.receiverName.trim(),
        executorType: manageState.executorType,
        manPowerLogs: manageState.manPowerLogs,
        materialLogs: manageState.materialLogs,
        vendorSectionHead: manageState.vendorSectionHead.trim(),
        vendorProjectHead: manageState.vendorProjectHead.trim(),
        vendorName: manageState.vendorName.trim(),
        completedAt:
          manageState.status === "Done" ? manageTicket.completedAt || stamp : "",
      };

      await updateDoc(doc(db, COLLECTION_NAME, manageTicket.id), updatedFields);

      const updatedTicket = { ...manageTicket, ...updatedFields };
      setManageTicket(null);

      if (priorityChanged && isEscalated) {
        setNotifBanner({
          ticket: updatedTicket,
          eventType: "ESCALATION",
          message: `Prioritas ${updatedTicket.id} dinaikkan ke ${updatedTicket.priority} (Approval: ${updatedTicket.approvedByManagement}). Kirim notifikasi ke WhatsApp & Email:`,
        });
      } else if (statusChanged || priorityChanged) {
        setNotifBanner({
          ticket: updatedTicket,
          eventType: "STATUS_UPDATE",
          message: `Pembaruan tiket ${updatedTicket.id} (${updatedTicket.status} | ${updatedTicket.priority}) tersimpan ke Cloud. Kirim notifikasi ke WhatsApp & Email:`,
        });
      }
    } catch (err) {
      console.error("Gagal update WO:", err);
      setManageError(
        "Gagal memperbarui tiket di server Firebase. Periksa koneksi internet Anda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const formatRow = (t, idx) => ({
      No: idx + 1,
      "No. Form WO": t.id,
      "No. Dokumen IATF": settings.docNumber,
      "Tanggal Input": t.createdAt,
      "Tanggal Selesai": t.completedAt || "-",
      Departemen: t.department,
      Section: t.section || "-",
      "Yang Meminta": t.requesterName,
      NIP: t.requesterNip || "-",
      "SPV / Chief / Mgr / GM":
        [t.reqSupervisor, t.reqChief, t.reqManager, t.reqGm]
          .filter(Boolean)
          .join(" / ") || "-",
      "Jenis Pekerjaan": t.jobType || "Repair",
      "Status Berkas Fisik": t.handoverStatus,
      Kategori: t.category,
      "Lokasi / Line": t.lineLocation,
      "Keterangan Masalah / Permintaan": t.description,
      Prioritas: PRIORITY_META[t.priority]?.label || t.priority,
      "Approval Management": t.approvedByManagement || "-",
      "Status Pengerjaan": t.status,
      Pelaksana: t.executorType || "Team Engineer",
      "PIC Engineering": t.assignedPic || "-",
      "Catatan Engineering": t.engineeringNotes || "-",
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(tickets.map(formatRow)),
      "Semua Data WO",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        activeQueue.map((t, idx) => ({
          "Urutan Antrian": idx + 1,
          ...formatRow(t, idx),
        })),
      ),
      "Waiting List Aktif",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(completedTickets.map(formatRow)),
      "Riwayat Selesai",
    );

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Riwayat_Work_Order_Engineering_${today}.xlsx`);
  };

  const executeResetFromZero = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        tickets.map((t) => deleteDoc(doc(db, COLLECTION_NAME, t.id))),
      );
      await setDoc(doc(db, "counters", "wo_counter"), { count: 0 });
      setNotifBanner(null);
      setConfirmResetOpen(false);
    } catch (err) {
      console.error("Gagal reset database:", err);
      alert("Gagal mereset database Cloud. Periksa koneksi internet Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTheme = THEME_STYLES[settings.theme] || THEME_STYLES.slate;
  const motionMode = settings.motionMode || "3d-dynamic";
  const isCustomLogoActive =
    settings.brandSymbol === "custom" && Boolean(settings.customLogoDataUrl);

  if (!session) {
    return (
      <div
        className={`relative min-h-screen ${
          settings.bgStyle === "solid"
            ? activeTheme.solidBg
            : activeTheme.gradientBg
        } flex items-center justify-center p-4 overflow-hidden`}
      >
        <FuturisticBackdrop activeTheme={activeTheme} settings={settings} />

        <div className="relative z-10 w-full max-w-lg">
          <Tilt3DCard
            motionMode={motionMode}
            className="bg-white/92 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 ring-1 ring-cyan-400/30"
          >
            <div
              className={`${activeTheme.header} backdrop-blur-md text-white p-5 sm:p-6 border-b border-white/10`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 ${
                    isCustomLogoActive
                      ? "bg-white p-0"
                      : `${activeTheme.badgeBox} p-2`
                  } rounded-xl shrink-0 shadow-md overflow-hidden flex items-center justify-center ring-2 ring-cyan-300/35`}
                >
                  <BrandMark
                    settings={settings}
                    iconSizeClass="w-7 h-7 text-white"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[11px] uppercase tracking-wider ${activeTheme.subText} font-semibold truncate`}
                  >
                    {settings.companyName} · {settings.docNumber}
                  </p>
                  <h1 className="text-lg sm:text-xl font-bold leading-snug">
                    {settings.appTitle}
                  </h1>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                {settings.loginSubtitle || DEFAULT_SETTINGS.loginSubtitle}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-2 bg-slate-100/90 p-1 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole("user");
                    setLoginError("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    loginRole === "user"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  User Departemen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole("admin");
                    setLoginError("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    loginRole === "admin"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Admin Engineering
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder={
                      loginRole === "admin"
                        ? "Nama Admin Engineering"
                        : "Nama pemohon / perwakilan departemen"
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {loginRole === "user" ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Departemen ({settings.departments.length} Departemen)
                    </label>
                    <select
                      value={loginDept}
                      onChange={(e) => setLoginDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {settings.departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password / PIN Admin Engineering
                    </label>
                    <input
                      type="password"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="Masukkan Password / PIN Admin"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 ${activeTheme.accentBtn} text-white font-semibold rounded-xl text-sm transition cursor-pointer`}
                >
                  Masuk ke Sistem Work Order
                </button>
              </form>
            </div>
          </Tilt3DCard>
        </div>
      </div>
    );
  }

  const cardPadClass =
    settings.cardDensity === "compact" ? "p-3.5 sm:p-4" : "p-4 sm:p-5";

  return (
    <div
      className={`relative min-h-screen ${
        settings.bgStyle === "solid"
          ? activeTheme.solidBg
          : activeTheme.gradientBg
      } text-slate-900 overflow-x-hidden`}
    >
      <FuturisticBackdrop activeTheme={activeTheme} settings={settings} />

      <header
        className={`relative ${activeTheme.header} backdrop-blur-xl text-white border-b border-cyan-400/25 sticky top-0 z-30 shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${
                isCustomLogoActive
                  ? "bg-white p-0"
                  : `${activeTheme.badgeBox} p-1.5`
              } rounded-xl shrink-0 shadow-md overflow-hidden flex items-center justify-center ring-2 ring-cyan-400/35`}
            >
              <BrandMark
                settings={settings}
                iconSizeClass="w-6 h-6 text-white"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                  {settings.appTitle}
                </h1>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    session.role === "admin"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-white/15 text-white border border-white/20"
                  }`}
                >
                  {session.role === "admin"
                    ? `ADMIN · ${session.name}`
                    : `${session.department} · ${session.name}`}
                </span>
                {settings.showLiveIndicator !== false && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {settings.companyName} · Standar Form: {settings.docNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className={`col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl ${activeTheme.accentBtn} text-white text-xs sm:text-sm font-semibold transition cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              Buat Form Request WO
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.xlsx)
            </button>

            {session.role === "admin" && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 border border-white/15 text-xs font-semibold transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Setting
              </button>
            )}

            {session.role === "admin" && settings.showResetButton !== false && (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-600 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {settings.announcementText && (
          <div className="bg-amber-50/92 backdrop-blur-md border border-amber-300/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-amber-950 font-medium shadow-md flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
            <span>{settings.announcementText}</span>
          </div>
        )}

        {dbError && (
          <div className="bg-red-50/95 backdrop-blur-md border border-red-200 rounded-2xl p-4 text-sm text-red-800 font-medium">
            {dbError}
          </div>
        )}

        {notifBanner && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-400/40 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Form Siap Preview, Download PDF & Print
              </p>
              <p className="text-xs sm:text-sm text-slate-100">
                {notifBanner.message}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPreviewTicket(notifBanner.ticket)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Preview / PDF / Print ({settings.docNumber})
              </button>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppNotification(
                    buildNotificationText(
                      notifBanner.ticket,
                      notifBanner.eventType,
                      settings,
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() =>
                  openEmailNotification(
                    notifBanner.ticket,
                    buildNotificationText(
                      notifBanner.ticket,
                      notifBanner.eventType,
                      settings,
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setNotifBanner(null)}
                className="p-2 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {settings.showStatsCards !== false && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Tilt3DCard
              motionMode={motionMode}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-3.5 sm:p-4 shadow-lg ring-1 ring-black/5"
            >
              <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                Antrian Aktif (Waiting List)
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {activeQueue.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Urutan: P1 → P2 → P3 (FIFO)
              </p>
            </Tilt3DCard>

            <Tilt3DCard
              motionMode={motionMode}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-3.5 sm:p-4 shadow-lg ring-1 ring-black/5"
            >
              <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                Eskalasi P1 / P2
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-red-600 mt-1">
                {
                  activeQueue.filter(
                    (t) => t.priority === "P1" || t.priority === "P2",
                  ).length
                }
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Approval Management
              </p>
            </Tilt3DCard>

            <Tilt3DCard
              motionMode={motionMode}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-3.5 sm:p-4 shadow-lg ring-1 ring-black/5"
            >
              <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                In Progress
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                {tickets.filter((t) => t.status === "In Progress").length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Dikerjakan di lapangan
              </p>
            </Tilt3DCard>

            <Tilt3DCard
              motionMode={motionMode}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-3.5 sm:p-4 shadow-lg ring-1 ring-black/5"
            >
              <p className="text-[11px] sm:text-xs font-medium text-slate-600">
                Riwayat Selesai (Done)
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {completedTickets.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Arsip & Excel (.xlsx)
              </p>
            </Tilt3DCard>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-3.5 sm:p-4 space-y-3.5 shadow-lg ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/70 pb-3">
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === "queue"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Waiting List ({activeQueue.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Selesai ({completedTickets.length})
              </button>
            </div>

            {settings.showWorkflowHint !== false && (
              <p className="text-[11px] sm:text-xs text-slate-600">
                No. Form otomatis berurutan · Input pemohon, TTD Division Head & foto → Preview / PDF / Print <strong>{settings.docNumber}</strong>.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. Form, Pemohon, Dept, Keterangan..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">
                Semua Departemen ({settings.departments.length})
              </option>
              {settings.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Semua Skala Prioritas</option>
              <option value="P1">P1 - Critical / Urgent</option>
              <option value="P2">P2 - High Priority</option>
              <option value="P3">P3 - Normal (FIFO)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Waiting List">Waiting List</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Material">Pending Material</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {isLoadingDb ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-10 text-center text-sm text-slate-600">
            Menyinkronkan data dengan Cloud Firestore...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 p-8 sm:p-10 text-center space-y-3 shadow-lg">
            <p className="text-sm font-medium text-slate-700">
              Belum ada antrian Work Order atau tidak ada data yang sesuai
              filter.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl ${activeTheme.accentBtn} text-white text-xs sm:text-sm font-semibold transition cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              Buat Surat Permintaan Pekerjaan
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredTickets.map((ticket) => {
              const pMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.P3;
              const sMeta =
                STATUS_META[ticket.status] || STATUS_META["Waiting List"];
              const StatusIcon = sMeta.icon;
              const queuePos = queuePositionMap[ticket.id];
              const headChain = [
                ticket.reqSupervisor && `SPV: ${ticket.reqSupervisor}`,
                ticket.reqChief && `Chief: ${ticket.reqChief}`,
                ticket.reqManager && `Mgr: ${ticket.reqManager}`,
                ticket.reqGm && `GM: ${ticket.reqGm}`,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <Tilt3DCard
                  key={ticket.id}
                  motionMode={motionMode}
                  className={`bg-white/92 backdrop-blur-xl rounded-2xl border border-white/75 ${cardPadClass} shadow-lg ring-1 ring-black/5`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {activeTab === "queue" && queuePos && (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-2xs">
                            Antrian #{queuePos}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {ticket.id}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                          <Building2 className="w-3.5 h-3.5" />
                          {ticket.department}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                          {ticket.jobType || "Repair"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${pMeta.badge}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${pMeta.dot} ${
                              ticket.priority === "P1" ? "animate-ping" : ""
                            }`}
                          />
                          {pMeta.short}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sMeta.badge}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {ticket.description}
                      </p>

                      {ticket.photoDataUrl && (
                        <div className="pt-1">
                          <img
                            src={ticket.photoDataUrl}
                            alt="Foto Masalah / Permintaan"
                            className="h-24 w-auto max-w-xs object-cover rounded-xl border border-slate-200 shadow-xs"
                          />
                        </div>
                      )}

                      <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            <strong>Form IATF:</strong> {settings.docNumber}
                          </span>
                        </div>
                        <div>
                          <strong>Divisi Head:</strong>{" "}
                          {headChain || "TTD Manual Pada Form Cetak"}
                        </div>
                        <div>
                          <strong>Berkas Fisik:</strong> {ticket.handoverStatus}
                        </div>
                      </div>

                      {ticket.approvedByManagement && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 flex flex-wrap items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Disetujui Management:</strong>{" "}
                            {ticket.approvedByManagement}
                            {ticket.escalationReason
                              ? ` — Alasan: ${ticket.escalationReason}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span>
                          Yang Meminta: <strong>{ticket.requesterName}</strong>
                          {ticket.requesterNip ? ` (${ticket.requesterNip})` : ""}
                        </span>
                        <span>
                          Departemen: <strong>{ticket.department}</strong>
                          {ticket.section ? ` · ${ticket.section}` : ""}
                        </span>
                        <span>
                          Kategori: <strong>{ticket.category}</strong>
                        </span>
                        <span>
                          Input: <strong>{ticket.createdAt}</strong>
                        </span>
                        <span>
                          PIC Engineering:{" "}
                          <strong>
                            {ticket.assignedPic || "Belum ditentukan"}
                          </strong>
                        </span>
                      </div>

                      {ticket.engineeringNotes && (
                        <p className="text-xs text-slate-600 bg-slate-100/80 rounded-lg px-3 py-1.5">
                          <strong>Catatan Engineering:</strong>{" "}
                          {ticket.engineeringNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {(session.role === "admin" ||
                        settings.allowUserPrintForm !== false) && (
                        <button
                          type="button"
                          onClick={() => setPreviewTicket(ticket)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl ${activeTheme.accentBtn} text-white text-xs font-semibold transition cursor-pointer`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Preview / PDF / Print
                        </button>
                      )}

                      {session.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => openManageModal(ticket)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Kelola & Isi Form Penerima
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsAppNotification(
                              buildNotificationText(
                                ticket,
                                "MANUAL_LOG",
                                settings,
                              ),
                            )
                          }
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WA
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEmailNotification(
                              ticket,
                              buildNotificationText(
                                ticket,
                                "MANUAL_LOG",
                                settings,
                              ),
                            )
                          }
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                </Tilt3DCard>
              );
            })}
          </div>
        )}
      </main>

      {confirmResetOpen && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reset Antrian & Riwayat ke 0
            </h3>
            <p className="text-sm text-slate-600">
              Seluruh data antrian aktif dan riwayat Work Order di server Cloud
              akan dihapus dan nomor form dimulai ulang dari 0. Lanjutkan?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeResetFromZero}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? "Mereset..." : "Ya, Reset ke 0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Surat Permintaan Pekerjaan ({settings.docNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  No. Form otomatis berurutan sesuai standar. Isi yang meminta, departemen, TTD sampai Division Head, foto & keterangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="space-y-4 max-h-[76vh] overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yang Meminta (Name/성명) *
                  </label>
                  <input
                    type="text"
                    value={formData.requesterName}
                    onChange={(e) =>
                      setFormData({ ...formData, requesterName: e.target.value })
                    }
                    placeholder="Nama yang meminta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departement / 부서 *
                  </label>
                  <select
                    value={formData.department}
                    disabled={session.role === "user"}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white disabled:bg-slate-100"
                  >
                    {settings.departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / 사번
                  </label>
                  <input
                    type="text"
                    value={formData.requesterNip}
                    onChange={(e) =>
                      setFormData({ ...formData, requesterNip: e.target.value })
                    }
                    placeholder="NIP pemohon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section / Lokasi Line
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section: e.target.value,
                        lineLocation: e.target.value,
                      })
                    }
                    placeholder="Contoh: Line 3 / Cutting"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-950">
                  Persetujuan / TTD Sampai Division Head Terkait (Isi Nama Pejabat Terkait)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      SUPERVISOR
                    </label>
                    <input
                      type="text"
                      value={formData.reqSupervisor}
                      onChange={(e) =>
                        setFormData({ ...formData, reqSupervisor: e.target.value })
                      }
                      placeholder="Nama Supervisor"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      CHIEF
                    </label>
                    <input
                      type="text"
                      value={formData.reqChief}
                      onChange={(e) =>
                        setFormData({ ...formData, reqChief: e.target.value })
                      }
                      placeholder="Nama Chief"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      MANAGER
                    </label>
                    <input
                      type="text"
                      value={formData.reqManager}
                      onChange={(e) =>
                        setFormData({ ...formData, reqManager: e.target.value })
                      }
                      placeholder="Nama Manager"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      GM / DIVISION HEAD
                    </label>
                    <input
                      type="text"
                      value={formData.reqGm}
                      onChange={(e) =>
                        setFormData({ ...formData, reqGm: e.target.value })
                      }
                      placeholder="Nama GM / Head"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Pekerjaan / 작업 유형
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "Repair", label: "Repair / 수리" },
                      {
                        key: "Remove & Install",
                        label: "Remove & Install",
                      },
                      { key: "Service", label: "Service / 점검" },
                      { key: "Trouble", label: "Trouble / 장애" },
                    ].map((jt) => (
                      <button
                        key={jt.key}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, jobType: jt.key })
                        }
                        className={`p-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          formData.jobType === jt.key
                            ? `${activeTheme.accentBtn} text-white border-transparent`
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {jt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Sistem
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    {settings.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lampiran Foto Masalah / Permintaan
                  </label>
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[112px]">
                    <ImagePlus className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-center">
                      {formData.photoDataUrl
                        ? "Ganti Foto Masalah / Permintaan"
                        : "Klik untuk Upload Foto Masalah / Permintaan"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP (Otomatis masuk ke form cetak)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.photoDataUrl && (
                    <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                      <img
                        src={formData.photoDataUrl}
                        alt="Preview Foto Masalah"
                        className="max-h-36 mx-auto object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, photoDataUrl: "" })
                        }
                        className="mt-2 w-full py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keterangan Masalah atau Permintaan *
                  </label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tuliskan keterangan masalah atau permintaan pekerjaan secara jelas..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${activeTheme.accentBtn} text-white text-sm font-semibold cursor-pointer disabled:opacity-60`}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting
                    ? "Menerbitkan Form..."
                    : "Terbitkan Form & Preview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageTicket && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Kelola WO & Isi Form Penerima — {manageTicket.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {manageTicket.department} · {manageTicket.requesterName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageTicket(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex overflow-x-auto gap-1.5 border-b border-slate-200 pb-2.5 mb-4">
              {[
                { id: "status", label: "1. Prioritas & Status" },
                { id: "receiver", label: "2. Penerima & TTD Eng" },
                { id: "manpower", label: "3. Man Power & Material" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setManageTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    manageTab === t.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleManageSubmit}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
            >
              {manageTab === "status" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Skala Prioritas Antrian
                      </label>
                      <select
                        value={manageState.priority}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
                      >
                        <option value="P1">P1 - Critical / Urgent</option>
                        <option value="P2">P2 - High Priority</option>
                        <option value="P3">P3 - Normal (FIFO)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Status Pengerjaan
                      </label>
                      <select
                        value={manageState.status}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
                      >
                        <option value="Waiting List">Waiting List</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending Material">Pending Material</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  {(manageState.priority === "P1" ||
                    manageState.priority === "P2") && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <ArrowUpCircle className="w-4 h-4 text-amber-700" />
                        Persetujuan Management untuk Eskalasi Prioritas
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-amber-950 mb-1">
                            Disetujui Oleh (Management) *
                          </label>
                          <input
                            type="text"
                            value={manageState.approvedByManagement}
                            onChange={(e) =>
                              setManageState({
                                ...manageState,
                                approvedByManagement: e.target.value,
                              })
                            }
                            placeholder="Nama pihak Management"
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-amber-950 mb-1">
                            Alasan Eskalasi
                          </label>
                          <input
                            type="text"
                            value={manageState.escalationReason}
                            onChange={(e) =>
                              setManageState({
                                ...manageState,
                                escalationReason: e.target.value,
                              })
                            }
                            placeholder="Alasan eskalasi"
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Teknisi / PIC Engineering
                      </label>
                      <input
                        type="text"
                        value={manageState.assignedPic}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            assignedPic: e.target.value,
                          })
                        }
                        placeholder="Nama teknisi / PIC"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Status Berkas Cetak TTD
                      </label>
                      <select
                        value={manageState.handoverStatus}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            handoverStatus: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      >
                        <option value="Menunggu Berkas TTD Manual">
                          Menunggu Berkas TTD Manual
                        </option>
                        <option value="Berkas TTD Diterima Engineering">
                          Berkas TTD Diterima Engineering
                        </option>
                        <option value="Terverifikasi & Diarsipkan">
                          Terverifikasi & Diarsipkan
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Pengerjaan Engineering
                    </label>
                    <textarea
                      rows={2}
                      value={manageState.engineeringNotes}
                      onChange={(e) =>
                        setManageState({
                          ...manageState,
                          engineeringNotes: e.target.value,
                        })
                      }
                      placeholder="Catatan teknis atau hasil pekerjaan..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {manageTab === "receiver" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Terima / 접수일
                      </label>
                      <input
                        type="text"
                        value={manageState.receivedDate}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            receivedDate: e.target.value,
                          })
                        }
                        placeholder="DD-MM-YYYY"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Waktu / 시간
                      </label>
                      <input
                        type="text"
                        value={manageState.receivedTime}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            receivedTime: e.target.value,
                          })
                        }
                        placeholder="HH:MM"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Penerima / 수신자 성명
                      </label>
                      <input
                        type="text"
                        value={manageState.receiverName}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            receiverName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pelaksana Pekerjaan (Centang di Form)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Team Engineer", "Vendor"].map((exec) => (
                        <button
                          key={exec}
                          type="button"
                          onClick={() =>
                            setManageState({ ...manageState, executorType: exec })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left cursor-pointer ${
                            manageState.executorType === exec
                              ? `${activeTheme.accentBtn} text-white border-transparent`
                              : "bg-white text-slate-700 border-slate-300"
                          }`}
                        >
                          Dikerjakan Oleh {exec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Admin Engineering
                      </label>
                      <input
                        type="text"
                        value={manageState.engAdmin}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            engAdmin: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Supervisor Eng
                      </label>
                      <input
                        type="text"
                        value={manageState.engSupervisor}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            engSupervisor: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Chief Eng
                      </label>
                      <input
                        type="text"
                        value={manageState.engChief}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            engChief: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Manager HRD
                      </label>
                      <input
                        type="text"
                        value={manageState.engManagerHrd}
                        onChange={(e) =>
                          setManageState({
                            ...manageState,
                            engManagerHrd: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>

                  {manageState.executorType === "Vendor" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Section Head (Vendor)
                        </label>
                        <input
                          type="text"
                          value={manageState.vendorSectionHead}
                          onChange={(e) =>
                            setManageState({
                              ...manageState,
                              vendorSectionHead: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Project Section Head
                        </label>
                        <input
                          type="text"
                          value={manageState.vendorProjectHead}
                          onChange={(e) =>
                            setManageState({
                              ...manageState,
                              vendorProjectHead: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Vendor
                        </label>
                        <input
                          type="text"
                          value={manageState.vendorName}
                          onChange={(e) =>
                            setManageState({
                              ...manageState,
                              vendorName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {manageTab === "manpower" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Log Man Power Team Engineer
                      </span>
                      <button
                        type="button"
                        onClick={addManPowerRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Teknisi
                      </button>
                    </div>
                    {manageState.manPowerLogs.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Belum ada baris Man Power (kosong akan tercetak sebagai
                        baris tulis manual di form).
                      </p>
                    ) : (
                      manageState.manPowerLogs.map((row, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 items-center"
                        >
                          <input
                            type="text"
                            placeholder="Nama"
                            value={row.name}
                            onChange={(e) =>
                              updateManPowerRow(idx, "name", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="NIP"
                            value={row.nip}
                            onChange={(e) =>
                              updateManPowerRow(idx, "nip", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Tanggal"
                            value={row.date}
                            onChange={(e) =>
                              updateManPowerRow(idx, "date", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Mulai"
                            value={row.startTime}
                            onChange={(e) =>
                              updateManPowerRow(idx, "startTime", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Selesai"
                            value={row.endTime}
                            onChange={(e) =>
                              updateManPowerRow(idx, "endTime", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Total Jam"
                            value={row.total}
                            onChange={(e) =>
                              updateManPowerRow(idx, "total", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeManPowerRow(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg justify-self-end cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Material yang Terpakai / Sparepart
                      </span>
                      <button
                        type="button"
                        onClick={addMaterialRow}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Material
                      </button>
                    </div>
                    {manageState.materialLogs.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        Belum ada baris Material (kosong akan tercetak sebagai
                        baris tulis manual di form).
                      </p>
                    ) : (
                      manageState.materialLogs.map((mat, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 items-center"
                        >
                          <input
                            type="text"
                            placeholder="Nama Material"
                            value={mat.name}
                            onChange={(e) =>
                              updateMaterialRow(idx, "name", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Qty"
                            value={mat.qty}
                            onChange={(e) =>
                              updateMaterialRow(idx, "qty", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={mat.unit}
                            onChange={(e) =>
                              updateMaterialRow(idx, "unit", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Deskripsi"
                            value={mat.description}
                            onChange={(e) =>
                              updateMaterialRow(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Remark"
                            value={mat.remark}
                            onChange={(e) =>
                              updateMaterialRow(idx, "remark", e.target.value)
                            }
                            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeMaterialRow(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg justify-self-end cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {manageError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {manageError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setManageTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewTicket && (
        <FormPreviewModal
          ticket={previewTicket}
          settings={settings}
          onClose={() => setPreviewTicket(null)}
        />
      )}

      {isSettingsOpen && session.role === "admin" && (
        <SettingsModal
          settings={settings}
          defaultDepartments={DEFAULT_DEPARTMENTS}
          defaultCategories={DEFAULT_CATEGORIES}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}