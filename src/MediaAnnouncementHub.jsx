import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Play,
  Pause,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";

const DEFAULT_AD_CONFIG = {
  bannerText:
    "INFO & PENGUMUMAN TERBARU — Update penting & panduan internal PT Sino Indah Jaya, klik di sini untuk melihat!",
  title: "Pengumuman & Info Terbaru Internal",
  subtitle:
    "Informasi resmi, panduan kerja, maupun pengumuman penting untuk seluruh tim.",
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

export default function MediaAnnouncementHub({
  db,
  appId = "wo-engineering",
  currentUserName = "",
  isAdmin = false,
  externalVideoUrl = "",
  externalBannerText = "",
  externalTitle = "",
  externalSubtitle = "",
}) {
  // ---------------- 1. PENCARIAN MUSIK ONLINE ----------------
  const [musicQuery, setMusicQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searching, setSearching] = useState(false);
  const [musicNote, setMusicNote] = useState(
    "Cari musik dari saluran gratis online lalu klik Play"
  );
  const audioRef = useRef(null);

  const handleSearchMusic = async (e) => {
    e?.preventDefault();
    const q = musicQuery.trim();
    if (!q) return;

    setSearching(true);
    setMusicNote(`Mencari "${q}"...`);
    const foundList = [];

    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&media=music&limit=6`
      );
      if (res.ok) {
        const json = await res.json();
        (json?.results || []).forEach((item, idx) => {
          if (item.previewUrl) {
            foundList.push({
              id: `it-${item.trackId || idx}-${Date.now()}`,
              title: item.trackName || "Track",
              artist: item.artistName || "Artist",
              audioUrl: item.previewUrl,
            });
          }
        });
      }
    } catch {
      // lanjut ke sumber gratis berikutnya
    }

    if (foundList.length === 0) {
      try {
        const jamRes = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=6&audioformat=mp32&search=${encodeURIComponent(
            q
          )}`
        );
        if (jamRes.ok) {
          const jamJson = await jamRes.json();
          (jamJson?.results || []).forEach((item, idx) => {
            if (item.audio) {
              foundList.push({
                id: `jam-${item.id || idx}-${Date.now()}`,
                title: item.name || "Free Track",
                artist: item.artist_name || "Free Channel",
                audioUrl: item.audio,
              });
            }
          });
        }
      } catch {
        // abaikan
      }
    }

    setTracks(foundList);
    if (foundList.length > 0) {
      setActiveTrack(foundList[0]);
      setMusicNote(`Ditemukan ${foundList.length} lagu untuk "${q}"`);
    } else {
      setActiveTrack(null);
      setIsPlaying(false);
      setMusicNote(`Tidak ditemukan lagu untuk "${q}". Coba kata kunci lain.`);
    }
    setSearching(false);
  };

  const handlePlayTrack = (track) => {
    if (!track?.audioUrl) return;
    const el = audioRef.current;
    if (!el) return;

    const same = activeTrack?.id === track.id;
    setActiveTrack(track);

    if (same && isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    el.src = track.audioUrl;
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  // ---------------- 2. BANNER INFO & PENGUMUMAN TERBARU ----------------
  const [expanded, setExpanded] = useState(false);
  const [adConfig, setAdConfig] = useState(DEFAULT_AD_CONFIG);
  const [copiedLink, setCopiedLink] = useState(false);

  const AD_KEY = `${appId}_ad_announcement_v1`;
  const CHAT_KEY = `${appId}_ad_comments_v1`;

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
            "adAnnouncement",
            "main"
          );
          unsub = fs.onSnapshot(ref, (snap) => {
            if (snap.exists()) {
              setAdConfig((prev) => ({ ...prev, ...snap.data() }));
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
      const saved = localStorage.getItem(AD_KEY);
      if (saved) {
        setAdConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // abaikan
    }
  }, [db, appId]);

  const effectiveBannerText =
    (externalBannerText || "").trim() ||
    adConfig.bannerText ||
    DEFAULT_AD_CONFIG.bannerText;
  const effectiveTitle =
    (externalTitle || "").trim() || adConfig.title || DEFAULT_AD_CONFIG.title;
  const effectiveSubtitle =
    (externalSubtitle || "").trim() ||
    adConfig.subtitle ||
    DEFAULT_AD_CONFIG.subtitle;
  const effectiveVideoUrl =
    (externalVideoUrl || "").trim() || (adConfig.videoUrl || "").trim();

  const ytEmbed = useMemo(
    () => extractYoutubeEmbedUrl(effectiveVideoUrl),
    [effectiveVideoUrl]
  );

  const shareUrl = effectiveVideoUrl || window.location.href;
  const shareText = `${effectiveTitle} — ${shareUrl}`;

  const copyShare = () => {
    navigator.clipboard?.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ---------------- 3. KOMENTAR REALTIME DI BAWAH VIDEO ----------------
  const [userName, setUserName] = useState(currentUserName || "");
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([]);
  const bcRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (currentUserName && !userName) {
      setUserName(currentUserName);
    }
  }, [currentUserName]);

  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`${appId}_ad_chat`);
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "COMMENT" && ev.data.item) {
          setComments((prev) =>
            prev.some((x) => x.id === ev.data.item.id)
              ? prev
              : [...prev, ev.data.item]
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
            "adComments"
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, expanded]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text) return;

    const now = new Date();
    const item = {
      id: `cmt-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
      author: (userName || currentUserName || "User").trim(),
      isAdmin: Boolean(isAdmin),
      text,
      timeLabel: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAtMs: now.getTime(),
    };

    setCommentInput("");
    setComments((prev) => [...prev, item]);
    bcRef.current?.postMessage({ type: "COMMENT", item });

    if (db) {
      try {
        const fs = await import("firebase/firestore");
        const colRef = fs.collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "adComments"
        );
        await fs.addDoc(colRef, item);
      } catch {
        // abaikan
      }
    }
  };

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* 1. PENCARIAN MUSIK ONLINE DI BAR ATAS */}
      <div className="rounded-xl bg-slate-900/95 text-white px-3 py-2 border border-slate-700/80 shadow-xs space-y-1.5">
        <form onSubmit={handleSearchMusic} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-teal-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={musicQuery}
              onChange={(e) => setMusicQuery(e.target.value)}
              placeholder="Cari musik gratis online (judul, artis, genre)..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer shrink-0"
          >
            {searching ? "Cari..." : "Cari"}
          </button>
          {activeTrack && (
            <button
              type="button"
              onClick={() => handlePlayTrack(activeTrack)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
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
        </form>

        <div className="text-[11px] text-slate-300 truncate">{musicNote}</div>

        {tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pt-0.5">
            {tracks.map((trk) => {
              const active = activeTrack?.id === trk.id;
              return (
                <button
                  key={trk.id}
                  type="button"
                  onClick={() => handlePlayTrack(trk)}
                  className={`text-left rounded-lg px-2.5 py-1.5 border text-xs flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? "bg-teal-950 border-teal-400 text-white"
                      : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{trk.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {trk.artist}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500 text-slate-950 shrink-0">
                    {active && isPlaying ? "Pause" : "Play"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. BARIS INFO & PENGUMUMAN TERBARU DI BAR ATAS */}
      <div className="rounded-xl overflow-hidden border border-amber-300/80 shadow-xs bg-white">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full px-3.5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105 text-white flex items-center justify-between gap-2 text-left cursor-pointer transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-yellow-200 shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">
              {effectiveBannerText}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-black/20 px-2 py-0.5 rounded-full shrink-0">
            {expanded ? (
              <>
                Tutup <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Lihat <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </span>
        </button>

        {expanded && (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {effectiveTitle}
              </h3>
              <p className="text-xs text-slate-500">{effectiveSubtitle}</p>
            </div>

            {/* Player Video (Link video diatur oleh Admin di menu Setting) */}
            <div className="rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-[380px] mx-auto w-full flex items-center justify-center">
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={effectiveTitle}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : effectiveVideoUrl ? (
                <video
                  src={effectiveVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 text-xs p-5 text-center">
                  Video pengumuman belum diatur oleh Admin di menu Setting.
                </div>
              )}
            </div>

            {/* Share ke Medsos di Bawah Video */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <Share2 className="w-3.5 h-3.5 text-sky-600" />
                Share ke Medsos:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    shareUrl
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Facebook
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(effectiveTitle)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold"
                >
                  Telegram
                </a>
                <button
                  type="button"
                  onClick={copyShare}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold cursor-pointer"
                >
                  {copiedLink ? (
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

            {/* Komentar Realtime di Bawah Video */}
            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                  Komentar &amp; Obrolan Langsung ({comments.length})
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Realtime
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 max-h-52 overflow-y-auto space-y-1.5">
                {comments.length === 0 ? (
                  <p className="text-slate-400 text-center py-3">
                    Belum ada komentar. Silakan tulis komentar di bawah video.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900">
                          {c.author}
                        </span>
                        {c.isAdmin && (
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Admin
                          </span>
                        )}
                        <span className="ml-1.5 text-[10px] text-slate-400">
                          {c.timeLabel}
                        </span>
                        <p className="text-slate-700 mt-0.5 break-words">
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
                          className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                          title="Hapus komentar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSendComment}
                className="flex flex-col sm:flex-row gap-1.5"
              >
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nama Anda"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white sm:w-40"
                />
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Tulis komentar atau ngobrol di bawah video..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}