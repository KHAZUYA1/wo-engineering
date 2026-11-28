import React, { useMemo, useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  FileText,
  BookOpen,
  Clock,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  X,
  Headphones,
} from "lucide-react";

export const DEFAULT_FOOTER_FAQS = [
  {
    id: "faq-1",
    category: "Form & Dokumen",
    q: "Bagaimana cara membuat, mengedit, dan mencetak Form Request Work Order?",
    a: "Klik 'Buat Form Request WO', lengkapi nama pemohon, departemen, jenis pekerjaan, foto/lampiran, serta keterangan. Setelah terbit, gunakan 'Preview / PDF / Print' untuk mencetak atau menyimpan PDF. Selama belum 'Done', user juga dapat menekan 'Edit / Revisi' atau 'Tarik Ulang'.",
  },
  {
    id: "faq-2",
    category: "Antrian & Prioritas",
    q: "Bagaimana urutan prioritas antrian (Waiting List) diatur?",
    a: "Antrian diprioritaskan otomatis berdasarkan P1 (Critical/Urgent), P2 (High Priority), lalu P3 (Normal/FIFO). Eskalasi ke P1 atau P2 wajib menyertakan nama persetujuan Management.",
  },
  {
    id: "faq-3",
    category: "Notifikasi & Pelaporan",
    q: "Bagaimana cara mengirim notifikasi tiket ke WhatsApp atau Email?",
    a: "Gunakan tombol 'WA' atau 'Email' pada kartu tiket maupun banner notifikasi untuk membuka pesan terformat otomatis sesuai nomor WhatsApp dan email tujuan yang dikonfigurasi.",
  },
  {
    id: "faq-4",
    category: "Admin & Media",
    q: "Bagaimana cara mengubah pengaturan sistem, master data, footer, atau link video info?",
    a: "Masuk dengan akun Admin Engineering, lalu buka menu 'Setting' untuk mengatur tema, footer & FAQ, keamanan/PIN, format dokumen, departemen, kategori, serta link video info/pengumuman.",
  },
];

export const DEFAULT_FOOTER_GUIDES = [
  {
    title: "Alur Pengajuan WO",
    desc: "Input Form -> Terbit No. WO -> Cetak/PDF TTD -> Pantau Waiting List.",
  },
  {
    title: "Standar Eskalasi P1/P2",
    desc: "Khusus kondisi darurat/berdampak operasional dengan persetujuan Management.",
  },
  {
    title: "Jam Layanan & Eskalasi",
    desc: "Respon antrian mengikuti jam operasional pabrik & eskalasi shift.",
  },
];

export function buildDefaultFooterTerms(companyName, docNumber) {
  return [
    `Setiap permintaan pekerjaan mengikuti format standar ${
      docNumber || "FM-IT-SOP-01-01"
    } milik ${
      companyName || "PT. Sino Indah Jaya"
    } dan mendapatkan nomor tiket berurutan otomatis.`,
    "Kenaikan prioritas ke P1 atau P2 tunduk pada ketentuan persetujuan Management yang berlaku.",
    "Gunakan data yang akurat dan hindari duplikasi tiket untuk pekerjaan yang sama.",
  ];
}

const GUIDE_ICONS = [FileText, ShieldCheck, Clock];

export default function AppFooter({
  companyName = "PT. Sino Indah Jaya",
  appTitle = "Engineering Work Order & Waiting List",
  docNumber = "FM-IT-SOP-01-01",
  targetWhatsapp = "6282270189045",
  targetEmail = "yuda@pgcm.co.kr",
  footerDescription,
  csLabel = "CS WhatsApp",
  csGreeting,
  serviceHours = "Senin - Sabtu · Jam Operasional Pabrik & Shift",
  faqItems,
  helpGuides,
  termsNotes,
  copyrightHolder = "Yuda Pamungkas",
  className = "",
}) {
  const resolvedFaqs =
    Array.isArray(faqItems) && faqItems.length > 0
      ? faqItems
      : DEFAULT_FOOTER_FAQS;

  const resolvedGuides =
    Array.isArray(helpGuides) && helpGuides.length > 0
      ? helpGuides.map((g, idx) => ({
          title: g.title || DEFAULT_FOOTER_GUIDES[idx % DEFAULT_FOOTER_GUIDES.length].title,
          desc: g.desc || "",
          icon: GUIDE_ICONS[idx % GUIDE_ICONS.length],
        }))
      : DEFAULT_FOOTER_GUIDES.map((g, idx) => ({
          ...g,
          icon: GUIDE_ICONS[idx % GUIDE_ICONS.length],
        }));

  const resolvedTerms =
    Array.isArray(termsNotes) && termsNotes.length > 0
      ? termsNotes
      : buildDefaultFooterTerms(companyName, docNumber);

  const [activePanel, setActivePanel] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(resolvedFaqs[0]?.id || null);
  const [faqQuery, setFaqQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(() => {
    const set = new Set(resolvedFaqs.map((item) => item.category || "Umum"));
    return ["ALL", ...Array.from(set)];
  }, [resolvedFaqs]);

  const filteredFaqs = useMemo(() => {
    return resolvedFaqs.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (!faqQuery.trim()) return true;
      const q = faqQuery.toLowerCase();
      return (
        (item.q || "").toLowerCase().includes(q) ||
        (item.a || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    });
  }, [resolvedFaqs, faqQuery, selectedCategory]);

  const cleanPhone = (targetWhatsapp || "6282270189045").replace(/\D/g, "");
  const waMessage =
    (csGreeting && csGreeting.trim()) ||
    `Halo CS ${companyName}, saya butuh bantuan terkait ${appTitle} (${docNumber}).`;
  const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  const mailSubject = `[Pusat Bantuan] ${appTitle} - ${companyName}`;
  const mailBody = `Halo Tim Support ${companyName},\n\nSaya membutuhkan bantuan terkait sistem ${appTitle} (${docNumber}).\n\nDetail kendala:\n- `;
  const mailHref = `mailto:${targetEmail}?subject=${encodeURIComponent(
    mailSubject
  )}&body=${encodeURIComponent(mailBody)}`;

  const togglePanel = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? null : panelName));
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      aria-label="Footer Pusat Bantuan dan Informasi"
      className={`relative z-10 mt-10 border-t border-white/15 bg-slate-950/92 backdrop-blur-xl text-slate-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white tracking-tight">
                {appTitle}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-400/30">
                {docNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {footerDescription ||
                `Portal operasional & antrian pekerjaan ${companyName}. Akses panduan penggunaan, jawaban cepat FAQ, serta kanal bantuan Customer Service secara langsung.`}
            </p>
            {serviceHours && (
              <p className="text-[11px] text-teal-300/90 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 shrink-0" />
                <span>{serviceHours}</span>
              </p>
            )}
          </div>

          <div className="md:col-span-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              Pusat Bantuan &amp; Informasi
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => togglePanel("faq")}
                aria-expanded={activePanel === "faq"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  activePanel === "faq"
                    ? "bg-teal-500 text-slate-950 border-teal-400"
                    : "bg-white/10 hover:bg-white/15 text-slate-100 border-white/15"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ ({resolvedFaqs.length})
                {activePanel === "faq" ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => togglePanel("help")}
                aria-expanded={activePanel === "help"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  activePanel === "help"
                    ? "bg-sky-400 text-slate-950 border-sky-300"
                    : "bg-white/10 hover:bg-white/15 text-slate-100 border-white/15"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Pusat Bantuan
              </button>

              <button
                type="button"
                onClick={() => togglePanel("legal")}
                aria-expanded={activePanel === "legal"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  activePanel === "legal"
                    ? "bg-amber-400 text-slate-950 border-amber-300"
                    : "bg-white/10 hover:bg-white/15 text-slate-100 border-white/15"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Ketentuan
              </button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2 md:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Layanan Customer Service
            </p>
            <div className="flex flex-wrap md:justify-end gap-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {csLabel || "CS WhatsApp"}
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <a
                href={mailHref}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15 text-xs font-semibold transition"
              >
                <Mail className="w-3.5 h-3.5 text-sky-300" />
                Email CS
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              WA: +{cleanPhone} · {targetEmail}
            </p>
          </div>
        </div>

        {activePanel === "faq" && (
          <div className="rounded-2xl border border-teal-400/25 bg-slate-900/95 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-300" />
                  Frequently Asked Questions (FAQ)
                </h2>
                <p className="text-xs text-slate-400">
                  Temukan jawaban cepat seputar pengajuan, antrian, cetak form,
                  dan pengaturan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Tutup FAQ"
                className="self-end sm:self-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqQuery}
                  onChange={(e) => setFaqQuery(e.target.value)}
                  placeholder="Cari pertanyaan atau kata kunci FAQ..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-teal-500 text-slate-950"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {cat === "ALL" ? "Semua" : cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-5 text-center space-y-2">
                <p className="text-xs text-slate-300">
                  Tidak ada pertanyaan yang cocok dengan pencarian Anda.
                </p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Tanyakan Langsung ke {csLabel || "CS WhatsApp"}
                </a>
              </div>
            ) : (
              <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-slate-950/50 px-3.5">
                {filteredFaqs.map((item, idx) => {
                  const itemKey = item.id || `faq-${idx}`;
                  const isOpen = openFaqId === itemKey;
                  return (
                    <div key={itemKey} className="py-3">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : itemKey)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-3 text-left cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-400/20">
                            {item.category || "Umum"}
                          </span>
                          <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-teal-200 transition">
                            {item.q}
                          </div>
                        </div>
                        <span className="mt-1 text-slate-400 group-hover:text-white shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed pl-0.5">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activePanel === "help" && (
          <div className="rounded-2xl border border-sky-400/25 bg-slate-900/95 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-300" />
                  Pusat Bantuan Operasional
                </h2>
                <p className="text-xs text-slate-400">
                  Ringkasan alur kerja standar dan kanal bantuan resmi untuk
                  pengguna maupun admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Tutup Pusat Bantuan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {resolvedGuides.map((guide) => {
                const IconComp = guide.icon || FileText;
                return (
                  <div
                    key={guide.title}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-200">
                      <IconComp className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{guide.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {guide.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3.5">
              <div className="flex items-center gap-2.5 text-xs text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Butuh bantuan cepat terkait tiket, cetak form, atau akses?
                  Hubungi Customer Service via WhatsApp.
                </span>
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {csLabel || "CS WhatsApp"}
              </a>
            </div>
          </div>
        )}

        {activePanel === "legal" && (
          <div className="rounded-2xl border border-amber-400/25 bg-slate-900/95 p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Ketentuan Penggunaan &amp; Standar Dokumen
              </h2>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Tutup Ketentuan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-5 leading-relaxed">
              {resolvedTerms.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            © {currentYear} Hak Cipta{" "}
            <strong className="text-slate-200">{copyrightHolder}</strong> ·{" "}
            <span className="text-teal-300 font-medium">{companyName}</span>
          </div>
          <div>
            Standar Dokumen:{" "}
            <span className="font-mono text-slate-300">{docNumber}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}