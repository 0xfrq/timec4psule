import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import Swal from "sweetalert2";
import { useSession } from "../context/SessionContext";

export default function Dashboard() {
  const { user, token, logout } = useSession();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const apiBase = useMemo(() => (API_BASE_URL || "http://localhost:8000").replace(/\/+$/, ""), [API_BASE_URL]);

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
      const path = String(url).startsWith("/") ? url : `/${url}`;
      return `${apiBase}${path}`;
    },
    [apiBase]
  );

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [profileUsername, setProfileUsername] = useState("");

  // ✅ ambil posts dari /api/post/list/<user_id>/
  useEffect(() => {
    const uid = user?.id || user?.user_id || user?.pk; // fallback aman
    if (!uid) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/post/list/${encodeURIComponent(uid)}/`, {
          headers: { ...authHeaders },
        });

        if (res.status === 401 || res.status === 403) return handle401();
        if (!res.ok) throw new Error(`Load posts gagal (${res.status})`);

        const data = await res.json();
        const items = Array.isArray(data.posts) ? data.posts : [];

        const mapped = items
          .filter((p) => {
            const mt = String(p.media_type || "").toLowerCase();
            return mt === "video" || mt === "photo";
          })
          .map((p) => ({
            id: String(p.id),
            media_type: String(p.media_type || "").toLowerCase(),
            src: buildMediaUrl(p.url),
            title: p.description || "",
            year:
              typeof p?.tahun === "object"
                ? String(p.tahun?.tahun ?? "")
                : p?.tahun != null
                ? String(p.tahun)
                : p?.created_at
                ? String(new Date(p.created_at).getFullYear())
                : "",
            likes: typeof p.likes_count === "number" ? p.likes_count : 0,
            comments: typeof p.comments_count === "number" ? p.comments_count : 0,
            created_at: p.created_at,
          }))
          .filter((x) => !!x.src);

        setPosts(mapped);

        // ✅ username dari response kalau ada (contoh kamu: { username: "tio" })
        if (typeof data.username === "string") setProfileUsername(data.username);
        else if (user?.username) setProfileUsername(user.username);
      } catch (e) {
        console.error(e);
        fire({ icon: "error", title: "Gagal load dashboard", text: e?.message || "Server error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase, authHeaders, buildMediaUrl, handle401, fire, user]);

  const openPost = useCallback(
    (postId) => {
      if (!postId) return;
      navigate(`/postview/${encodeURIComponent(String(postId))}`);
    },
    [navigate]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOP BAR */}
      <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-3 px-6">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100">
              <i className="ri-user-3-fill text-xl text-slate-900" />
            </div>
            <span className="text-lg">Dashboard</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/feed"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Feed
            </Link>
            <Link
              to="/uploadvideo"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Upload
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        {/* PROFILE HEADER */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
              <i className="ri-user-smile-line text-2xl text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-extrabold truncate">
                @{profileUsername || user?.username || "user"}
              </div>
              <div className="text-sm text-slate-500">
                Total posts: <b className="text-slate-900">{posts.length}</b>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS */}
        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-extrabold">My Posts</div>
            <div className="text-xs text-slate-500">Klik media untuk buka PostView</div>
          </div>

          <div className="hide-scrollbar max-h-[70vh] overflow-auto p-5">
            {loading ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : !posts.length ? (
              <div className="text-sm text-slate-500">Belum ada post.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {posts.map((p) => {
                  const isVideo = p.media_type === "video";
                  const isPhoto = p.media_type === "photo";

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPost(p.id)}
                      className="group relative overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200"
                      title="Open PostView"
                    >
                      {/* media */}
                      {isVideo ? (
                        <video
                          src={p.src}
                          className="h-44 w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : isPhoto ? (
                        <img src={p.src} alt={p.title || `Photo ${p.id}`} className="h-44 w-full object-cover" />
                      ) : null}

                      {/* overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-100" />
                      <div className="absolute bottom-2 left-2 right-2 text-left text-white">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-full bg-white/15 px-2 py-1 ring-1 ring-white/20">
                            <i className={isVideo ? "ri-video-line" : "ri-image-line"} /> {p.media_type}
                          </span>
                          <span className="rounded-full bg-white/15 px-2 py-1 ring-1 ring-white/20">
                            <i className="ri-time-line" /> {p.year || "-"}
                          </span>
                        </div>

                        <div className="mt-2 line-clamp-2 text-xs text-white/90">
                          {p.title || (isVideo ? "Video" : "Photo")}
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/85">
                          <span>
                            <i className="ri-heart-3-line" /> {p.likes}
                          </span>
                          <span>
                            <i className="ri-chat-3-line" /> {p.comments}
                          </span>
                        </div>
                      </div>

                      <div className="absolute right-2 top-2 rounded-full bg-white/15 p-2 ring-1 ring-white/20 opacity-0 transition group-hover:opacity-100">
                        <i className="ri-arrow-right-up-line text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ hide scrollbar but still scroll */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
