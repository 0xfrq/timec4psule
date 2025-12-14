import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import Swal from "sweetalert2";
import { useSession } from "../context/SessionContext";

export default function PostView() {
  const { id } = useParams(); // ✅ /postview/:id
  const postIdParam = useMemo(() => String(id || "").trim(), [id]);

  const { user, token, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const REQUIRE_TOKEN_FOR_LIST = false;

  // ===== query param: tahun (biar badge tetap konsisten, walau postview)
  const tahunParam = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const raw = (sp.get("tahun") ?? "0").trim();
    return /^\d+$/.test(raw) ? raw : "0";
  }, [location.search]);

  // ===== base url normalized
  const apiBase = useMemo(() => (API_BASE_URL || "").replace(/\/+$/, ""), [API_BASE_URL]);

  // ===== Refs
  const feedRef = useRef(null);
  const cardElMapRef = useRef(new Map()); // id -> card element
  const videoElMapRef = useRef(new Map()); // id -> <video> (VIDEO ONLY)
  const visibilityRef = useRef(new Map()); // id -> ratio
  const inFlightRef = useRef({ comments: new Set(), topics: new Set() });
  const listFetchedRef = useRef(false);

  // ===== State
  // NOTE: tetap pakai nama "videos" biar mekanisme existing aman
  const [videos, setVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState("");

  const [commentsByPost, setCommentsByPost] = useState({});
  const [topicsByPost, setTopicsByPost] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [likedByPost, setLikedByPost] = useState({});
  const [likeCountByPost, setLikeCountByPost] = useState({});

  // (postview tidak butuh infinite, tapi dibiarkan aman)
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const lockAppendRef = useRef(false);

  // ===== Profile cache (uploaderId -> username)
  const [profileNameById, setProfileNameById] = useState({});
  const profileInFlightRef = useRef(new Set());

  // ===== Utils
  const fire = useCallback((opts) => Swal.fire(opts), []);

  // ✅ DRF Token auth (NOT Bearer)
  const rawToken = useMemo(() => {
    if (!token) return "";
    if (typeof token === "string") return token;
    return token.key || token.token || token.access || "";
  }, [token]);

  const authHeaders = useMemo(() => {
    if (!rawToken) return {};
    const hasPrefix = /^Token\s+/i.test(rawToken);
    return { Authorization: hasPrefix ? rawToken : `Token ${rawToken}` };
  }, [rawToken]);

  const handle401 = useCallback(() => {
    fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
    logout();
    navigate("/login");
  }, [fire, logout, navigate]);

  const buildMediaUrl = useCallback(
    (url) => {
      if (!url) return "";
      if (/^https?:\/\//i.test(url)) return url;
      const base = apiBase;
      const path = String(url).startsWith("/") ? url : `/${url}`;
      return `${base}${path}`;
    },
    [apiBase]
  );

  const setCardRef = useCallback((id) => {
    return (el) => {
      if (!id) return;
      if (el) cardElMapRef.current.set(String(id), el);
      else cardElMapRef.current.delete(String(id));
    };
  }, []);

  const setVideoRef = useCallback((id) => {
    return (el) => {
      if (!id) return;
      if (el) videoElMapRef.current.set(String(id), el);
      else videoElMapRef.current.delete(String(id));
    };
  }, []);

  // ===== helper: normalize year
  const normalizeYearValue = useCallback((p) => {
    const raw = p?.tahun;
    if (raw && typeof raw === "object") {
      const val = raw.tahun ?? raw.year ?? raw.value ?? "";
      return val ? String(val) : "";
    }
    if (raw !== undefined && raw !== null && raw !== "") return String(raw);
    if (p?.created_at) {
      const y = new Date(p.created_at).getFullYear();
      return Number.isFinite(y) ? String(y) : "";
    }
    return "";
  }, []);

  // ===== helper: get uploaderId
  const getUploaderId = useCallback((p) => {
    if (typeof p?.uploader === "number") return String(p.uploader);
    if (typeof p?.uploader === "string" && /^\d+$/.test(p.uploader)) return String(p.uploader);

    if (p?.uploader && typeof p.uploader === "object") {
      if (p.uploader.id) return String(p.uploader.id);
      if (p.uploader.user?.id) return String(p.uploader.user.id);
    }

    if (p?.uploader_id) return String(p.uploader_id);
    if (p?.uploaderId) return String(p.uploaderId);

    return "";
  }, []);

  // ===== fetch profile username by uploaderId
  const fetchProfileName = useCallback(
    async (userId) => {
      const uid = String(userId || "").trim();
      if (!uid || !apiBase) return;

      if (profileNameById[uid]) return;
      if (profileInFlightRef.current.has(uid)) return;

      profileInFlightRef.current.add(uid);
      try {
        const res = await fetch(`${apiBase}/api/profiles/id?id=${encodeURIComponent(uid)}`, {
          headers: { ...authHeaders },
        });

        if (res.status === 401 || res.status === 403) return handle401();
        if (!res.ok) throw new Error(`profile ${uid} ${res.status}`);

        const json = await res.json();
        const uname = json?.data?.user?.username ? String(json.data.user.username) : "";

        if (uname) setProfileNameById((prev) => ({ ...prev, [uid]: uname }));
      } catch (e) {
        console.error("fetchProfileName error:", e);
      } finally {
        profileInFlightRef.current.delete(uid);
      }
    },
    [apiBase, authHeaders, handle401, profileNameById]
  );

  // ===== Comments list (GET) (JANGAN UBAH)
  const fetchComments = useCallback(
    async (postId) => {
      if (!postId || !apiBase) return;
      setLoadingComments(true);
      try {
        const res = await fetch(`${apiBase}/api/post/${postId}/comments/`, { headers: authHeaders });
        if (res.status === 401 || res.status === 403) return handle401();
        if (!res.ok) throw new Error(`Error load comments: ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data.comments) ? data.comments : [];
        setCommentsByPost((prev) => ({ ...prev, [String(postId)]: list }));
      } catch (e) {
        console.error(e);
        setCommentsByPost((prev) => ({ ...prev, [String(postId)]: [] }));
      } finally {
        setLoadingComments(false);
      }
    },
    [apiBase, authHeaders, handle401]
  );

  // ===== Topics list (GET) (JANGAN UBAH)
  const fetchTopics = useCallback(
    async (postId) => {
      if (!postId || !apiBase) return;
      setLoadingTopics(true);
      try {
        const res = await fetch(`${apiBase}/api/post/${postId}/topics/`, { headers: authHeaders });
        if (res.status === 401 || res.status === 403) return handle401();
        if (!res.ok) throw new Error(`Error load topics: ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data.topics) ? data.topics : [];
        setTopicsByPost((prev) => ({ ...prev, [String(postId)]: list }));
      } catch (e) {
        console.error(e);
        setTopicsByPost((prev) => ({ ...prev, [String(postId)]: [] }));
      } finally {
        setLoadingTopics(false);
      }
    },
    [apiBase, authHeaders, handle401]
  );

  // ✅ reset state ketika ganti postId
  const resetStateForPost = useCallback(() => {
    setVideos([]);
    setActiveVideoId("");
    setCommentsByPost({});
    setTopicsByPost({});
    setLikedByPost({});
    setLikeCountByPost({});
    setNextCursor(null);
    setLoadingMore(false);

    lockAppendRef.current = false;
    inFlightRef.current.comments.clear();
    inFlightRef.current.topics.clear();
    visibilityRef.current.clear();
    cardElMapRef.current.clear();
    videoElMapRef.current.clear();
    listFetchedRef.current = false;
  }, []);

  useEffect(() => {
    resetStateForPost();
  }, [postIdParam, resetStateForPost]);

  // ===== Load SINGLE post detail
  // Endpoint: /api/post/<int:post_id>/
  useEffect(() => {
    if (!apiBase) return;
    if (!postIdParam) return;
    if (REQUIRE_TOKEN_FOR_LIST && !rawToken) return;
    if (listFetchedRef.current) return;

    listFetchedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/post/${encodeURIComponent(postIdParam)}/`, {
          headers: authHeaders,
        });

        if (res.status === 401 || res.status === 403) {
          listFetchedRef.current = false;
          return handle401();
        }
        if (!res.ok) {
          listFetchedRef.current = false;
          throw new Error(`Error load post: ${res.status}`);
        }

        const data = await res.json();

        // data bisa berupa {success, post:{...}} atau langsung {...}
        const p = data?.post ?? data?.data ?? data;

        const media_type = String(p?.media_type || "").toLowerCase(); // video/photo
        const uploaderId = getUploaderId(p);

        const mapped = [
          {
            id: String(p?.id ?? postIdParam),
            uploaderId,
            media_type,
            src: buildMediaUrl(p?.url),
            title: p?.description || `${media_type || "post"} #${p?.id ?? postIdParam}`,
            caption: p?.description || "",
            year: normalizeYearValue(p),
            likes: typeof p?.likes_count === "number" ? p.likes_count : 0,
          },
        ].filter((x) => !!x.src);

        setVideos(mapped);
        setActiveVideoId(String(p?.id ?? postIdParam));

        // init like count dari backend
        const initLikes = {};
        mapped.forEach((v) => (initLikes[v.id] = v.likes || 0));
        setLikeCountByPost(initLikes);

        if (uploaderId) fetchProfileName(uploaderId);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [
    apiBase,
    postIdParam,
    rawToken,
    REQUIRE_TOKEN_FOR_LIST,
    authHeaders,
    handle401,
    buildMediaUrl,
    normalizeYearValue,
    getUploaderId,
    fetchProfileName,
  ]);

  // ===== Snap tracking (tetap, aman walau cuma 1 item)
  useEffect(() => {
    const root = feedRef.current;
    if (!root || !videos.length) return;

    visibilityRef.current.clear();

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target?.dataset?.vid;
          if (!id) continue;
          visibilityRef.current.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId = "";
        let bestRatio = 0;
        for (const [id, ratio] of visibilityRef.current.entries()) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId && bestRatio >= 0.65 && bestId !== activeVideoId) {
          setActiveVideoId(bestId);
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.65, 0.8, 1], rootMargin: "-10% 0px -10% 0px" }
    );

    for (const v of videos) {
      const el = cardElMapRef.current.get(String(v.id));
      if (el) obs.observe(el);
    }

    return () => obs.disconnect();
  }, [videos, activeVideoId]);

  // ===== Autoplay active only (VIDEO ONLY)
  useEffect(() => {
    if (!activeVideoId) return;
    for (const [id, el] of videoElMapRef.current.entries()) {
      if (!el) continue;
      if (id === String(activeVideoId)) el.play?.().catch(() => {});
      else el.pause?.();
    }
  }, [activeVideoId]);

  // ===== Fetch topics/comments once per active post (JANGAN UBAH)
  useEffect(() => {
    if (!activeVideoId) return;
    const pid = String(activeVideoId);

    if (!commentsByPost[pid] && !inFlightRef.current.comments.has(pid)) {
      inFlightRef.current.comments.add(pid);
      fetchComments(pid).finally(() => inFlightRef.current.comments.delete(pid));
    }

    if (!topicsByPost[pid] && !inFlightRef.current.topics.has(pid)) {
      inFlightRef.current.topics.add(pid);
      fetchTopics(pid).finally(() => inFlightRef.current.topics.delete(pid));
    }
  }, [activeVideoId, commentsByPost, topicsByPost, fetchComments, fetchTopics]);

  // ============================
  // ✅ CREATE COMMENT (API)  (JANGAN DIUBAH)
  // ============================
  const submitComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !activeVideoId) return;

    if (!rawToken) {
      fire({ icon: "warning", title: "Login dulu", text: "Butuh authentication untuk comment." });
      return;
    }

    setCommentText("");
    try {
      const res = await fetch(`${apiBase}/api/post/${encodeURIComponent(activeVideoId)}/comments/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ text, parent_comment: null }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) return handle401();
      if (!res.ok) throw new Error(data?.detail || data?.message || `Gagal komentar (${res.status})`);

      await fetchComments(String(activeVideoId));
    } catch (e) {
      console.error(e);
      fire({ icon: "error", title: "Gagal komentar", text: e?.message || "Server error." });
    }
  }, [commentText, activeVideoId, rawToken, apiBase, authHeaders, handle401, fetchComments, fire]);

  // ============================
  // ✅ TOGGLE LIKE (API)  (JANGAN DIUBAH)
  // ============================
  const toggleLike = useCallback(
    async (postId) => {
      const pid = String(postId || "");
      if (!pid) return;

      if (!rawToken) {
        fire({ icon: "warning", title: "Login dulu", text: "Butuh authentication untuk like." });
        return;
      }

      try {
        const res = await fetch(`${apiBase}/api/post/${encodeURIComponent(pid)}/like/`, {
          method: "POST",
          headers: { ...authHeaders },
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) return handle401();
        if (!res.ok) throw new Error(data?.detail || data?.message || `Like gagal (${res.status})`);

        const action = data?.action; // liked / unliked
        const likesCount = typeof data?.likes_count === "number" ? data.likes_count : null;

        setLikedByPost((prev) => ({ ...prev, [pid]: action === "liked" }));
        if (likesCount !== null) {
          setLikeCountByPost((prev) => ({ ...prev, [pid]: likesCount }));
        }
      } catch (e) {
        console.error(e);
        fire({ icon: "error", title: "Gagal Like", text: e?.message || "Server error." });
      }
    },
    [rawToken, apiBase, authHeaders, handle401, fire]
  );

  const shareVideo = async (src) => {
    const urlToShare = src || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Post", text: "Check this out", url: urlToShare });
      } else {
        await navigator.clipboard.writeText(urlToShare);
        fire({ icon: "success", title: "Copied", text: "Link tersalin ke clipboard" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // PostView tidak perlu infinite, tapi keep aman (no-op karena nextCursor null)
  const handleScroll = useCallback(() => {}, []);

  const pid = String(activeVideoId || "");
  const activeTopics = topicsByPost[pid] || [];
  const activeComments = commentsByPost[pid] || [];

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* TOP BAR */}
      <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100">
              <i className="ri-play-circle-fill text-xl text-slate-900" />
            </div>
            <span className="text-lg">Post View</span>

            <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold ring-1 ring-slate-200 text-slate-700">
              id: {postIdParam || "-"}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold ring-1 ring-slate-200 text-slate-700">
              tahun: {tahunParam}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={`/feed?tahun=${encodeURIComponent(tahunParam)}`}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Back to Feed
            </Link>

            <div className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-xs text-slate-600">
                Halo, <b className="text-slate-900">{user?.username}</b>
              </div>
              <button
                onClick={logout}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1400px] gap-6 px-6 py-6">
        {/* LEFT: TOPICS (JANGAN UBAH TAMPILAN) */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-extrabold">Suggested Topics</div>
              <div className="text-xs text-slate-500">Post #{activeVideoId || "-"}</div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto space-y-3 p-3">
              {loadingTopics && !activeTopics.length ? (
                <div className="text-sm text-slate-500">Loading topics…</div>
              ) : activeTopics.length ? (
                activeTopics.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 hover:bg-slate-100">
                    <div className="text-sm font-bold">{t.topic}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-600">{t.desc}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Belum ada topics.</div>
              )}
            </div>
          </div>
        </aside>

        {/* CENTER: POST (video + photo) */}
        <main className="flex min-w-0 flex-1 justify-center">
          <div className="w-full max-w-[520px]">
            <div
              ref={feedRef}
              onScroll={handleScroll}
              className="hide-scrollbar h-full snap-y snap-mandatory scroll-smooth overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="tiktok-scroll">
                {!videos.length ? (
                  <div className="p-4 text-sm text-slate-600">
                    Post tidak ditemukan / belum ter-load. Endpoint: <b>/api/post/{postIdParam}/</b>
                  </div>
                ) : (
                  videos.map((v) => {
                    const isActive = String(v.id) === String(activeVideoId);
                    const isLiked = !!likedByPost[String(v.id)];
                    const likeCount = likeCountByPost[String(v.id)] ?? (v.likes || 0);

                    const uploaderId = String(v.uploaderId || "");
                    const uploaderUsername = uploaderId ? profileNameById[uploaderId] : "";

                    const mt = String(v.media_type || "video").toLowerCase();
                    const isPhoto = mt === "photo";
                    const isVideo = mt === "video";

                    return (
                      <section
                        key={v.id}
                        ref={setCardRef(v.id)}
                        data-vid={v.id}
                        className="snap-start"
                        style={{ scrollSnapStop: "always" }}
                      >
                        <div className="relative h-[calc(100vh-4rem-3rem)] w-full bg-slate-900">
                          <div className={`pointer-events-none absolute inset-0 ${isActive ? "ring-2 ring-yellow-400" : "ring-1 ring-white/10"}`} />

                          {/* MEDIA */}
                          {isVideo ? (
                            <video
                              ref={setVideoRef(v.id)}
                              src={v.src}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              controls={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoId(String(v.id));
                                const el = videoElMapRef.current.get(String(v.id));
                                if (!el) return;
                                if (el.paused) el.play?.().catch(() => {});
                                else el.pause?.();
                              }}
                              onError={(e) => console.error("VIDEO ERROR:", v.id, v.src, e)}
                            />
                          ) : isPhoto ? (
                            <img
                              src={v.src}
                              alt={v.title || `Photo #${v.id}`}
                              className="h-full w-full object-cover"
                              onClick={() => setActiveVideoId(String(v.id))}
                              onError={(e) => console.error("IMG ERROR:", v.id, v.src, e)}
                            />
                          ) : null}

                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/75 to-transparent" />

                          <div className="absolute bottom-4 left-4 right-20 text-white">
                            <div className="text-sm font-extrabold">
                              @{uploaderUsername || (uploaderId ? `user_${uploaderId}` : "user")}
                            </div>

                            <div className="mt-1 line-clamp-2 text-sm text-white/90">{v.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/90">
                              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur ring-1 ring-white/20">
                                <i className="ri-time-line mr-1" /> {v.year || "-"}
                              </span>

                              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur ring-1 ring-white/20">
                                <i className={isPhoto ? "ri-image-line mr-1" : "ri-video-line mr-1"} />
                                {isPhoto ? "photo" : "video"}
                              </span>
                            </div>
                          </div>

                          <div className="absolute right-3 top-1/2 -translate-y-1/2 space-y-3">
                            {/* ✅ LIKE API (JANGAN DIUBAH) */}
                            <button
                              className={[
                                "grid h-12 w-12 place-items-center rounded-full ring-1 ring-white/25 backdrop-blur transition",
                                isLiked ? "bg-rose-500/30" : "bg-white/15 hover:bg-white/25",
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoId(String(v.id));
                                toggleLike(v.id);
                              }}
                              title="Like"
                            >
                              <i className={isLiked ? "ri-heart-fill text-xl text-white" : "ri-heart-line text-xl text-white"} />
                            </button>
                            <div className="text-center text-[11px] text-white/85">{likeCount || 0}</div>

                            <button
                              className="grid h-12 w-12 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur hover:bg-white/25"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoId(String(v.id));
                              }}
                              title="Comment"
                            >
                              <i className="ri-chat-3-line text-xl text-white" />
                            </button>

                            <button
                              className="grid h-12 w-12 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur hover:bg-white/25"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoId(String(v.id));
                                shareVideo(v.src);
                              }}
                              title="Share"
                            >
                              <i className="ri-share-forward-line text-xl text-white" />
                            </button>
                          </div>
                        </div>
                      </section>
                    );
                  })
                )}

                {loadingMore && <div className="p-3 text-center text-sm text-slate-500">Loading…</div>}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT: COMMENTS (JANGAN UBAH TAMPILAN) */}
        <aside className="w-[380px] shrink-0">
          <div className="flex h-full flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-extrabold">
                Comments <span className="text-xs text-slate-500">({activeComments.length})</span>
              </div>
              <div className="text-xs text-slate-500">Post #{activeVideoId || "-"}</div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto space-y-4 px-4 py-3">
              {loadingComments && !activeComments.length ? (
                <div className="text-sm text-slate-500">Loading comments…</div>
              ) : activeComments.length ? (
                activeComments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 font-extrabold text-slate-700 ring-1 ring-slate-200">
                      {(c.user?.username || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {c.user?.username || c.user?.email || "User"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-700">{c.text}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Belum ada komentar.</div>
              )}
            </div>

            <div className="border-t border-slate-200 p-3">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 ring-1 ring-slate-200">
                <input
                  className="flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  type="text"
                  placeholder="Add comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                />
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white hover:opacity-90"
                  type="button"
                  onClick={submitComment}
                  title="Send"
                >
                  <i className="ri-send-plane-2-fill text-lg" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Styles: hide scrollbar but keep scroll working */}
      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
      `}</style>
    </div>
  );
}
