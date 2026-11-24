import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
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
} from "lucide-react";

const DEPARTMENTS = [
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

const CATEGORIES = [
  "Mesin Produksi",
  "Listrik & Panel",
  "HVAC / AC",
  "Gedung & Sipil",
  "IT & Jaringan",
  "Forklift & Utility",
];

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

const ADMIN_PIN = "1234";
const TARGET_WHATSAPP = "6282270189045";
const TARGET_EMAIL = "yuda@pgcm.co.kr";
const STORAGE_KEY = "eng_wo_system_active_v1";

function clearAllWorkOrderStorage() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("eng_wo_")) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {
    // Abaikan jika akses storage dibatasi
  }
}

function buildNotificationText(ticket, eventType = "NEW_WO") {
  const headerMap = {
    NEW_WO: "WORK ORDER BARU MASUK (WAITING LIST)",
    ESCALATION: "ESKALASI PRIORITAS WORK ORDER (APPROVAL MANAGEMENT)",
    STATUS_UPDATE: "UPDATE STATUS WORK ORDER ENGINEERING",
    MANUAL_LOG: "DOKUMENTASI LOG WORK ORDER ENGINEERING",
  };

  const lines = [
    `*${headerMap[eventType] || "INFO WORK ORDER"}*`,
    `No. Tiket: *${ticket.id}*`,
    `Departemen: *${ticket.department}* (Pemohon: ${ticket.requesterName})`,
    `No. Form Tertulis: *${ticket.writtenFormNo}*`,
    `TTD Division Head: ${ticket.divisionHeadSignedBy}`,
    `Serah Terima Berkas: ${ticket.handoverStatus}`,
    `Judul: ${ticket.title}`,
    `Kategori & Lokasi: ${ticket.category} | ${ticket.lineLocation}`,
    `Prioritas: *${PRIORITY_META[ticket.priority]?.label || ticket.priority}*`,
    ticket.approvedByManagement
      ? `Disetujui Management: *${ticket.approvedByManagement}*`
      : `Disetujui Management: -`,
    `Status Saat Ini: *${ticket.status}*`,
    `PIC Engineering: ${ticket.assignedPic || "Belum ditugaskan"}`,
    `Waktu Input: ${ticket.createdAt}`,
    ticket.completedAt ? `Waktu Selesai: ${ticket.completedAt}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function openWhatsAppNotification(text) {
  const url = `https://wa.me/${TARGET_WHATSAPP}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function openEmailNotification(ticket, text) {
  const subject = `[WO Engineering] ${ticket.id} - ${ticket.department} (${ticket.priority} | ${ticket.status})`;
  const mailto = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(text)}`;
  window.location.href = mailto;
}

export default function App() {
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Mulai dari antrian kosong
    }
    return [];
  });

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
    writtenFormNo: "",
    divisionHeadSignedBy: "",
    handoverStatus: "Diterima Engineering",
    title: "",
    category: "Mesin Produksi",
    lineLocation: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const [manageTicket, setManageTicket] = useState(null);
  const [manageState, setManageState] = useState({
    priority: "P3",
    approvedByManagement: "",
    escalationReason: "",
    status: "Waiting List",
    assignedPic: "",
    handoverStatus: "Diterima Engineering",
    engineeringNotes: "",
  });
  const [manageError, setManageError] = useState("");

  const [notifBanner, setNotifBanner] = useState(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      // Abaikan jika kapasitas penyimpanan penuh
    }
  }, [tickets]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginName.trim()) {
      setLoginError("Nama pengguna wajib diisi.");
      return;
    }

    if (loginRole === "admin") {
      if (loginPin !== ADMIN_PIN) {
        setLoginError("PIN Admin salah. Periksa kembali PIN Admin Engineering.");
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
      setFormData((prev) => ({
        ...prev,
        department: loginDept,
        requesterName: loginName.trim(),
      }));
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
      return a.createdAt.localeCompare(b.createdAt);
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
          t.writtenFormNo,
          t.divisionHeadSignedBy,
          t.department,
          t.requesterName,
          t.title,
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
      department: session?.role === "user" ? session.department : "PRODUKSI",
      requesterName: session?.role === "user" ? session.name : "",
      writtenFormNo: "",
      divisionHeadSignedBy: "",
      handoverStatus: "Diterima Engineering",
      title: "",
      category: "Mesin Produksi",
      lineLocation: "",
      description: "",
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.requesterName.trim() ||
      !formData.writtenFormNo.trim() ||
      !formData.divisionHeadSignedBy.trim() ||
      !formData.title.trim() ||
      !formData.lineLocation.trim()
    ) {
      setFormError(
        "Lengkapi Nama Pemohon, No. Form Tertulis, Nama Division Head Penyetuju, Judul Pekerjaan, dan Lokasi/Line.",
      );
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const nextNum = String(tickets.length + 1).padStart(3, "0");
    const newTicket = {
      id: `WO-${now.getFullYear()}-${nextNum}`,
      createdAt: stamp,
      completedAt: "",
      department: formData.department,
      requesterName: formData.requesterName.trim(),
      writtenFormNo: formData.writtenFormNo.trim(),
      divisionHeadSignedBy: formData.divisionHeadSignedBy.trim(),
      handoverStatus: formData.handoverStatus,
      title: formData.title.trim(),
      category: formData.category,
      lineLocation: formData.lineLocation.trim(),
      description: formData.description.trim() || "-",
      priority: "P3",
      approvedByManagement: "",
      escalationReason: "",
      status: "Waiting List",
      assignedPic: "",
      engineeringNotes: "",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIsCreateOpen(false);
    setActiveTab("queue");
    setNotifBanner({
      ticket: newTicket,
      eventType: "NEW_WO",
      message: `Tiket ${newTicket.id} (${newTicket.department}) masuk ke Waiting List (Prioritas P3). Kirim notifikasi dokumentasi ke WhatsApp & Email:`,
    });
  };

  const openManageModal = (ticket) => {
    setManageError("");
    setManageTicket(ticket);
    setManageState({
      priority: ticket.priority,
      approvedByManagement: ticket.approvedByManagement || "",
      escalationReason: ticket.escalationReason || "",
      status: ticket.status,
      assignedPic: ticket.assignedPic || "",
      handoverStatus: ticket.handoverStatus || "Diterima Engineering",
      engineeringNotes: ticket.engineeringNotes || "",
    });
  };

  const handleManageSubmit = (e) => {
    e.preventDefault();
    setManageError("");

    const isEscalated =
      manageState.priority === "P1" || manageState.priority === "P2";

    if (isEscalated && !manageState.approvedByManagement.trim()) {
      setManageError(
        "SOP Management: Menaikkan prioritas ke P1 atau P2 WAJIB mengisi nama pihak Management yang menyetujui.",
      );
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const priorityChanged = manageState.priority !== manageTicket.priority;
    const statusChanged = manageState.status !== manageTicket.status;

    const updatedTicket = {
      ...manageTicket,
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
      completedAt:
        manageState.status === "Done" ? manageTicket.completedAt || stamp : "",
    };

    setTickets((prev) =>
      prev.map((item) => (item.id === updatedTicket.id ? updatedTicket : item)),
    );
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
        message: `Pembaruan tiket ${updatedTicket.id} (${updatedTicket.status} | ${updatedTicket.priority}) tersimpan. Kirim notifikasi ke WhatsApp & Email:`,
      });
    }
  };

  const handleExportExcel = () => {
    const formatRow = (t, idx) => ({
      No: idx + 1,
      "No. Tiket WO": t.id,
      "Tanggal Input": t.createdAt,
      "Tanggal Selesai": t.completedAt || "-",
      Departemen: t.department,
      "Nama Pemohon": t.requesterName,
      "No. Form Tertulis": t.writtenFormNo,
      "TTD Division Head": t.divisionHeadSignedBy,
      "Status Berkas Fisik": t.handoverStatus,
      "Judul Pekerjaan": t.title,
      Kategori: t.category,
      "Lokasi / Line": t.lineLocation,
      Deskripsi: t.description,
      Prioritas: PRIORITY_META[t.priority]?.label || t.priority,
      "Approval Management": t.approvedByManagement || "-",
      "Alasan Eskalasi": t.escalationReason || "-",
      "Status Pengerjaan": t.status,
      "PIC Engineering": t.assignedPic || "-",
      "Catatan Engineering": t.engineeringNotes || "-",
    });

    const wb = XLSX.utils.book_new();

    const wsAll = XLSX.utils.json_to_sheet(tickets.map(formatRow));
    XLSX.utils.book_append_sheet(wb, wsAll, "Semua Data WO");

    const wsActive = XLSX.utils.json_to_sheet(
      activeQueue.map((t, idx) => ({
        "Urutan Antrian": idx + 1,
        ...formatRow(t, idx),
      })),
    );
    XLSX.utils.book_append_sheet(wb, wsActive, "Waiting List Aktif");

    const wsDone = XLSX.utils.json_to_sheet(completedTickets.map(formatRow));
    XLSX.utils.book_append_sheet(wb, wsDone, "Riwayat Selesai");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Riwayat_Work_Order_Engineering_${today}.xlsx`);
  };

  const executeResetFromZero = () => {
    clearAllWorkOrderStorage();
    setTickets([]);
    setNotifBanner(null);
    setConfirmResetOpen(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-300 font-semibold">
                  Engineering Facility & Maintenance
                </p>
                <h1 className="text-xl font-bold">
                  Work Order & Waiting List System
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Alur terintegrasi: Form tertulis bertanda tangan Division Head
              diserahkan ke Engineering, lalu perwakilan departemen menginput ke
              antrian sistem web.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setLoginRole("user");
                  setLoginError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  loginRole === "user"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                User Departemen
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole("admin");
                  setLoginError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  loginRole === "admin"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
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
                      : "Nama perwakilan / pemohon"
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {loginRole === "user" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Departemen (10 Departemen Resmi)
                  </label>
                  <select
                    value={loginDept}
                    onChange={(e) => setLoginDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    PIN Admin Engineering
                  </label>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Masukkan PIN Admin"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Masuk ke Sistem Work Order
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Engineering Work Order & Waiting List
                </h1>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    session.role === "admin"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                  }`}
                >
                  {session.role === "admin"
                    ? `ADMIN · ${session.name}`
                    : `${session.department} · ${session.name}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                10 Departemen Terhubung · Notifikasi WA: 082270189045 · Email:
                yuda@pgcm.co.kr
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (.xlsx)
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Input Antrian WO
            </button>

            {session.role === "admin" && (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                title="Reset seluruh data antrian dan riwayat ke 0"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Antrian
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {notifBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Dokumentasi & Notifikasi Otomatis
              </p>
              <p className="text-sm text-slate-800">{notifBanner.message}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  openWhatsAppNotification(
                    buildNotificationText(
                      notifBanner.ticket,
                      notifBanner.eventType,
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Kirim ke WA (082270189045)
              </button>
              <button
                type="button"
                onClick={() =>
                  openEmailNotification(
                    notifBanner.ticket,
                    buildNotificationText(
                      notifBanner.ticket,
                      notifBanner.eventType,
                    ),
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Kirim ke yuda@pgcm.co.kr
              </button>
              <button
                type="button"
                onClick={() => setNotifBanner(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-blue-100 cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">
              Antrian Aktif (Waiting List)
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {activeQueue.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Diurutkan otomatis: P1 → P2 → P3 (FIFO)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">
              Eskalasi P1 / P2 (Approval Mgmt)
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {
                activeQueue.filter(
                  (t) => t.priority === "P1" || t.priority === "P2",
                ).length
              }
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prioritas khusus oleh Admin + Management
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">
              Sedang Dikerjakan (In Progress)
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {tickets.filter((t) => t.status === "In Progress").length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Ditangani teknisi di lapangan
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">
              Riwayat Selesai (Done)
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {completedTickets.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Siap ditarik ke Excel (.xlsx)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === "queue"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Waiting List Antrian ({activeQueue.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Riwayat Selesai ({completedTickets.length})
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Aturan: Hanya <strong>Admin Engineering</strong> yang dapat
              menaikkan prioritas setelah mendapat persetujuan{" "}
              <strong>Management</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. WO, No. Form, Div Head, Judul..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Departemen (10)</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Skala Prioritas</option>
              <option value="P1">P1 - Critical / Urgent</option>
              <option value="P2">P2 - High Priority</option>
              <option value="P3">P3 - Normal (FIFO)</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="Waiting List">Waiting List</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Material">Pending Material</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-600">
              Belum ada antrian Work Order atau tidak ada data yang sesuai dengan
              filter saat ini.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Input Antrian WO Pertama
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

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === "queue" && queuePos && (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
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
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${pMeta.badge}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${pMeta.dot}`}
                          />
                          {pMeta.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${sMeta.badge}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {ticket.status}
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        {ticket.title}
                      </h2>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {ticket.description}
                      </p>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            <strong>No. Form Tertulis:</strong>{" "}
                            {ticket.writtenFormNo}
                          </span>
                        </div>
                        <div>
                          <strong>TTD Division Head:</strong>{" "}
                          {ticket.divisionHeadSignedBy}
                        </div>
                        <div>
                          <strong>Berkas ke Engineering:</strong>{" "}
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

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 pt-1">
                        <span>
                          Pemohon: <strong>{ticket.requesterName}</strong>
                        </span>
                        <span>
                          Kategori: <strong>{ticket.category}</strong>
                        </span>
                        <span>
                          Lokasi: <strong>{ticket.lineLocation}</strong>
                        </span>
                        <span>
                          Input: <strong>{ticket.createdAt}</strong>
                        </span>
                        {ticket.completedAt && (
                          <span>
                            Selesai: <strong>{ticket.completedAt}</strong>
                          </span>
                        )}
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

                    <div className="flex lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2 shrink-0">
                      {session.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => openManageModal(ticket)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Atur Prioritas & Status
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsAppNotification(
                              buildNotificationText(ticket, "MANUAL_LOG"),
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WA
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEmailNotification(
                              ticket,
                              buildNotificationText(ticket, "MANUAL_LOG"),
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmResetOpen && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Reset Antrian & Riwayat ke 0
              </h3>
              <p className="text-sm text-slate-600">
                Seluruh data antrian aktif dan riwayat Work Order akan dihapus
                dan dimulai ulang dari 0. Lanjutkan?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetFromZero}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer"
              >
                Ya, Reset ke 0
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Input Antrian Work Order (Setelah Form Tertulis)
                </h3>
                <p className="text-xs text-slate-500">
                  Pastikan form tertulis sudah bertanda tangan Division Head dan
                  diserahkan ke Bagian Engineering.
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

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departemen Pemohon *
                  </label>
                  <select
                    value={formData.department}
                    disabled={session.role === "user"}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white disabled:bg-slate-100"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Perwakilan / Pemohon *
                  </label>
                  <input
                    type="text"
                    value={formData.requesterName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requesterName: e.target.value,
                      })
                    }
                    placeholder="Nama penginput / pemohon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    No. Form Request Tertulis *
                  </label>
                  <input
                    type="text"
                    value={formData.writtenFormNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        writtenFormNo: e.target.value,
                      })
                    }
                    placeholder="Isi nomor form tertulis"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    TTD Division Head *
                  </label>
                  <input
                    type="text"
                    value={formData.divisionHeadSignedBy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        divisionHeadSignedBy: e.target.value,
                      })
                    }
                    placeholder="Nama Div. Head penyetuju"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Serah Terima ke Engineering
                  </label>
                  <select
                    value={formData.handoverStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        handoverStatus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="Diterima Engineering">
                      Diterima Engineering
                    </option>
                    <option value="Proses Penyerahan Berkas">
                      Proses Penyerahan Berkas
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Pekerjaan / Permintaan *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ringkas dan jelas mengenai pekerjaan atau perbaikan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Pekerjaan
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Line *
                  </label>
                  <input
                    type="text"
                    value={formData.lineLocation}
                    onChange={(e) =>
                      setFormData({ ...formData, lineLocation: e.target.value })
                    }
                    placeholder="Lokasi mesin, area, atau line"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Kendala / Kebutuhan
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Jelaskan kondisi aktual, dampak operasional, atau detail teknis..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-600">
                Tiket baru otomatis masuk ke <strong>Waiting List</strong>{" "}
                dengan skala prioritas <strong>P3 - Normal (FIFO)</strong>.
                Kenaikan prioritas hanya dilakukan oleh{" "}
                <strong>Admin Engineering</strong> atas persetujuan{" "}
                <strong>Management</strong>.
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Simpan ke Waiting List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageTicket && session.role === "admin" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Kelola Prioritas & Status — {manageTicket.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {manageTicket.department} · {manageTicket.title}
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

            <form onSubmit={handleManageSubmit} className="space-y-4">
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
                      setManageState({ ...manageState, status: e.target.value })
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
                    Wajib Persetujuan Management untuk Eskalasi Prioritas
                  </div>
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
                      placeholder="Nama pihak Management yang menyetujui"
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
                      placeholder="Alasan eskalasi prioritas"
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                    />
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
                    placeholder="Nama teknisi / PIC Engineering"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Berkas Tertulis
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
                    <option value="Diterima Engineering">
                      Diterima Engineering
                    </option>
                    <option value="Terverifikasi & Diarsipkan">
                      Terverifikasi & Diarsipkan
                    </option>
                    <option value="Proses Penyerahan Berkas">
                      Proses Penyerahan Berkas
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
                  placeholder="Catatan teknis, kebutuhan sparepart, atau hasil pekerjaan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {manageError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {manageError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManageTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
