import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Play,
  Pause,
  Film,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  ShieldCheck,
  Lock,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";

const DEFAULT_VIDEO_CONFIG = {
  title: "Channel Info, Pengumuman, Tutorial & Promo",
  subtitle:
    "Informasi pabrik, panduan SOP, tutorial sistem, maupun pengumuman internal.",
  videoUrl: "",
  updatedAt: "",
};

function extractYoutubeEmbedUrl(rawUrl = "") {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx >= 0 && parts[idx + 1]) {
        return `https://www.youtube.com/embed/${parts[idx + 1]}`;
      }
    }
  } catch {
    return "";
  }
  return "";
}

function extractSpotifyEmbedUrl(rawUrl = "") {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("open.spotify.com")) {
      const cleanPath = u.pathname.replace(/^\/intl-[a-z]{2}\//i, "/");
      return `https://open.spotify.com/embed${cleanPath}`;
    }
  } catch {
    return "";
  }
  return "";
}

export default function MediaAnnouncementHub({
  db,
  appId = "wo-engineering",
  currentUserName = "",
  isAdmin = false,
}) {
  // ---------------- 1. PENCARIAN MUSIK ONLINE (LANGSUNG MUNCUL LIST & PLAY) ----------------
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [spotifyEmbed, setSpotifyEmbed] = useState("");
  const [searchInfo, setSearchInfo] = useState(
    "Ketik judul/artis/genre musik lalu klik Cari (tanpa perlu login Spotify)"
  );
  const audioRef = useRef(null);

  const handleSearchMusic = async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    const spUrl = extractSpotifyEmbedUrl(q);
    if (spUrl) {
      setSpotifyEmbed(spUrl);
      setTracks([]);
      setSelectedTrack(null);
      setIsPlaying(false);
      setSearchInfo("Memuat Spotify Embed Player dari link yang ditempel.");
      return;
    }

    setSpotifyEmbed("");
    setSearching(true);
    setSearchInfo(`Mencari lagu "${q}"...`);

    const collected = [];

    // Sumber 1: iTunes Search API (stabil di browser, langsung ada previewUrl & tinggal Play)
    try {
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&media=music&limit=8`
      );
      if (itunesRes.ok) {
        const itunesJson = await itunesRes.json();
        const items = Array.isArray(itunesJson?.results)
          ? itunesJson.results
          : [];
        items.forEach((item, idx) => {
          if (item.previewUrl) {
            collected.push({
              id: `it-${item.trackId || idx}-${Date.now()}`,
              title: item.trackName || "Untitled Track",
              artist: item.artistName || "Unknown Artist",
              source: "iTunes Preview",
              audioUrl: item.previewUrl,
            });
          }
        });
      }
    } catch {
      // lanjut ke sumber berikutnya
    }

    // Sumber 2: Jamendo API (musik gratis online)
    if (collected.length === 0) {
      try {
        const jamRes = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=8&audioformat=mp32&search=${encodeURIComponent(
            q
          )}`
        );
        if (jamRes.ok) {
          const jamJson = await jamRes.json();
          const items = Array.isArray(jamJson?.results)
            ? jamJson.results
            : [];
          items.forEach((item, idx) => {
            if (item.audio) {
              collected.push({
                id: `jam-${item.id || idx}-${Date.now()}`,
                title: item.name || "Free Track",
                artist: item.artist_name || "Jamendo Free",
                source: "Free Music",
                audioUrl: item.audio,
              });
            }
          });
        }
      } catch {
        // abaikan error jaringan
      }
    }

    setTracks(collected);
    if (collected.length > 0) {
      setSelectedTrack(collected[0]);
      setSearchInfo(
        `Ditemukan ${collected.length} musik untuk "${q}" — klik lagu atau Play.`
      );
    } else {
      setSelectedTrack(null);
      setIsPlaying(false);
      setSearchInfo(
        `Lagu "${q}" tidak ditemukan. Coba kata kunci lain (misal: acoustic, piano, pop, jazz).`
      );
    }
    setSearching(false);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playTrack = (track) => {
    if (!track?.audioUrl) return;
    const el = audioRef.current;
    if (!el) return;

    const isSameTrack = selectedTrack?.id === track.id;
    setSelectedTrack(track);

    if (isSameTrack && isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    el.src = track.audioUrl;
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  // ---------------- 2. TOMBOL INFO TERBARU (HIDE DULU, BUKA BERANDA VIDEO & KOMENTAR) ----------------
  const [infoOpen, setInfoOpen] = useState(false);
  const [videoConfig, setVideoConfig] = useState(DEFAULT_VIDEO_CONFIG);
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(DEFAULT_VIDEO_CONFIG.title);
  const [draftSubtitle, setDraftSubtitle] = useState(
    DEFAULT_VIDEO_CONFIG.subtitle
  );
  const [draftVideoUrl, setDraftVideoUrl] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  const VIDEO_KEY = `${appId}_admin_video_v1`;
  const CHAT_KEY = `${appId}_video_comments_v1`;

  useEffect(() => {
    if (db) {
      let unsub = null;
      (async () => {
        try {
          const fs = await import("firebase/firestore");
          const ref = fs.doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "videoAnnouncement",
            "config"
          );
          unsub = fs.onSnapshot(ref, (snap) => {
            if (snap.exists()) {
              const next = { ...DEFAULT_VIDEO_CONFIG, ...snap.data() };
              setVideoConfig(next);
              setDraftTitle(next.title);
              setDraftSubtitle(next.subtitle);
              setDraftVideoUrl(next.videoUrl || "");
            }
          });
        } catch {
          // fallback localStorage
        }
      })();
      return () => {
        if (typeof unsub === "function") unsub();
      };
    }

    try {
      const saved = localStorage.getItem(VIDEO_KEY);
      if (saved) {
        const parsed = { ...DEFAULT_VIDEO_CONFIG, ...JSON.parse(saved) };
        setVideoConfig(parsed);
        setDraftTitle(parsed.title);
        setDraftSubtitle(parsed.subtitle);
        setDraftVideoUrl(parsed.videoUrl || "");
      }
    } catch {
      // abaikan
    }
  }, [db, appId]);

  const handleSaveVideoByAdmin = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const nextConfig = {
      title: draftTitle.trim() || DEFAULT_VIDEO_CONFIG.title,
      subtitle: draftSubtitle.trim() || DEFAULT_VIDEO_CONFIG.subtitle,
      videoUrl: draftVideoUrl.trim(),
      updatedAt: new Date().toLocaleString("id-ID"),
    };
    setVideoConfig(nextConfig);
    setAdminEditOpen(false);

    try {
      localStorage.setItem(VIDEO_KEY, JSON.stringify(nextConfig));
    } catch {
      // abaikan
    }

    if (db) {
      try {
        const fs = await import("firebase/firestore");
        const ref = fs.doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "videoAnnouncement",
          "config"
        );
        await fs.setDoc(ref, nextConfig, { merge: true });
      } catch {
        // abaikan
      }
    }
  };

  const ytEmbedUrl = useMemo(
    () => extractYoutubeEmbedUrl(videoConfig.videoUrl),
    [videoConfig.videoUrl]
  );

  const shareTargetUrl = videoConfig.videoUrl || window.location.href;
  const shareMessage = `${videoConfig.title} — ${shareTargetUrl}`;

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(shareMessage);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // ---------------- 3. KOMENTAR & OBROLAN REALTIME DI BERANDA INFO TERBARU ----------------
  const [commenterName, setCommenterName] = useState(currentUserName || "");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const bcRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (currentUserName && !commenterName) {
      setCommenterName(currentUserName);
    }
  }, [currentUserName]);

  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`${appId}_video_chat`);
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "NEW_MSG" && ev.data.msg) {
          setComments((prev) =>
            prev.some((m) => m.id === ev.data.msg.id)
              ? prev
              : [...prev, ev.data.msg]
          );
        }
      };
      return () => bc.close();
    }
  }, [appId]);

  useEffect(() => {
    if (db) {
      let unsub = null;
      (async () => {
        try {
          const fs = await import("firebase/firestore");
          const colRef = fs.collection(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "videoComments"
          );
          const q = fs.query(
            colRef,
            fs.orderBy("createdAtMs", "asc"),
            fs.limit(100)
          );
          unsub = fs.onSnapshot(q, (snap) => {
            setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          });
        } catch {
          // fallback localStorage
        }
      })();
      return () => {
        if (typeof unsub === "function") unsub();
      };
    }

    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) setComments(JSON.parse(raw));
    } catch {
      // abaikan
    }
  }, [db, appId]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(comments.slice(-100)));
    } catch {
      // abaikan
    }
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, infoOpen]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const now = new Date();
    const msg = {
      id: `cmt-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
      author: (commenterName || currentUserName || "User").trim(),
      isAdmin: Boolean(isAdmin),
      text,
      timeLabel: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAtMs: now.getTime(),
    };

    setCommentText("");
    setComments((prev) => [...prev, msg]);
    bcRef.current?.postMessage({ type: "NEW_MSG", msg });

    if (db) {
      try {
        const fs = await import("firebase/firestore");
        const colRef = fs.collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "videoComments"
        );
        await fs.addDoc(colRef, msg);
      } catch {
        // abaikan
      }
    }
  };

  return (
    <div className="space-y-2.5 my-3">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* ================= BAGIAN ATAS RINGKAS: PENCARIAN MUSIK + TOMBOL INFO TERBARU ================= */}
      <div className="rounded-xl bg-slate-900 text-white p-2.5 sm:px-3.5 border border-slate-700/80 shadow-xs space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          {/* Pencarian Musik Online */}
          <form
            onSubmit={handleSearchMusic}
            className="flex items-center gap-1.5 flex-1"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-teal-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari musik gratis online atau tempel link Spotify..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              {searching ? "..." : "Cari"}
            </button>
          </form>

          {/* Kontrol Play/Pause + Volume + Tombol Info Terbaru */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {selectedTrack && (
              <button
                type="button"
                onClick={() => playTrack(selectedTrack)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Play
                  </>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-teal-300" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-teal-400 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Info Terbaru</span>
              {infoOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-300 truncate">{searchInfo}</div>

        {spotifyEmbed && (
          <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
            <iframe
              src={spotifyEmbed}
              title="Spotify Embed"
              className="w-full h-36"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}

        {/* List Hasil Pencarian Musik (Tinggal Klik Play) */}
        {tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 pt-0.5">
            {tracks.map((trk) => {
              const active = selectedTrack?.id === trk.id;
              return (
                <div
                  key={trk.id}
                  className={`rounded-lg px-2.5 py-1.5 border text-xs flex items-center justify-between gap-2 ${
                    active
                      ? "bg-teal-950 border-teal-400 text-white"
                      : "bg-slate-800/80 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{trk.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {trk.artist}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => playTrack(trk)}
                    className="px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] cursor-pointer shrink-0 inline-flex items-center gap-0.5"
                  >
                    {active && isPlaying ? (
                      <>
                        <Pause className="w-3 h-3" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Play
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= BERANDA VIDEO & KOMENTAR (MUNCUL SAAT "INFO TERBARU" DIKLIK) ================= */}
      {infoOpen && (
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {videoConfig.title}
              </h3>
              <p className="text-xs text-slate-500">{videoConfig.subtitle}</p>
            </div>

            {/* Hanya Admin yang bisa mengedit & mengatur link video */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setAdminEditOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                {adminEditOpen ? "Tutup Edit Admin" : "Edit Video (Admin)"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" /> Diatur oleh Admin
              </span>
            )}
          </div>

          {isAdmin && adminEditOpen && (
            <form
              onSubmit={handleSaveVideoByAdmin}
              className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 space-y-2.5 text-xs"
            >
              <div className="font-bold text-amber-950">
                Pengaturan Video Pengumuman (Khusus Admin)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Judul pengumuman / info / tutorial"
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-900"
                />
                <input
                  type="text"
                  value={draftSubtitle}
                  onChange={(e) => setDraftSubtitle(e.target.value)}
                  placeholder="Keterangan singkat"
                  className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-900"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={draftVideoUrl}
                  onChange={(e) => setDraftVideoUrl(e.target.value)}
                  placeholder="Masukkan link video YouTube atau MP4..."
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-900"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer shrink-0"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Video
                </button>
              </div>
            </form>
          )}

          {/* Pemutar Video */}
          <div className="rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-[390px] mx-auto w-full flex items-center justify-center">
            {ytEmbedUrl ? (
              <iframe
                src={ytEmbedUrl}
                title={videoConfig.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoConfig.videoUrl ? (
              <video
                src={videoConfig.videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-400 text-xs p-6 text-center">
                Belum ada link video pengumuman yang dipasang oleh Admin.
              </div>
            )}
          </div>

          {/* Share ke Medsos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <Share2 className="w-4 h-4 text-sky-600" />
              Bagikan ke Medsos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareTargetUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                Facebook
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(
                  shareTargetUrl
                )}&text=${encodeURIComponent(videoConfig.title)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold"
              >
                Telegram
              </a>
              <button
                type="button"
                onClick={handleCopyShare}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Komentar & Obrolan Realtime */}
          <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Komentar &amp; Obrolan Langsung ({comments.length})
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Realtime
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-56 overflow-y-auto space-y-2 text-xs">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-center py-3">
                  Belum ada komentar. Silakan tulis komentar atau ngobrol langsung di sini.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {c.author}
                        </span>
                        {c.isAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Admin
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {c.timeLabel}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-0.5 whitespace-pre-wrap break-words">
                        {c.text}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setComments((prev) =>
                            prev.filter((x) => x.id !== c.id)
                          )
                        }
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Hapus komentar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSendComment}
              className="flex flex-col sm:flex-row gap-2 text-xs"
            >
              <input
                type="text"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                placeholder="Nama Anda"
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white sm:w-44"
              />
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis komentar atau obrolan langsung di bawah video..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Kirim
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}