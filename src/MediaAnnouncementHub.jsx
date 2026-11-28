import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Play,
  Pause,
  Plus,
  Volume2,
  Upload,
  Lock,
  Unlock,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Radio,
  Trash2,
  Film,
  Save,
} from "lucide-react";

// Saluran & katalog musik gratis bawaan (bebas lisensi / CC0 / public domain)
const FREE_MUSIC_CHANNELS = [
  {
    id: "ch-relax-1",
    title: "Morning Focus & Calm Piano",
    artist: "Free Ambient Channel",
    genre: "Relax / Focus",
    duration: "03:12",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
  {
    id: "ch-upbeat-2",
    title: "Bright Team Energy",
    artist: "Open Acoustic Collective",
    genre: "Upbeat / Work",
    duration: "02:24",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=inspiring-cinematic-ambient-116199.mp3",
  },
  {
    id: "ch-soft-3",
    title: "Night Shift Chill Beat",
    artist: "Creative Commons Lo-Fi",
    genre: "Lo-Fi / Relax",
    duration: "02:45",
    url: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_95564d0b3a.mp3?filename=good-night-160166.mp3",
  },
];

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
      const embedIdx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
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
}) {
  // ---------------- 1. MUSIK & PENCARIAN SALURAN GRATIS ----------------
  const [searchQuery, setSearchQuery] = useState("relax");
  const [searchResults, setSearchResults] = useState(FREE_MUSIC_CHANNELS);
  const [searchingMusic, setSearchingMusic] = useState(false);
  const [musicSourceNote, setMusicSourceNote] = useState(
    "Saluran Musik Gratis (Jamendo & Katalog Bebas Lisensi)"
  );
  const [directAudioUrl, setDirectAudioUrl] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(FREE_MUSIC_CHANNELS[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);
  const audioFileInputRef = useRef(null);

  const runMusicSearch = async (queryText) => {
    const q = (queryText || "").trim();
    setSearchingMusic(true);

    const localFiltered = FREE_MUSIC_CHANNELS.filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q.toLowerCase()) ||
        t.artist.toLowerCase().includes(q.toLowerCase()) ||
        t.genre.toLowerCase().includes(q.toLowerCase())
    );

    try {
      // Menggunakan Jamendo API publik (client_id demo publik Jamendo)
      const endpoint = q
        ? `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=8&audioformat=mp32&search=${encodeURIComponent(
            q
          )}`
        : `https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=8&audioformat=mp32&order=popularity_total`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Gagal mengambil katalog musik");
      const json = await res.json();
      const tracks = Array.isArray(json?.results)
        ? json.results
            .filter((item) => Boolean(item.audio))
            .map((item) => {
              const sec = Number(item.duration || 0);
              const mm = String(Math.floor(sec / 60)).padStart(2, "0");
              const ss = String(sec % 60).padStart(2, "0");
              return {
                id: `jam-${item.id}`,
                title: item.name || "Untitled Track",
                artist: item.artist_name || "Jamendo Artist",
                genre: q || "Free Channel",
                duration: `${mm}:${ss}`,
                url: item.audio,
              };
            })
        : [];

      if (tracks.length > 0) {
        setSearchResults(tracks);
        setMusicSourceNote(
          `Terhubung ke Saluran Musik Gratis Jamendo (${tracks.length} lagu ditemukan)`
        );
      } else {
        setSearchResults(
          localFiltered.length ? localFiltered : FREE_MUSIC_CHANNELS
        );
        setMusicSourceNote(
          "Menampilkan Saluran Musik Gratis Tersedia (Free / CC)"
        );
      }
    } catch {
      setSearchResults(
        localFiltered.length ? localFiltered : FREE_MUSIC_CHANNELS
      );
      setMusicSourceNote(
        "Mode Saluran Musik Gratis Lokal (Bebas Lisensi)"
      );
    } finally {
      setSearchingMusic(false);
    }
  };

  useEffect(() => {
    runMusicSearch("relax");
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !selectedTrack?.url) return;
    el.src = selectedTrack.url;
    if (isPlayingAudio) {
      el.play().catch(() => setIsPlayingAudio(false));
    }
  }, [selectedTrack]);

  const handleTogglePlay = (track = selectedTrack) => {
    if (!track?.url) return;
    if (selectedTrack?.id !== track.id) {
      setSelectedTrack(track);
      setIsPlayingAudio(true);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (isPlayingAudio) {
      el.pause();
      setIsPlayingAudio(false);
    } else {
      el.play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));
    }
  };

  const handleAddDirectAudio = () => {
    const url = directAudioUrl.trim();
    if (!url) return;
    const customTrack = {
      id: `custom-${Date.now()}`,
      title: url.split("/").pop()?.split("?")[0] || "Custom Stream Audio",
      artist: "Link Musik Eksternal",
      genre: "Custom",
      duration: "Stream",
      url,
    };
    setSearchResults((prev) => [customTrack, ...prev]);
    setSelectedTrack(customTrack);
    setDirectAudioUrl("");
    setIsPlayingAudio(true);
  };

  const handleUploadAudioFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const uploadedTrack = {
      id: `file-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "File Lokal (MP3/WAV/OGG)",
      genre: "Uploaded",
      duration: "File",
      url: blobUrl,
    };
    setSearchResults((prev) => [uploadedTrack, ...prev]);
    setSelectedTrack(uploadedTrack);
    setIsPlayingAudio(true);
    e.target.value = "";
  };

  // ---------------- 2. CHANNEL VIDEO PENGUMUMAN (ADMIN EDIT, USER SHARE) ----------------
  const DEFAULT_ANNOUNCEMENT = {
    title: "Channel Info, Pengumuman, Tutorial & Promo",
    subtitle:
      "Putar video informasi pabrik, panduan SOP, tutorial sistem, maupun iklan/pengumuman internal.",
    videoUrl: "https://www.youtube.com/watch?v=3FYdL_CxVml",
    uploadedVideoUrl: "",
    updatedAt: "",
  };

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [draftTitle, setDraftTitle] = useState(DEFAULT_ANNOUNCEMENT.title);
  const [draftSubtitle, setDraftSubtitle] = useState(
    DEFAULT_ANNOUNCEMENT.subtitle
  );
  const [draftVideoUrl, setDraftVideoUrl] = useState(
    DEFAULT_ANNOUNCEMENT.videoUrl
  );
  const [draftUploadedVideo, setDraftUploadedVideo] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const videoFileInputRef = useRef(null);

  const ANNOUNCEMENT_STORAGE_KEY = `${appId}_announcement_v1`;
  const CHAT_STORAGE_KEY = `${appId}_announcement_chat_v1`;

  useEffect(() => {
    // Sinkronisasi pengumuman dari Firestore jika tersedia, atau localStorage
    if (db) {
      let unsub = null;
      (async () => {
        try {
          const fs = await import("firebase/firestore");
          const docRef = fs.doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "announcementChannel",
            "main"
          );
          unsub = fs.onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setAnnouncement((prev) => ({ ...prev, ...data }));
              if (!isAdminMode) {
                setDraftTitle(data.title || DEFAULT_ANNOUNCEMENT.title);
                setDraftSubtitle(
                  data.subtitle || DEFAULT_ANNOUNCEMENT.subtitle
                );
                setDraftVideoUrl(data.videoUrl || "");
                setDraftUploadedVideo(data.uploadedVideoUrl || "");
              }
            }
          });
        } catch {
          // fallback ke localStorage
        }
      })();
      return () => {
        if (typeof unsub === "function") unsub();
      };
    }

    try {
      const saved = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnnouncement((prev) => ({ ...prev, ...parsed }));
        setDraftTitle(parsed.title || DEFAULT_ANNOUNCEMENT.title);
        setDraftSubtitle(parsed.subtitle || DEFAULT_ANNOUNCEMENT.subtitle);
        setDraftVideoUrl(parsed.videoUrl || "");
        setDraftUploadedVideo(parsed.uploadedVideoUrl || "");
      }
    } catch {
      // abaikan error storage
    }
  }, [db, appId]);

  const handleToggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      return;
    }
    // PIN default '1234' (bisa disesuaikan sesuai kebutuhan internal)
    if (!adminPinInput || adminPinInput === "1234" || adminPinInput.toLowerCase() === "admin") {
      setIsAdminMode(true);
      setAdminPinInput("");
    } else {
      alert("PIN Admin salah. Gunakan PIN Admin (default: 1234) untuk mengedit pengumuman.");
    }
  };

  const handleUploadVideoFile = (e) => {
    if (!isAdminMode) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraftUploadedVideo(url);
    e.target.value = "";
  };

  const handleSaveAnnouncement = async () => {
    if (!isAdminMode) return;
    const payload = {
      title: draftTitle.trim() || DEFAULT_ANNOUNCEMENT.title,
      subtitle: draftSubtitle.trim() || DEFAULT_ANNOUNCEMENT.subtitle,
      videoUrl: draftVideoUrl.trim(),
      uploadedVideoUrl: draftUploadedVideo.trim(),
      updatedAt: new Date().toLocaleString("id-ID"),
    };

    setAnnouncement(payload);
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // abaikan
    }

    if (db) {
      try {
        const fs = await import("firebase/firestore");
        const docRef = fs.doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "announcementChannel",
          "main"
        );
        await fs.setDoc(docRef, payload, { merge: true });
      } catch {
        // abaikan jika firestore belum dikonfigurasi
      }
    }

    alert("Pengumuman / Video berhasil disimpan oleh Admin.");
  };

  const shareUrl = useMemo(() => {
    return announcement.videoUrl || window.location.href;
  }, [announcement.videoUrl]);

  const shareText = `${announcement.title} — ${shareUrl}`;

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const youtubeEmbedSrc = useMemo(
    () => extractYoutubeEmbedUrl(announcement.videoUrl),
    [announcement.videoUrl]
  );

  // ---------------- 3. KOMENTAR & OBROLAN LANGSUNG REALTIME ----------------
  const [senderName, setSenderName] = useState(currentUserName || "");
  const [chatInput, setChatInput] = useState("");
  const [comments, setComments] = useState([]);
  const chatEndRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (currentUserName && !senderName) {
      setSenderName(currentUserName);
    }
  }, [currentUserName]);

  useEffect(() => {
    // BroadcastChannel untuk sinkronisasi instan antar tab/jendela di browser yang sama
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(`${appId}_realtime_chat`);
      channelRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "NEW_COMMENT" && ev.data.comment) {
          setComments((prev) => {
            if (prev.some((c) => c.id === ev.data.comment.id)) return prev;
            return [...prev, ev.data.comment];
          });
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
            "announcementComments"
          );
          const q = fs.query(colRef, fs.orderBy("createdAtMs", "asc"), fs.limit(100));
          unsub = fs.onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setComments(list);
          });
        } catch {
          // fallback ke localStorage
        }
      })();
      return () => {
        if (typeof unsub === "function") unsub();
      };
    }

    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        setComments(JSON.parse(raw));
      }
    } catch {
      // abaikan
    }
  }, [db, appId]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(comments.slice(-100)));
    } catch {
      // abaikan
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const author = (senderName || currentUserName || "Karyawan / User").trim();
    const now = new Date();
    const newComment = {
      id: `cmt-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      author,
      isAdmin: isAdminMode,
      text,
      timeLabel: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAtMs: now.getTime(),
    };

    setChatInput("");
    setComments((prev) => [...prev, newComment]);
    channelRef.current?.postMessage({ type: "NEW_COMMENT", comment: newComment });

    if (db) {
      try {
        const fs = await import("firebase/firestore");
        const colRef = fs.collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "announcementComments"
        );
        await fs.addDoc(colRef, newComment);
      } catch {
        // tetap tampil dari state lokal + BroadcastChannel
      }
    }
  };

  const handleDeleteComment = (id) => {
    if (!isAdminMode) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4 mt-4">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* ================= BAGIAN 1: PENCARIAN & SALURAN MUSIK GRATIS ================= */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-4 shadow-md border border-slate-700/70 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-300 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">
                Pencarian &amp; Saluran Musik Gratis
              </h3>
              <p className="text-[11px] text-slate-300">{musicSourceNote}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer border border-white/15"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File Musik (MP3/WAV/OGG)
            </button>
            <input
              ref={audioFileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,audio/*"
              onChange={handleUploadAudioFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Baris Pencarian & Tambah Link Musik */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runMusicSearch(searchQuery);
            }}
            className="lg:col-span-5 flex items-center gap-1.5 bg-slate-950/70 border border-white/15 rounded-xl px-2.5 py-1.5"
          >
            <Search className="w-4 h-4 text-teal-300 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari musik gratis (misal: relax, piano, acoustic, lofi)..."
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searchingMusic}
              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              {searchingMusic ? "Cari..." : "Cari"}
            </button>
          </form>

          <div className="lg:col-span-7 flex items-center gap-1.5">
            <input
              type="text"
              value={directAudioUrl}
              onChange={(e) => setDirectAudioUrl(e.target.value)}
              placeholder="Tempel link file musik (.mp3 / .ogg / .wav)..."
              className="flex-1 bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddDirectAudio}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah ke Daftar
            </button>
          </div>
        </div>

        {/* Kontrol Volume & Track Aktif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/25 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTogglePlay(selectedTrack)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Putar
                </>
              )}
            </button>
            <Volume2 className="w-4 h-4 text-teal-300" />
            <span className="text-slate-200">
              Volume: {Math.round(volume * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-28 accent-teal-400 cursor-pointer"
            />
          </div>

          <div className="text-teal-200 truncate">
            Sedang dipilih:{" "}
            <strong className="text-white">
              {selectedTrack ? `${selectedTrack.title} — ${selectedTrack.artist}` : "-"}
            </strong>
          </div>
        </div>

        {/* Daftar Hasil Pencarian / Saluran Musik Gratis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
          {searchResults.map((track) => {
            const active = selectedTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border text-xs ${
                  active
                    ? "bg-teal-900/50 border-teal-400/60"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">
                    {track.title}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {track.artist} · {track.genre} ({track.duration})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePlay(track)}
                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold cursor-pointer shrink-0 inline-flex items-center gap-1"
                >
                  {active && isPlayingAudio ? (
                    <>
                      <Pause className="w-3 h-3" /> Jeda
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Putar
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= BAGIAN 2: CHANNEL VIDEO PENGUMUMAN (ADMIN EDIT, USER SHARE) ================= */}
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-2.5">
            <Film className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {announcement.title}
              </h3>
              <p className="text-xs text-slate-500">{announcement.subtitle}</p>
            </div>
          </div>

          {/* Kontrol Mode Admin */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isAdminMode ? (
              <>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="PIN Admin (1234)"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs w-32"
                />
                <button
                  type="button"
                  onClick={handleToggleAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Mode Admin
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Keluar Mode Admin
              </button>
            )}
          </div>
        </div>

        {/* Pemutar Video */}
        <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 aspect-video max-h-[420px] mx-auto w-full flex items-center justify-center">
          {announcement.uploadedVideoUrl ? (
            <video
              src={announcement.uploadedVideoUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : youtubeEmbedSrc ? (
            <iframe
              src={youtubeEmbedSrc}
              title={announcement.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : announcement.videoUrl ? (
            <video
              src={announcement.videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-slate-400 text-xs p-6 text-center">
              Belum ada video pengumuman terpasang. Admin dapat mengaturnya pada panel edit.
            </div>
          )}
        </div>

        {/* Tombol Share untuk Semua User */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Share2 className="w-4 h-4 text-sky-600" />
            <span>Bagikan Pengumuman / Info ke Medsos:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Facebook
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl
              )}&text=${encodeURIComponent(announcement.title)}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold"
            >
              Telegram
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold"
            >
              LinkedIn
            </a>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold cursor-pointer"
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

        {/* Panel Edit Khusus Admin (Tersembunyi bagi User Biasa) */}
        {isAdminMode && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-amber-950 flex items-center justify-between">
              <span>Panel Pengaturan Video &amp; Info (Khusus Admin)</span>
              {announcement.updatedAt && (
                <span className="text-[11px] font-normal text-amber-800">
                  Update terakhir: {announcement.updatedAt}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Judul Channel / Pengumuman"
                className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-900"
              />
              <input
                type="text"
                value={draftSubtitle}
                onChange={(e) => setDraftSubtitle(e.target.value)}
                placeholder="Keterangan singkat pengumuman / promo"
                className="px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-900"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={draftVideoUrl}
                onChange={(e) => setDraftVideoUrl(e.target.value)}
                placeholder="Link video YouTube / MP4 (contoh: https://www.youtube.com/watch?v=...)"
                className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-slate-800 text-xs font-semibold cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Video
              </button>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                onChange={handleUploadVideoFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleSaveAnnouncement}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </div>
        )}

        {/* ================= BAGIAN 3: KOMENTAR & OBROLAN LANGSUNG REALTIME ================= */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Komentar &amp; Obrolan Langsung Pengumuman / Info
              </h4>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime ({comments.length} pesan)
            </span>
          </div>

          {/* Daftar Komentar / Obrolan */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 max-h-64 overflow-y-auto space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Belum ada komentar. Mulai obrolan langsung terkait pengumuman, info, atau promo di atas.
              </p>
            ) : (
              comments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs shadow-2xs flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {item.author}
                      </span>
                      {item.isAdmin && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Admin
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {item.timeLabel}
                      </span>
                    </div>
                    <p className="text-slate-700 mt-0.5 whitespace-pre-wrap break-words">
                      {item.text}
                    </p>
                  </div>

                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                      title="Hapus komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Kirim Komentar / Chat Langsung */}
          <form
            onSubmit={handleSendComment}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Nama Anda (misal: Yuda / HRD)"
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 sm:w-48 shrink-0"
            />
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tulis komentar atau ngobrol langsung di sini..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}