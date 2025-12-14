import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import "remixicon/fonts/remixicon.css";

export default function Dashboard() {
  const { user, token, logout } = useSession();
  const navigate = useNavigate();

  const API_BASE_URL = useMemo(
    () => (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/\/+$/, ""),
    []
  );

  // ===== DRF TokenAuth => Authorization: Token <token>
  const rawToken = useMemo(() => {
    if (!token) return "";
    if (typeof token === "string") return token;
    return token.key || token.token || token.access || "";
  }, [token]);

  const authHeader = useMemo(() => {
    if (!rawToken) return {};
    const hasPrefix = /^Token\s+/i.test(rawToken);
    return { Authorization: hasPrefix ? rawToken : `Token ${rawToken}` };
  }, [rawToken]);

  const fire = useCallback((opts) => Swal.fire(opts), []);
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const buildMediaUrl = useCallback(
    (url) => {
      // ✅ base url + url dari API (contoh: http://localhost:8000 + /public/...)
      if (!url) return "";
      if (/^https?:\/\//i.test(url)) return url;
      const path = String(url).startsWith("/") ? url : `/${url}`;
      return `${API_BASE_URL}${path}`;
    },
    [API_BASE_URL]
  );

  // ===== fallback
  const dummyProfile = useMemo(
    () => ({
      username: user?.username || "user",
      email: user?.email || "",
      bio: "Bio belum dibuat.",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=60",
      cover:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=60",
    }),
    [user]
  );

  const [profile, setProfile] = useState(dummyProfile);
  const [loading, setLoading] = useState(false);

  // ✅ TAMBAHAN: state posts untuk profile
  const [posts, setPosts] = useState([]);

  // ===== GET /api/profile/
  const fetchProfile = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/profile/`, {
      method: "GET",
      headers: { ...authHeader },
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) return { __unauth: true, data };
    if (!res.ok) throw new Error(data?.detail || `Gagal load profile (${res.status})`);

    return { data };
  }, [API_BASE_URL, authHeader]);

  // ===== PUT /api/profile/ (FormData only)
  const putProfileForm = useCallback(
    async (formData) => {
      const res = await fetch(`${API_BASE_URL}/api/profile/`, {
        method: "PUT",
        headers: {
          ...authHeader, // JANGAN set Content-Type manual
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) return { __unauth: true, data };
      if (!res.ok) throw new Error(data?.detail || `Update gagal (${res.status})`);

      return { data };
    },
    [API_BASE_URL, authHeader]
  );

  const hydrateProfile = useCallback(
    (p) => {
      // ProfileSerializer kamu biasanya: { user: {...}, bio, profile_picture, ... }
      const u = p?.user || {};
      const pic = p?.profile_picture?.url || p?.profile_picture || p?.profile_picture_url || null;

      setProfile((prev) => ({
        ...prev,
        username: u.username || prev.username || user?.username || "user",
        email: u.email || prev.email || user?.email || "",
        bio: p?.bio ?? prev.bio,
        avatar: pic ? buildMediaUrl(pic) : prev.avatar,
        // cover belum ada endpoint di backend -> keep dummy
      }));
    },
    [buildMediaUrl, user]
  );

  // ✅ TAMBAHAN: GET /api/post/list/<user_id>/
  const fetchMyPosts = useCallback(async () => {
    // pakai user.id dari session (seperti contoh /api/post/list/154/)
    const uid = user?.id;
    if (!uid) return;

    const res = await fetch(`${API_BASE_URL}/api/post/list/${encodeURIComponent(uid)}/`, {
      method: "GET",
      headers: { ...authHeader },
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) return { __unauth: true, data };
    if (!res.ok) throw new Error(data?.detail || `Gagal load posts (${res.status})`);

    const items = Array.isArray(data.posts) ? data.posts : [];

    // map minimal agar tidak ganggu mekanisme lain
    const mapped = items
      .filter((p) => {
        const mt = String(p.media_type || "").toLowerCase();
        return mt === "video" || mt === "photo";
      })
      .map((p) => {
        const mt = String(p.media_type || "").toLowerCase();
        return {
          id: String(p.id),
          media_type: mt,
          src: buildMediaUrl(p.url), // ✅ base + url
          title: p.description || (mt === "photo" ? "Photo" : "Video"),
          year: p?.tahun?.tahun ? String(p.tahun.tahun) : "",
          likes_count: typeof p.likes_count === "number" ? p.likes_count : 0,
          comments_count: typeof p.comments_count === "number" ? p.comments_count : 0,
          created_at: p.created_at || "",
        };
      })
      .filter((x) => !!x.src);

    setPosts(mapped);
    return { data };
  }, [API_BASE_URL, authHeader, buildMediaUrl, user?.id]);

  // ===== INIT load (TIDAK DIUBAH, hanya ditambah fetchMyPosts)
  useEffect(() => {
    if (!rawToken) {
      fire({ icon: "warning", title: "Belum login", text: "Silakan login dulu." });
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const r = await fetchProfile();
        if (r.__unauth) {
          fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
          handleLogout();
          return;
        }
        hydrateProfile(r.data);

        // ✅ tambahan: load post list user
        const pr = await fetchMyPosts();
        if (pr?.__unauth) {
          fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
          handleLogout();
          return;
        }
      } catch (e) {
        // fallback dummy
      } finally {
        setLoading(false);
      }
    })();
  }, [rawToken, fire, navigate, fetchProfile, handleLogout, hydrateProfile, fetchMyPosts]);

  // ===== UPDATE BIO (FormData)
  const onEditBio = async () => {
    const result = await Swal.fire({
      title: "Update Bio",
      input: "textarea",
      inputValue: profile.bio || "",
      inputPlaceholder: "Tulis bio...",
      showCancelButton: true,
      confirmButtonText: "Save",
    });
    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("bio", result.value || "");

      const r = await putProfileForm(fd);
      if (r.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      hydrateProfile(r.data);
      fire({ icon: "success", title: "Berhasil", text: "Bio updated." });
    } catch (e) {
      fire({ icon: "error", title: "Gagal", text: e?.message || "Update bio gagal." });
    } finally {
      setLoading(false);
    }
  };

  // ===== UPDATE PICTURE (FormData)
  const onEditPicture = async () => {
    const result = await Swal.fire({
      title: "Update Profile Picture",
      input: "file",
      inputAttributes: { accept: "image/*" },
      showCancelButton: true,
      confirmButtonText: "Upload",
    });
    if (!result.isConfirmed) return;

    const file = result.value;
    if (!file) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("profile_picture", file);

      const r = await putProfileForm(fd);
      if (r.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      hydrateProfile(r.data);
      fire({ icon: "success", title: "Berhasil", text: "Profile picture updated." });
    } catch (e) {
      fire({ icon: "error", title: "Gagal", text: e?.message || "Update picture gagal." });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setLoading(true);
      const r = await fetchProfile();
      if (r.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }
      hydrateProfile(r.data);

      // ✅ refresh posts juga
      const pr = await fetchMyPosts();
      if (pr?.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }
    } catch (e) {
      fire({ icon: "error", title: "Gagal", text: e?.message || "Gagal refresh." });
    } finally {
      setLoading(false);
    }
  };

  // ✅ klik post -> PostView
  const openPostView = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/postview/${id}`);
    },
    [navigate]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOPBAR */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center border border-slate-200">
              <i className="ri-user-3-fill text-xl text-slate-900" />
            </div>
            <span className="text-lg">Profile</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/feed"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Home
            </Link>

            <Link
              to="/faq"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Setting
            </Link>

            <Link
              to="/dashboard"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Profile
            </Link>

            <Link
              to="/UploadVideo"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Upload Video
            </Link>
          </div>
        </div>
      </div>

      {/* STATUS + ACTIONS */}
      <div className="mx-auto max-w-[1400px] px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm text-slate-700">
            Halo, <b className="text-slate-900">{profile.username}</b>
            {loading ? <span className="ml-2 text-slate-400">• loading...</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onEditBio}
              className="rounded-full bg-[#4D8DFF] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Edit Bio
            </button>

            <button
              onClick={onEditPicture}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Update Picture
            </button>

            <button
              onClick={onRefresh}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* PROFILE HERO */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="relative h-56 w-full">
            <img src={profile.cover} alt="cover" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-md">
                  <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
                </div>

                <div className="text-white">
                  <div className="text-xl font-extrabold">{profile.username}</div>
                  <div className="mt-1 text-sm text-white/90">{profile.email}</div>
                </div>
              </div>

              <div className="max-w-xl rounded-2xl bg-white/15 p-4 text-sm text-white/90 backdrop-blur ring-1 ring-white/20">
                {profile.bio}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Endpoint dipakai: <b>/api/profile/</b> (GET & PUT). Update pakai <b>FormData</b>.
        </div>

        {/* ✅ TAMBAHAN: POSTS GRID */}
        <div className="mt-10 flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold text-slate-900">My Posts</div>
            <div className="text-sm text-slate-500">
              Source: <b>/api/post/list/{user?.id || "user_id"}/</b>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMyPosts}
            className="rounded-xl bg-[#4D8DFF] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
          >
            Reload Posts
          </button>
        </div>

        {!posts.length ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            Belum ada post / belum bisa load list post.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {posts.map((p) => {
              const mt = String(p.media_type || "").toLowerCase();
              const isVideo = mt === "video";
              const isPhoto = mt === "photo";

              return (
                <div
                  key={p.id}
                  onClick={() => openPostView(p.id)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-slate-200"
                  style={{ aspectRatio: "2 / 3" }}
                  title="Open PostView"
                >
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-yellow-300 px-3 py-1 text-[11px] font-extrabold text-slate-900">
                    {p.year || "—"}
                  </span>

                  {isVideo ? (
                    <video
                      src={p.src}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : isPhoto ? (
                    <img src={p.src} alt={p.title} className="h-full w-full object-cover" />
                  ) : null}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="truncate text-sm font-extrabold">{p.title || (isPhoto ? "Photo" : "Video")}</div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-white/85">
                      <span>
                        <i className="ri-heart-3-fill mr-1" />
                        {p.likes_count || 0}
                      </span>
                      <span>
                        <i className="ri-chat-3-fill mr-1" />
                        {p.comments_count || 0}
                      </span>
                    </div>
                  </div>

                  <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[11px] text-white ring-1 ring-white/20">
                    <i className={isPhoto ? "ri-image-line mr-1" : "ri-video-line mr-1"} />
                    {isPhoto ? "photo" : "video"}
                  </div>

                  <div className="absolute inset-0 ring-0 ring-yellow-300/0 transition group-hover:ring-2 group-hover:ring-yellow-300/70" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}
