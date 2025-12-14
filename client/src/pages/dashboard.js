import React, { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { getDashboardAPI } from "../api/dashboard";

export default function Dashboard() {
  const { user, token, logout } = useSession();
  const navigate = useNavigate();

  const API_BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
  const fire = (opts) => Swal.fire(opts);

  // ====== DUMMY fallback ======
  const dummyProfile = useMemo(
    () => ({
      username: "user",
      first_name: "User",
      last_name: "",
      email: "user@email.com",
      bio: "Bio belum dibuat.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=60",
      cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=60",
    }),
    []
  );

  const dummyVideos = useMemo(
    () => [
      {
        id: "dv1",
        year: "2024",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        title: "user",
        desc: "Lorem ipsum dolor sit amet...",
      },
    ],
    []
  );

  // ====== STATE ======
  const [profile, setProfile] = useState(dummyProfile);
  const [videos, setVideos] = useState(dummyVideos);
  const [loading, setLoading] = useState(false);

  // =========================
  // ✅ TOKEN AUTH (DRF TokenAuthentication)
  // Authorization: Token <token>
  // =========================
  const rawToken = useMemo(() => {
    if (!token) return "";
    if (typeof token === "string") return token;
    return token.key || token.token || token.access || "";
  }, [token]);

  const authHeader = useMemo(() => {
    if (!rawToken) return {};
    const hasPrefix = /^(Token)\s+/i.test(rawToken);
    return { Authorization: hasPrefix ? rawToken : `Token ${rawToken}` };
  }, [rawToken]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const buildMediaUrl = useCallback(
    (url) => {
      if (!url) return "";
      if (/^https?:\/\//i.test(url)) return url;
      const base = (API_BASE_URL || "").replace(/\/+$/, "");
      const path = String(url).startsWith("/") ? url : `/${url}`;
      return `${base}${path}`;
    },
    [API_BASE_URL]
  );

  // =========================
  // Helpers (JSON / FormData)
  // =========================
  const apiJson = useCallback(
    async (path, { method = "PUT", body } = {}) => {
      if (!API_BASE_URL) throw new Error("REACT_APP_API_URL belum diset.");
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) return { __unauth: true, data };
      if (!res.ok) throw new Error(data?.detail || data?.message || `Request gagal (${res.status})`);
      return { data };
    },
    [API_BASE_URL, authHeader]
  );

  const apiForm = useCallback(
    async (path, formData, { method = "PUT" } = {}) => {
      if (!API_BASE_URL) throw new Error("REACT_APP_API_URL belum diset.");
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          ...authHeader, // jangan set Content-Type manual
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) return { __unauth: true, data };
      if (!res.ok) throw new Error(data?.detail || data?.message || `Request gagal (${res.status})`);
      return { data };
    },
    [API_BASE_URL, authHeader]
  );

  // =========================
  // LOAD DASHBOARD
  // =========================
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardAPI(rawToken || token);
      const data = res?.data || {};

      // Sesuaikan sesuai response backend kamu:
      // - ProfileSerializer(profile) biasanya: { user: {...}, bio, profile_picture, created_at, updated_at }
      // - kamu pakai endpoint ProfileView.get juga yg return ProfileSerializer(profile)
      const p = data.profile || data.data || data || null;
      const v = data.videos || data.posts || data.items || null;

      // ===== Profile mapping
      // Bentuk yang umum dari serializer kamu:
      // p.user: {id, username, first_name, last_name, email}
      // p.profile_picture (atau url), p.bio
      if (p) {
        const u = p.user || p.data?.user || {};
        const profilePicture =
          p.profile_picture ||
          p.profilePicture ||
          p.profile_picture_url ||
          p.profile_picture?.url ||
          null;

        setProfile((prev) => ({
          ...prev,
          username: u.username || user?.username || prev.username,
          first_name: u.first_name ?? prev.first_name,
          last_name: u.last_name ?? prev.last_name,
          email: u.email ?? prev.email,
          bio: p.bio ?? prev.bio,
          avatar: profilePicture ? buildMediaUrl(profilePicture) : prev.avatar,
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          username: user?.username || prev.username,
        }));
      }

      // ===== Videos mapping (kalau ada)
      if (Array.isArray(v) && v.length) {
        setVideos(
          v.map((it, idx) => ({
            id: it.id || it._id || `v-${idx}`,
            year: String(it.year || it.tahun || it.timeline || "—"),
            src: buildMediaUrl(it.src || it.videoUrl || it.url),
            title: it.title || it.description || it.name || user?.username || "—",
            desc: it.desc || it.description || "",
          }))
        );
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
      }
      // fallback dummy
    } finally {
      setLoading(false);
    }
  }, [buildMediaUrl, fire, handleLogout, rawToken, token, user]);

  useEffect(() => {
    if (!rawToken) {
      fire({ icon: "warning", title: "Belum login", text: "Silakan login dulu." });
      navigate("/login", { replace: true });
      return;
    }
    loadDashboard();
  }, [rawToken, navigate, fire, loadDashboard]);

  // =========================
  // ✅ EDIT PROFILE (sesuai endpoint & field backend)
  // - PUT /api/profile/update-picture/  (multipart: profile_picture)
  // - PUT /api/profile/update-bio/      (json: bio)
  // - PUT /api/profile/update-info/     (json: first_name,last_name,email)
  // - PUT /api/profile/update-all/      (multipart: bio, first_name,last_name,email, profile_picture)
  // =========================

  const openEditProfile = async () => {
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

    const result = await Swal.fire({
      title: "Edit Profile",
      html: `
        <div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px;color:#64748b;">
            Update via: update-info / update-bio / update-picture / update-all
          </div>

          <label style="font-weight:700;">First Name</label>
          <input id="pf_first" class="swal2-input" placeholder="First name" value="${escapeHtml(profile.first_name || "")}" />

          <label style="font-weight:700;">Last Name</label>
          <input id="pf_last" class="swal2-input" placeholder="Last name" value="${escapeHtml(profile.last_name || "")}" />

          <label style="font-weight:700;">Email</label>
          <input id="pf_email" class="swal2-input" placeholder="email@example.com" value="${escapeHtml(profile.email || "")}" />

          <label style="font-weight:700;">Bio</label>
          <textarea id="pf_bio" class="swal2-textarea" placeholder="Bio...">${escapeHtml(profile.bio || "")}</textarea>

          <label style="font-weight:700;">Profile Picture (file)</label>
          <input id="pf_pic" type="file" class="swal2-file" accept="image/*" />

          <div style="margin-top:6px;font-size:12px;color:#94a3b8;">
            Username: <b>${escapeHtml(profile.username || "")}</b> • Name: <b>${escapeHtml(fullName)}</b>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const first_name = document.getElementById("pf_first")?.value || "";
        const last_name = document.getElementById("pf_last")?.value || "";
        const email = document.getElementById("pf_email")?.value || "";
        const bio = document.getElementById("pf_bio")?.value || "";
        const file = document.getElementById("pf_pic")?.files?.[0] || null;

        return { first_name, last_name, email, bio, file };
      },
    });

    if (!result.isConfirmed) return;

    const { first_name, last_name, email, bio, file } = result.value || {};

    if (!rawToken) {
      Swal.fire({ icon: "error", title: "Auth error", text: "Token tidak ditemukan." });
      return;
    }

    try {
      // Kalau ada file → paling aman pakai update-all (multipart)
      if (file) {
        const fd = new FormData();
        fd.append("profile_picture", file);
        fd.append("bio", bio ?? "");
        fd.append("first_name", first_name ?? "");
        fd.append("last_name", last_name ?? "");
        fd.append("email", email ?? "");

        const r = await apiForm("/api/profile/update-all/", fd, { method: "PUT" });
        if (r.__unauth) {
          fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
          handleLogout();
          return;
        }

        Swal.fire({ icon: "success", title: "Updated", text: "Profile updated (update-all)." });
        await loadDashboard();
        return;
      }

      // Kalau tidak ada file → update-info + update-bio (dua request)
      const rInfo = await apiJson("/api/profile/update-info/", {
        method: "PUT",
        body: { first_name, last_name, email },
      });

      if (rInfo.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      const rBio = await apiJson("/api/profile/update-bio/", {
        method: "PUT",
        body: { bio },
      });

      if (rBio.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      Swal.fire({ icon: "success", title: "Updated", text: "Profile updated." });
      await loadDashboard();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Gagal", text: e?.message || "Update gagal." });
    }
  };

  const updatePictureOnly = async () => {
    const result = await Swal.fire({
      title: "Update Picture",
      input: "file",
      inputAttributes: { accept: "image/*" },
      showCancelButton: true,
      confirmButtonText: "Upload",
    });
    if (!result.isConfirmed) return;

    const file = result.value;
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append("profile_picture", file);

      const r = await apiForm("/api/profile/update-picture/", fd, { method: "PUT" });
      if (r.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      Swal.fire({ icon: "success", title: "Updated", text: "Profile picture updated." });
      await loadDashboard();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Gagal", text: e?.message || "Update gagal." });
    }
  };

  const updateBioOnly = async () => {
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
      const r = await apiJson("/api/profile/update-bio/", {
        method: "PUT",
        body: { bio: result.value || "" },
      });
      if (r.__unauth) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        handleLogout();
        return;
      }

      Swal.fire({ icon: "success", title: "Updated", text: "Bio updated." });
      await loadDashboard();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Gagal", text: e?.message || "Update gagal." });
    }
  };

  // =========================
  // UI
  // =========================
  const displayName = useMemo(() => {
    const n = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return n || profile.username || user?.username || "user";
  }, [profile.first_name, profile.last_name, profile.username, user]);

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
            Halo, <b className="text-slate-900">{profile.username || user?.username}</b>
            {loading ? <span className="ml-2 text-slate-400">• loading...</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openEditProfile}
              className="rounded-full bg-[#4D8DFF] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Edit Profile
            </button>

            <button
              onClick={updatePictureOnly}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Update Picture
            </button>

            <button
              onClick={updateBioOnly}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Update Bio
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
                  <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                </div>

                <div className="text-white">
                  <div className="text-xl font-extrabold">{displayName}</div>
                  <div className="mt-1 text-sm text-white/90">
                    <span className="mr-2">{profile.email}</span>
                  </div>
                </div>
              </div>

              <div className="max-w-xl rounded-2xl bg-white/15 p-4 text-sm text-white/90 backdrop-blur ring-1 ring-white/20">
                {profile.bio}
              </div>
            </div>
          </div>
        </div>

        {/* UPLOADED VIDEO TITLE */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Uploaded Video</div>
            <div className="text-sm text-slate-500">Kumpulan video yang pernah kamu upload</div>
          </div>

          <button
            type="button"
            className="rounded-xl bg-[#4D8DFF] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
          >
            Uploaded Video
          </button>
        </div>

        {/* VIDEO GRID */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {videos.map((v) => (
            <div
              key={v.id}
              className="group relative overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-slate-200"
              style={{ aspectRatio: "2 / 3" }}
            >
              <span className="absolute left-3 top-3 z-10 rounded-full bg-yellow-300 px-3 py-1 text-[11px] font-extrabold text-slate-900">
                {v.year}
              </span>

              <video src={v.src} muted autoPlay loop playsInline className="h-full w-full object-cover" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="truncate text-sm font-extrabold">{v.title}</div>
                <div className="mt-1 line-clamp-2 text-xs text-white/85">{v.desc}</div>
              </div>

              <div className="absolute inset-0 ring-0 ring-yellow-300/0 transition group-hover:ring-2 group-hover:ring-yellow-300/70" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}

// helper agar value aman ditaruh di Swal html
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
