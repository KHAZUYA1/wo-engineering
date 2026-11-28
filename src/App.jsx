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
import MediaAnnouncementHub from "./MediaAnnouncementHub";
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
  Upload,
  Video,
  Edit3,
  Undo2,
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
  videoChannelTitle: "Channel Info, Pengumuman, Tutorial & Promo",
  videoChannelDesc:
    "Putar video informasi pabrik, panduan SOP, tutorial sistem, maupun iklan/pengumuman internal.",
  videoChannelUrl: "",
  videoChannelFileUrl: "",
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
    gradientBg: "bg-gradient-to-br from-slate-950 via-teal-950 to-sky-950",
    solidBg: "bg-slate-950",
    header: "bg-slate-950/85",
    accentBtn:
      "bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 shadow-lg shadow-teal-500/20",
    subText: "text-teal-300",
    badgeBox: "bg-gradient-to-br from-teal-400 via-cyan-500 to-sky-600",
    glowA: "bg-teal-400/20",
    glowB: "bg-sky-500/20",
    particle: "bg-teal-200/35",
  },
  indigo: {
    gradientBg: "bg-gradient-to-br from-indigo-950 via-teal-950 to-violet-950",
    solidBg: "bg-indigo-950",
    header: "bg-indigo-950/85",
    accentBtn:
      "bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 shadow-lg shadow-indigo-500/20",
    subText: "text-indigo-200",
    badgeBox: "bg-gradient-to-br from-indigo-400 via-violet-500 to-teal-400",
    glowA: "bg-indigo-400/20",
    glowB: "bg-teal-400/20",
    particle: "bg-indigo-200/35",
  },
  blue: {
    gradientBg: "bg-gradient-to-br from-sky-950 via-blue-950 to-emerald-950",
    solidBg: "bg-sky-950",
    header: "bg-sky-950/85",
    accentBtn:
      "bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 shadow-lg shadow-sky-500/20",
    subText: "text-sky-200",
    badgeBox: "bg-gradient-to-br from-sky-400 via-blue-500 to-emerald-400",
    glowA: "bg-sky-400/20",
    glowB: "bg-emerald-400/20",
    particle: "bg-sky-200/35",
  },
  emerald: {
    gradientBg: "bg-gradient-to-br from-emerald-950 via-teal-950 to-cyan-950",
    solidBg: "bg-emerald-950",
    header: "bg-emerald-950/85",
    accentBtn:
      "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/20",
    subText: "text-emerald-200",
    badgeBox: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-400",
    glowA: "bg-emerald-400/20",
    glowB: "bg-cyan-400/20",
    particle: "bg-emerald-200/35",
  },
  amber: {
    gradientBg: "bg-gradient-to-br from-stone-950 via-amber-950 to-teal-950",
    solidBg: "bg-stone-950",
    header: "bg-stone-950/85",
    accentBtn:
      "bg-gradient-to-r from-amber-500 via-orange-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 shadow-lg shadow-amber-500/20",
    subText: "text-amber-200",
    badgeBox: "bg-gradient-to-br from-amber-400 via-orange-500 to-teal-400",
    glowA: "bg-amber-400/18",
    glowB: "bg-teal-400/18",
    particle: "bg-amber-200/35",
  },
  zinc: {
    gradientBg: "bg-gradient-to-br from-zinc-950 via-slate-900 to-teal-950",
    solidBg: "bg-zinc-950",
    header: "bg-zinc-950/85",
    accentBtn:
      "bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 shadow-lg shadow-teal-600/20",
    subText: "text-teal-200",
    badgeBox: "bg-gradient-to-br from-teal-500 via-sky-500 to-indigo-500",
    glowA: "bg-teal-400/15",
    glowB: "bg-indigo-400/15",
    particle: "bg-teal-200/30",
  },
};

const PRIORITY_META = {
  P1: {
    label: "P1 - Critical / Urgent",
    short: "P1",
    rank: 1,
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    dot: "bg-rose-600",
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
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
  },
};

const STATUS_META = {
  "Waiting List": {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Clock,
  },
  "In Progress": {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Wrench,
  },
  "Pending Material": {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Package,
  },
  Done: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
};

const PARTICLES = [
  { left: "12%", top: "20%", size: "w-1.5 h-1.5", delay: "0s", dur: "9s" },
  { left: "30%", top: "70%", size: "w-2 h-2", delay: "1.8s", dur: "11s" },
  { left: "56%", top: "22%", size: "w-1.5 h-1.5", delay: "2.5s", dur: "10s" },
  { left: "78%", top: "62%", size: "w-2 h-2", delay: "1s", dur: "12s" },
  { left: "90%", top: "32%", size: "w-1.5 h-1.5", delay: "3.2s", dur: "9.5s" },
];

const COLLECTION_NAME = "work_orders";

function getEmbeddableVideoInfo(rawUrl) {
  const url = (rawUrl || "").trim();
  if (!url) return { type: "none", src: "" };

  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  if (ytMatch?.[1]) {
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  return { type: "video", src: url };
}

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

function CalmCard({ children, className = "", motionMode = "3d-dynamic" }) {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ease-out ${
        motionMode === "lite"
          ? ""
          : "hover:shadow-xl hover:border-teal-300/70"
      } ${className}`}
    >
      <div className="relative z-10">{children}</div>
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
          50% { transform: translate3d(26px, 18px, 0px) scale(1.06); }
        }
        @keyframes floatGlowB {
          0%, 100% { transform: translate3d(0px, 0px, 0px) scale(1.04); }
          50% { transform: translate3d(-24px, -18px, 0px) scale(0.98); }
        }
        @keyframes particleRise {
          0% { transform: translateY(10px) scale(0.9); opacity: 0; }
          45% { opacity: 0.65; }
          100% { transform: translateY(-22px) scale(1.05); opacity: 0; }
        }
        .animate-glow-a {
          animation: floatGlowA 15s ease-in-out infinite;
          will-change: transform;
        }
        .animate-glow-b {
          animation: floatGlowB 18s ease-in-out infinite;
          will-change: transform;
        }
        .animate-particle {
          animation: particleRise var(--dur, 10s) ease-in-out var(--delay, 0s) infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {settings.customBgImageDataUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat scale-102 transition-all duration-500 pointer-events-none"
          style={{
            backgroundImage: `url("${settings.customBgImageDataUrl}")`,
          }}
        />
      )}

      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: settings.customBgColor || "#04131c",
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
            className="w-full h-full opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(45, 212, 191, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 212, 191, 0.16) 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />
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

  // Channel Video Info, Pengumuman, Tutorial & Iklan
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoTitleDraft, setVideoTitleDraft] = useState("");
  const [videoDescDraft, setVideoDescDraft] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [videoUploadedUrl, setVideoUploadedUrl] = useState("");

  // Sesi Login
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

  // Buat / Edit Form Request WO
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
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

  // Kelola WO Admin
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
    setVideoTitleDraft(
      settings.videoChannelTitle || DEFAULT_SETTINGS.videoChannelTitle,
    );
    setVideoDescDraft(
      settings.videoChannelDesc || DEFAULT_SETTINGS.videoChannelDesc,
    );
    setVideoUrlDraft(settings.videoChannelUrl || "");
  }, [settings]);

  const handleUploadChannelVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUploadedUrl(url);
    if (!videoTitleDraft.trim()) {
      setVideoTitleDraft(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSaveChannelVideo = async () => {
    const updated = {
      ...settings,
      videoChannelTitle:
        videoTitleDraft.trim() || DEFAULT_SETTINGS.videoChannelTitle,
      videoChannelDesc:
        videoDescDraft.trim() || DEFAULT_SETTINGS.videoChannelDesc,
      videoChannelUrl: videoUrlDraft.trim(),
    };
    await handleSaveSettings(updated);
  };

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
    setEditingTicket(null);
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

  const openEditUserTicket = (ticket) => {
    setFormError("");
    setEditingTicket(ticket);
    setFormData({
      department: ticket.department || "PRODUKSI",
      requesterName: ticket.requesterName || "",
      requesterNip: ticket.requesterNip || "",
      section: ticket.section || "",
      jobType: ticket.jobType || "Repair",
      reqSupervisor: ticket.reqSupervisor || "",
      reqChief: ticket.reqChief || "",
      reqManager: ticket.reqManager || "",
      reqGm: ticket.reqGm || "",
      category: ticket.category || "Mechanical",
      lineLocation: ticket.lineLocation || "",
      photoDataUrl: ticket.photoDataUrl || "",
      description: ticket.description || "",
    });
    setIsCreateOpen(true);
  };

  const handleWithdrawUserTicket = async (ticket) => {
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, ticket.id));
      if (notifBanner?.ticket?.id === ticket.id) {
        setNotifBanner(null);
      }
    } catch (err) {
      console.error("Gagal menarik ulang form:", err);
      alert("Gagal menarik ulang form. Periksa koneksi internet Anda.");
    } finally {
      setIsSubmitting(false);
    }
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
      const cleanDesc = formData.description.trim();
      const summaryTitle =
        cleanDesc.length > 75 ? `${cleanDesc.slice(0, 75)}...` : cleanDesc;

      if (editingTicket) {
        const updatedFields = {
          department: formData.department,
          requesterName: formData.requesterName.trim(),
          requesterNip: formData.requesterNip.trim(),
          section: formData.section.trim() || formData.lineLocation.trim(),
          jobType: formData.jobType,
          reqSupervisor: formData.reqSupervisor.trim(),
          reqChief: formData.reqChief.trim(),
          reqManager: formData.reqManager.trim(),
          reqGm: formData.reqGm.trim(),
          divisionHeadSignedBy:
            formData.reqGm.trim() ||
            formData.reqManager.trim() ||
            formData.reqChief.trim() ||
            formData.reqSupervisor.trim() ||
            "TTD Manual Pada Form Cetak",
          title: summaryTitle,
          category: formData.category,
          lineLocation:
            formData.lineLocation.trim() || formData.section.trim() || "-",
          photoDataUrl: formData.photoDataUrl || "",
          description: cleanDesc,
        };

        await updateDoc(doc(db, COLLECTION_NAME, editingTicket.id), updatedFields);
        const updatedTicket = { ...editingTicket, ...updatedFields };
        setIsCreateOpen(false);
        setEditingTicket(null);
        setPreviewTicket(updatedTicket);
        setNotifBanner({
          ticket: updatedTicket,
          eventType: "NEW_WO",
          message: `Revisi form ${updatedTicket.id} berhasil disimpan! Silakan Preview / Download PDF / Print ulang.`,
        });
        return;
      }

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
        message: `Form ${newTicket.id} terbit otomatis berurutan! Silakan Preview, Download PDF, atau Print untuk TTD manual.`,
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

  const activeVideoSource = videoUploadedUrl || settings.videoChannelUrl || "";
  const embedVideo = getEmbeddableVideoInfo(activeVideoSource);

  const renderFooter = () => (
    <footer className="relative z-10 mt-10 border-t border-white/15 bg-slate-950/80 backdrop-blur-lg text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <span>
          © Hak Cipta <strong>Yuda Pamungkas</strong> ·{" "}
          <span className="text-teal-200 font-medium">
            {settings.companyName}
          </span>
        </span>
        <span className="text-slate-400 text-[11px]">
          {settings.appTitle} · {settings.docNumber}
        </span>
      </div>
    </footer>
  );

  if (!session) {
    return (
      <div
        className={`relative min-h-screen flex flex-col justify-between ${
          settings.bgStyle === "solid"
            ? activeTheme.solidBg
            : activeTheme.gradientBg
        } overflow-x-hidden`}
      >
        <FuturisticBackdrop activeTheme={activeTheme} settings={settings} />

        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <CalmCard
              motionMode={motionMode}
              className="bg-white/94 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/70 ring-1 ring-teal-400/30"
            >
              <div
                className={`${activeTheme.header} backdrop-blur-md text-white p-5 sm:p-6 border-b border-white/10`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-400/15 text-teal-200 border border-teal-300/30">
                    Sejuk, Berwarna &amp; Hidup
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 ${
                      isCustomLogoActive
                        ? "bg-white p-0"
                        : `${activeTheme.badgeBox} p-2`
                    } rounded-xl shrink-0 shadow-md overflow-hidden flex items-center justify-center ring-2 ring-teal-300/35`}
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
                <div className="grid grid-cols-2 gap-2 bg-teal-50/90 p-1 rounded-xl mb-5 border border-teal-100">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRole("user");
                      setLoginError("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      loginRole === "user"
                        ? "bg-white text-teal-950 shadow-sm"
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
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
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
            </CalmCard>
          </div>
        </div>

        {renderFooter()}
      </div>
    );
  }

  const cardPadClass =
    settings.cardDensity === "compact" ? "p-3.5 sm:p-4" : "p-4 sm:p-5";

  return (
    <div
      className={`relative min-h-screen flex flex-col justify-between ${
        settings.bgStyle === "solid"
          ? activeTheme.solidBg
          : activeTheme.gradientBg
      } text-slate-900 overflow-x-hidden`}
    >
      <FuturisticBackdrop activeTheme={activeTheme} settings={settings} />

      <div>
        <header
          className={`relative ${activeTheme.header} backdrop-blur-xl text-white border-b border-teal-400/25 sticky top-0 z-30 shadow-lg`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${
                  isCustomLogoActive
                    ? "bg-white p-0"
                    : `${activeTheme.badgeBox} p-1.5`
                } rounded-xl shrink-0 shadow-md overflow-hidden flex items-center justify-center ring-2 ring-teal-300/35`}
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
                        : "bg-teal-400/20 text-teal-200 border border-teal-300/30"
                    }`}
                  >
                    {session.role === "admin"
                      ? `ADMIN · ${session.name}`
                      : `${session.department} · ${session.name}`}
                  </span>
                  {settings.showLiveIndicator !== false && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl ${activeTheme.accentBtn} text-white text-xs sm:text-sm font-semibold transition cursor-pointer`}
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

              {session.role === "admin" &&
                settings.showResetButton !== false && (
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
          {/* Channel Video Info, Pengumuman, Tutorial & Iklan */}
          {showVideoPanel && (
            <div className="bg-white/95 backdrop-blur-xl border border-sky-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-sky-600" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {videoTitleDraft || DEFAULT_SETTINGS.videoChannelTitle}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {videoDescDraft || DEFAULT_SETTINGS.videoChannelDesc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideoPanel(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {embedVideo.type === "iframe" && (
                <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-slate-300 bg-black">
                  <iframe
                    src={embedVideo.src}
                    title="Channel Video Info & Pengumuman"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {embedVideo.type === "video" && (
                <div className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-slate-300 bg-black">
                  <video
                    src={embedVideo.src}
                    controls
                    className="w-full max-h-[380px] mx-auto"
                  />
                </div>
              )}

              {embedVideo.type === "none" && (
                <div className="rounded-xl border border-dashed border-sky-300 bg-sky-50/60 p-6 text-center text-xs text-sky-900">
                  Belum ada video diputar. Upload file video lokal atau tempel link YouTube / MP4 di bawah ini untuk info, pengumuman, tutorial, atau iklan.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={videoTitleDraft}
                  onChange={(e) => setVideoTitleDraft(e.target.value)}
                  placeholder="Judul Info / Tutorial / Iklan"
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
                <input
                  type="text"
                  value={videoDescDraft}
                  onChange={(e) => setVideoDescDraft(e.target.value)}
                  placeholder="Keterangan singkat video"
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
                <input
                  type="text"
                  value={videoUrlDraft}
                  onChange={(e) => setVideoUrlDraft(e.target.value)}
                  placeholder="Link YouTube atau URL video (.mp4)"
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
                <div className="flex items-center gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleUploadChannelVideo}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveChannelVideo}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

          {settings.announcementText && (
            <div className="bg-teal-50/95 backdrop-blur-md border border-teal-300/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-teal-950 font-medium shadow-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{settings.announcementText}</span>
            </div>
          )}

          {dbError && (
            <div className="bg-rose-50/95 backdrop-blur-md border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 font-medium">
              {dbError}
            </div>
          )}

          {notifBanner && (
            <div className="bg-slate-900/92 backdrop-blur-xl border border-teal-400/40 text-white rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Form Siap Preview, Download PDF &amp; Print
                </p>
                <p className="text-xs sm:text-sm text-slate-100">
                  {notifBanner.message}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewTicket(notifBanner.ticket)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
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
              <CalmCard
                motionMode={motionMode}
                className="bg-white/92 backdrop-blur-xl rounded-2xl border-t-4 border-t-teal-500 border border-white/75 p-3.5 sm:p-4 shadow-md"
              >
                <p className="text-[11px] sm:text-xs font-semibold text-teal-800">
                  Antrian Aktif (Waiting List)
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {activeQueue.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Urutan: P1 → P2 → P3 (FIFO)
                </p>
              </CalmCard>

              <CalmCard
                motionMode={motionMode}
                className="bg-white/92 backdrop-blur-xl rounded-2xl border-t-4 border-t-amber-500 border border-white/75 p-3.5 sm:p-4 shadow-md"
              >
                <p className="text-[11px] sm:text-xs font-semibold text-amber-800">
                  Eskalasi P1 / P2
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
                  {
                    activeQueue.filter(
                      (t) => t.priority === "P1" || t.priority === "P2",
                    ).length
                  }
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Approval Management
                </p>
              </CalmCard>

              <CalmCard
                motionMode={motionMode}
                className="bg-white/92 backdrop-blur-xl rounded-2xl border-t-4 border-t-sky-500 border border-white/75 p-3.5 sm:p-4 shadow-md"
              >
                <p className="text-[11px] sm:text-xs font-semibold text-sky-800">
                  In Progress
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                  {tickets.filter((t) => t.status === "In Progress").length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dikerjakan di lapangan
                </p>
              </CalmCard>

              <CalmCard
                motionMode={motionMode}
                className="bg-white/92 backdrop-blur-xl rounded-2xl border-t-4 border-t-emerald-500 border border-white/75 p-3.5 sm:p-4 shadow-md"
              >
                <p className="text-[11px] sm:text-xs font-semibold text-emerald-800">
                  Riwayat Selesai (Done)
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                  {completedTickets.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Arsip &amp; Excel (.xlsx)
                </p>
              </CalmCard>
            </div>
          )}

          <div className="bg-white/92 backdrop-blur-xl rounded-2xl border border-white/75 p-3.5 sm:p-4 space-y-3.5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/70 pb-3">
              <div className="grid grid-cols-2 sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeTab === "queue"
                      ? "bg-teal-900 text-white shadow-xs"
                      : "bg-teal-50 text-teal-900 hover:bg-teal-100"
                  }`}
                >
                  Waiting List ({activeQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeTab === "history"
                      ? "bg-teal-900 text-white shadow-xs"
                      : "bg-teal-50 text-teal-900 hover:bg-teal-100"
                  }`}
                >
                  Selesai ({completedTickets.length})
                </button>
              </div>

              {settings.showWorkflowHint !== false && (
                <p className="text-[11px] sm:text-xs text-slate-600">
                  User bisa <strong>Edit / Revisi</strong> atau <strong>Tarik Ulang</strong> form kapan saja bila ada kesalahan.
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">Semua Skala Prioritas</option>
                <option value="P1">P1 - Critical / Urgent</option>
                <option value="P2">P2 - High Priority</option>
                <option value="P3">P3 - Normal (FIFO)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <div className="bg-white/92 backdrop-blur-xl rounded-2xl border border-white/75 p-10 text-center text-sm text-slate-600">
              Menyinkronkan data dengan Cloud Firestore...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white/92 backdrop-blur-xl rounded-2xl border border-white/75 p-8 sm:p-10 text-center space-y-3 shadow-md">
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

                const canUserEditOrWithdraw =
                  session.role === "user" && ticket.status !== "Done";

                return (
                  <CalmCard
                    key={ticket.id}
                    motionMode={motionMode}
                    className={`bg-white/94 backdrop-blur-xl rounded-2xl border border-white/80 ${cardPadClass} shadow-md`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {activeTab === "queue" && queuePos && (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-teal-900 text-white text-xs font-bold">
                              Antrian #{queuePos}
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            {ticket.id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                            <Building2 className="w-3.5 h-3.5" />
                            {ticket.department}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-800 border border-violet-200">
                            {ticket.jobType || "Repair"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${pMeta.badge}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${pMeta.dot}`}
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
                              className="h-24 w-auto max-w-xs object-cover rounded-xl border border-slate-200"
                            />
                          </div>
                        )}

                        <div className="bg-teal-50/60 border border-teal-200/70 rounded-xl p-3 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-teal-700 shrink-0" />
                            <span>
                              <strong>Form IATF:</strong> {settings.docNumber}
                            </span>
                          </div>
                          <div>
                            <strong>Divisi Head:</strong>{" "}
                            {headChain || "TTD Manual Pada Form Cetak"}
                          </div>
                          <div>
                            <strong>Berkas Fisik:</strong>{" "}
                            {ticket.handoverStatus}
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
                            {ticket.requesterNip
                              ? ` (${ticket.requesterNip})`
                              : ""}
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

                        {canUserEditOrWithdraw && (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => openEditUserTicket(ticket)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit / Revisi
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleWithdrawUserTicket(ticket)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Tarik Ulang
                            </button>
                          </div>
                        )}

                        {session.role === "admin" && (
                          <button
                            type="button"
                            onClick={() => openManageModal(ticket)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-900 hover:bg-teal-800 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Kelola &amp; Isi Form Penerima
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2 w-full">
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
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
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
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </CalmCard>
                );
              })}
            </div>
          )}

          <MediaAnnouncementHub
            db={db}
            appId="wo-engineering"
            currentUserName={formData?.requesterName || session?.name || ""}
            isAdmin={session?.role === "admin"}
          />
        </main>
      </div>

      {renderFooter()}

      {confirmResetOpen && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reset Antrian &amp; Riwayat ke 0
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? "Mereset..." : "Ya, Reset ke 0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-4">
          <div className="m-auto bg-white/96 backdrop-blur-xl rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingTicket
                    ? `Edit / Revisi Form — ${editingTicket.id}`
                    : `Surat Permintaan Pekerjaan (${settings.docNumber})`}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTicket
                    ? "Perbarui data yang salah lalu simpan revisi form."
                    : "No. Form otomatis berurutan sesuai standar. Isi yang meminta, departemen, TTD sampai Division Head, foto & keterangan."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTicket(null);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="space-y-4 max-h-[76vh] overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-teal-50/60 p-3.5 rounded-xl border border-teal-200/70">
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
                        setFormData({
                          ...formData,
                          reqSupervisor: e.target.value,
                        })
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
                    <ImagePlus className="w-6 h-6 text-teal-600" />
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
                        className="mt-2 w-full py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
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
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTicket(null);
                  }}
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
                    ? "Menyimpan..."
                    : editingTicket
                      ? "Simpan Revisi Form"
                      : "Terbitkan Form & Preview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageTicket && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-4">
          <div className="m-auto bg-white/96 backdrop-blur-xl rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Kelola WO &amp; Isi Form Penerima — {manageTicket.id}
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
                      ? "bg-teal-900 text-white"
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
                          Terverifikasi &amp; Diarsipkan
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Section Head (TTD / Nama)
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
                          placeholder="Kosongkan bila TTD manual luas"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Project Section head (TTD / Nama)
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
                          placeholder="Kosongkan bila TTD manual luas"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Vendor (TTD / Nama)
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
                          placeholder="Nama / TTD Vendor"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-semibold cursor-pointer"
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
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg justify-self-end cursor-pointer"
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
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg justify-self-end cursor-pointer"
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
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
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
                  className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
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