import React, { useState } from "react";
import {
  X,
  Save,
  Lock,
  Palette,
  FileText,
  Bell,
  Building2,
  Tags,
  Plus,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  LayoutGrid,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Box,
  Video,
} from "lucide-react";

const THEME_OPTIONS = [
  {
    id: "slate",
    name: "Cyber Slate 3D",
    desc: "Futuristik netral-biru untuk operasional pabrik",
    headerClass: "bg-slate-900",
    accentClass: "bg-blue-600",
  },
  {
    id: "indigo",
    name: "Neon Indigo Aurora",
    desc: "Nuansa indigo-cyan modern & berenergi",
    headerClass: "bg-indigo-950",
    accentClass: "bg-indigo-600",
  },
  {
    id: "blue",
    name: "Quantum Navy",
    desc: "Biru dalam korporat dengan aksen cyan",
    headerClass: "bg-blue-950",
    accentClass: "bg-sky-600",
  },
  {
    id: "emerald",
    name: "Pulse Emerald",
    desc: "Hijau presisi selaras standar K3/HSE",
    headerClass: "bg-emerald-950",
    accentClass: "bg-emerald-600",
  },
  {
    id: "amber",
    name: "Solar Workshop",
    desc: "Aksen amber hangat khas bengkel & utility",
    headerClass: "bg-stone-900",
    accentClass: "bg-amber-600",
  },
  {
    id: "zinc",
    name: "Stealth Carbon",
    desc: "Monokrom tegas & minimalis modern",
    headerClass: "bg-zinc-900",
    accentClass: "bg-zinc-800",
  },
];

const BG_STYLES = [
  { id: "gradient", name: "Aurora Glow", desc: "Ambient light & partikel hidup" },
  { id: "solid", name: "Solid Clean", desc: "Warna polos bersih" },
  { id: "grid", name: "Cyber Grid", desc: "Grid 3D & scanline aktif" },
];

const MOTION_MODES = [
  {
    id: "3d-dynamic",
    name: "3D Dynamic",
    desc: "Tilt 3D interaktif + partikel & glow aktif",
  },
  {
    id: "smooth",
    name: "Ambient Smooth",
    desc: "Glow & hover halus tanpa tilt tajam",
  },
  {
    id: "lite",
    name: "Lite Mobile",
    desc: "Hemat baterai & super ringan di HP",
  },
];

const SYMBOL_OPTIONS = [
  { id: "clipboard", label: "Clipboard WO" },
  { id: "wrench", label: "Wrench / Eng" },
  { id: "shield", label: "Shield / SOP" },
  { id: "layers", label: "Layers / Queue" },
  { id: "cpu", label: "Smart System" },
  { id: "factory", label: "Plant / Building" },
];

export default function SettingsModal({
  settings,
  defaultDepartments,
  defaultCategories,
  onSave,
  onClose,
}) {
  const [tab, setTab] = useState("appearance");
  const [draft, setDraft] = useState({
    ...settings,
    confirmPin: settings.adminPin || "",
  });
  const [showPin, setShowPin] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddDept = () => {
    const val = newDept.trim().toUpperCase();
    if (!val || draft.departments.includes(val)) return;
    setDraft({ ...draft, departments: [...draft.departments, val] });
    setNewDept("");
  };

  const handleRemoveDept = (dept) => {
    if (draft.departments.length <= 1) return;
    setDraft({
      ...draft,
      departments: draft.departments.filter((d) => d !== dept),
    });
  };

  const handleAddCat = () => {
    const val = newCat.trim();
    if (!val || draft.categories.includes(val)) return;
    setDraft({ ...draft, categories: [...draft.categories, val] });
    setNewCat("");
  };

  const handleRemoveCat = (cat) => {
    if (draft.categories.length <= 1) return;
    setDraft({
      ...draft,
      categories: draft.categories.filter((c) => c !== cat),
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 240;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        setDraft((prev) => ({
          ...prev,
          customLogoDataUrl: canvas.toDataURL("image/png"),
          brandSymbol: "custom",
        }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleBgPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1280;
        const maxH = 800;
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDraft((prev) => ({
          ...prev,
          customBgImageDataUrl: canvas.toDataURL("image/jpeg", 0.72),
        }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPin = (draft.adminPin || "").trim();
    const cleanConfirm = (draft.confirmPin || "").trim();

    if (cleanPin.length < 4) {
      setErrorMsg("Password / PIN Admin minimal 4 karakter.");
      setTab("security");
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setErrorMsg("Konfirmasi Password / PIN Admin tidak cocok.");
      setTab("security");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...draft,
        adminPin: cleanPin,
        videoChannelUrl: (draft.videoChannelUrl || "").trim(),
      };
      delete payload.confirmPin;
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyimpan pengaturan ke Cloud.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-400/30">
              <Sliders className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Pengaturan Sistem, Tampilan &amp; Master Data
              </h3>
              <p className="text-xs text-slate-400">
                Tersimpan real-time ke Cloud Firestore dan langsung diterapkan ke seluruh menu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1">
          {[
            { id: "appearance", label: "Tema, 3D & Background", icon: Palette },
            { id: "video", label: "Link Video (Admin)", icon: Video },
            { id: "security", label: "Password & Keamanan", icon: Lock },
            { id: "dashboard", label: "Layout Dashboard", icon: LayoutGrid },
            { id: "document", label: "Format Form IATF", icon: FileText },
            { id: "notifications", label: "WA, Email & No. Form", icon: Bell },
            { id: "departments", label: "Departemen", icon: Building2 },
            { id: "categories", label: "Kategori", icon: Tags },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 whitespace-nowrap cursor-pointer transition ${
                  tab === item.id
                    ? "bg-white text-blue-700 border-blue-600"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {tab === "video" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950">
                Pengaturan ini <strong>hanya dapat diubah oleh Admin</strong>. Masukkan link video (YouTube, Shorts, atau link langsung <code>.mp4</code>) untuk ditampilkan pada bar <strong>INFO &amp; PENGUMUMAN TERBARU</strong> di bagian atas.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Video Pengumuman / Info (Khusus Admin)
                </label>
                <input
                  type="text"
                  value={draft.videoChannelUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, videoChannelUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=... atau https://.../video.mp4"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Video / Pengumuman
                  </label>
                  <input
                    type="text"
                    value={draft.videoChannelTitle || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, videoChannelTitle: e.target.value })
                    }
                    placeholder="Pengumuman & Info Terbaru Internal"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Singkat
                  </label>
                  <input
                    type="text"
                    value={draft.videoChannelDesc || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, videoChannelDesc: e.target.value })
                    }
                    placeholder="Informasi resmi & panduan internal"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teks Bar INFO &amp; PENGUMUMAN TERBARU (1 Baris)
                </label>
                <input
                  type="text"
                  value={draft.announcementText || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, announcementText: e.target.value })
                  }
                  placeholder="INFO & PENGUMUMAN TERBARU — Update penting & panduan internal PT Sino Indah Jaya, klik di sini untuk melihat!"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                />
              </div>
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-5">
              {/* MODE EFEK 3D & ANIMASI */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border border-cyan-400/25 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <Box className="w-4 h-4" />
                  Mode Kedalaman 3D &amp; Animasi Interaktif
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MOTION_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, motionMode: m.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        (draft.motionMode || "3d-dynamic") === m.id
                          ? "border-cyan-400 bg-cyan-500/20 text-white ring-2 ring-cyan-400/30"
                          : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className="text-[11px] text-slate-300/80 mt-0.5">
                        {m.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Identitas Perusahaan, Nama Sistem &amp; Simbol (Login, Dashboard &amp; Menu)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama PT / Perusahaan
                    </label>
                    <input
                      type="text"
                      value={draft.companyName || ""}
                      onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                      placeholder="Contoh: PT. Sino Indah Jaya"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Sistem / Aplikasi
                    </label>
                    <input
                      type="text"
                      value={draft.appTitle || ""}
                      onChange={(e) => setDraft({ ...draft, appTitle: e.target.value })}
                      placeholder="Contoh: Engineering Work Order & Waiting List"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagline / Deskripsi Singkat di Halaman Login
                  </label>
                  <input
                    type="text"
                    value={draft.loginSubtitle || ""}
                    onChange={(e) => setDraft({ ...draft, loginSubtitle: e.target.value })}
                    placeholder="Deskripsi singkat sistem pada halaman masuk"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  />
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Simbol / Logo Utama
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {SYMBOL_OPTIONS.map((sym) => (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, brandSymbol: sym.id })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                          draft.brandSymbol === sym.id
                            ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {sym.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
                      <ImagePlus className="w-4 h-4 text-blue-600" />
                      Upload Simbol / Logo Kustom
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {draft.customLogoDataUrl && (
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                        <img
                          src={draft.customLogoDataUrl}
                          alt="Logo Kustom"
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-xs text-slate-600">
                          {draft.brandSymbol === "custom"
                            ? "Logo Kustom Aktif"
                            : "Logo Kustom Tersimpan"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              customLogoDataUrl: "",
                              brandSymbol:
                                draft.brandSymbol === "custom"
                                  ? "clipboard"
                                  : draft.brandSymbol,
                            })
                          }
                          className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                      Foto Background Halaman (Bebas Upload Foto Apa Saja)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Bisa memakai foto pabrik, pemandangan, arsitektur, atau gambar apa saja untuk halaman Login &amp; Dashboard.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs">
                    <ImagePlus className="w-4 h-4" />
                    {draft.customBgImageDataUrl ? "Ganti Foto Background" : "Upload Foto Background"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {draft.customBgImageDataUrl && (
                  <div className="space-y-3 pt-1">
                    <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                      <img
                        src={draft.customBgImageDataUrl}
                        alt="Preview Background"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({ ...draft, customBgImageDataUrl: "" })
                        }
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        Hapus Foto Background
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Tingkat Kegelapan Overlay (Agar Teks Tetap Jelas)</span>
                        <span>{draft.bgOverlayOpacity ?? 55}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={draft.bgOverlayOpacity ?? 55}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bgOverlayOpacity: Number(e.target.value),
                          })
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Tema Warna Aplikasi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, theme: t.id })}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                        draft.theme === t.id
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                        <span className={`w-7 h-4 rounded ${t.headerClass}`} />
                        <span className={`w-7 h-2 rounded ${t.accentClass}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {t.name}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gaya Efek &amp; Animasi Halaman
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_STYLES.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, bgStyle: bg.id })}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          (draft.bgStyle || "gradient") === bg.id
                            ? "border-blue-600 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-xs font-bold">{bg.name}</div>
                        <div className="text-[10px] text-slate-500">{bg.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Custom Warna Background (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(draft.customBgColor || "")
                          ? draft.customBgColor
                          : "#f8fafc"
                      }
                      onChange={(e) =>
                        setDraft({ ...draft, customBgColor: e.target.value })
                      }
                      className="w-11 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={draft.customBgColor || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, customBgColor: e.target.value })
                      }
                      placeholder="Kosongkan untuk pakai tema"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                    {draft.customBgColor && (
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, customBgColor: "" })}
                        className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pengumuman / Info Banner di Dashboard
                </label>
                <input
                  type="text"
                  value={draft.announcementText || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, announcementText: e.target.value })
                  }
                  placeholder="Contoh: Jadwal preventive maintenance mesin hari Sabtu pukul 13.00 WIB..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                Ubah <strong>Password / PIN Admin Engineering</strong> di bawah ini. Password baru akan langsung berlaku saat login ke mode Admin.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password / PIN Baru Admin *
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={draft.adminPin || ""}
                      onChange={(e) =>
                        setDraft({ ...draft, adminPin: e.target.value })
                      }
                      placeholder="Minimal 4 karakter"
                      className="w-full pl-3.5 pr-10 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPin ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Konfirmasi Password / PIN Baru *
                  </label>
                  <input
                    type={showPin ? "text" : "password"}
                    value={draft.confirmPin || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, confirmPin: e.target.value })
                    }
                    placeholder="Ulangi password / PIN baru"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.requireMgmtApproval !== false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        requireMgmtApproval: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300"
                  />
                  Wajib isi Nama Approval Management saat menaikkan prioritas ke P1 / P2
                </label>

                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.allowUserPrintForm !== false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        allowUserPrintForm: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300"
                  />
                  Izinkan User Departemen mencetak / download PDF Form Request
                </label>

                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showResetButton !== false}
                    onChange={(e) =>
                      setDraft({ ...draft, showResetButton: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  Tampilkan tombol &quot;Reset&quot; data di header Admin
                </label>
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kepadatan Kartu Antrian
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-w-md">
                  {[
                    {
                      id: "comfortable",
                      label: "Comfortable",
                      desc: "Spasi lega & detail lengkap",
                    },
                    {
                      id: "compact",
                      label: "Compact",
                      desc: "Lebih ringkas untuk layar padat",
                    },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, cardDensity: d.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        (draft.cardDensity || "comfortable") === d.id
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="text-xs font-bold">{d.label}</div>
                      <div className="text-[11px] text-slate-500">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showStatsCards !== false}
                    onChange={(e) =>
                      setDraft({ ...draft, showStatsCards: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  Tampilkan 4 kartu ringkasan statistik di atas antrian
                </label>

                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showWorkflowHint !== false}
                    onChange={(e) =>
                      setDraft({ ...draft, showWorkflowHint: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  Tampilkan panduan alur SOP di bar tab Waiting List / Selesai
                </label>

                <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showLiveIndicator !== false}
                    onChange={(e) =>
                      setDraft({ ...draft, showLiveIndicator: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  Tampilkan badge status sinkronisasi real-time (&quot;Live&quot;) di header
                </label>
              </div>
            </div>
          )}

          {tab === "document" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Perusahaan di Kop Form
                </label>
                <input
                  type="text"
                  value={draft.companyName || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Dokumen Standar IATF
                </label>
                <input
                  type="text"
                  value={draft.docNumber || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, docNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Terbit
                </label>
                <input
                  type="text"
                  value={draft.docIssueDate || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, docIssueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Revisi
                </label>
                <input
                  type="text"
                  value={draft.docRevision || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, docRevision: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Halaman
                </label>
                <input
                  type="text"
                  value={draft.docPage || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, docPage: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama President Director
                </label>
                <input
                  type="text"
                  value={draft.presidentDirectorName || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      presidentDirectorName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Tujuan (628...)
                  </label>
                  <input
                    type="text"
                    value={draft.targetWhatsapp || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, targetWhatsapp: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Tujuan Notifikasi
                  </label>
                  <input
                    type="email"
                    value={draft.targetEmail || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, targetEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prefix No. Form Otomatis
                  </label>
                  <input
                    type="text"
                    value={draft.ticketPrefix || "WO"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ticketPrefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Footer Otomatis di Pesan WA / Email (Opsional)
                </label>
                <input
                  type="text"
                  value={draft.notifFooterNote || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, notifFooterNote: e.target.value })
                  }
                  placeholder="Contoh: Mohon lampirkan berkas TTD manual sesuai SOP."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {tab === "departments" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Daftar Departemen ({draft.departments.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, departments: [...defaultDepartments] })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Kembalikan Default
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="Tambah nama departemen..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddDept}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    {dept}
                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {tab === "categories" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Daftar Kategori Pekerjaan ({draft.categories.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, categories: [...defaultCategories] })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Kembalikan Default
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="Tambah kategori pekerjaan..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCat}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCat(cat)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}