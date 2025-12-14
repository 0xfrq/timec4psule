import React, { useMemo, useRef, useState } from "react";
import { useSession } from "../context/SessionContext";
import "remixicon/fonts/remixicon.css";
import Swal from "sweetalert2";

export default function UploadVideo() {
  const fileRef = useRef(null);

  const { user, token } = useSession();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const [fileName, setFileName] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState(0);

  // upload | imagegen | scrape
  const [activePage, setActivePage] = useState("upload");

  // YEAR (khusus imagegen)
  const defaultYear = useMemo(() => String(new Date().getFullYear()), []);
  const [year, setYear] = useState(defaultYear);

  // imagegen
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(4);
  const [genDescription, setGenDescription] = useState("");

  // scrape
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeDesc, setScrapeDesc] = useState("");

  const openPicker = () => fileRef.current?.click();

  const authHeader = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const BASE = (API_BASE_URL || "").replace(/\/+$/, "");

  const buildAbsUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (!BASE) return url;
    const path = String(url).startsWith("/") ? url : `/${url}`;
    return `${BASE}${path}`;
  };

  const normalizeYear = (y) => {
    const v = String(y ?? "").trim();
    if (!v) return "";
    if (!/^\d{4}$/.test(v)) return null;
    return v;
  };

  const extractPostId = (data) => {
    const id =
      data?.id ??
      data?.post_id ??
      data?.postId ??
      data?.post?.id ??
      data?.data?.id ??
      data?.data?.post_id ??
      data?.result?.id ??
      data?.result?.post_id;

    if (id === 0) return "0";
    if (id === null || id === undefined) return "";
    return String(id);
  };

  // folder_id: coba ambil dari response (kalau ada), atau parsing dari URL
  const extractFolderId = (data, images) => {
    const direct =
      data?.folder_id ??
      data?.data?.folder_id ??
      data?.result?.folder_id ??
      data?.images?.[0]?.folder_id;

    if (direct) return String(direct);

    const firstUrl = images?.[0]?.url || "";
    // contoh: /public/generated/image/abc12345/image_1.png
    const m = String(firstUrl).match(/\/public\/generated\/image\/([^/]+)\//i);
    if (m?.[1]) return String(m[1]);

    return "";
  };

  const triggerGenerateContent = async (postId) => {
    if (!postId) return;

    if (!BASE) {
      setStatusMsg("Sukses ✅ tapi REACT_APP_API_URL belum diset untuk generate-content.");
      return;
    }

    try {
      setStatusMsg("Sukses ✅ Lanjut generate content...");

      const res = await fetch(`${BASE}/api/post/${encodeURIComponent(postId)}/generate-content/`, {
        method: "POST",
        headers: { ...authHeader },
      });

      if (!res.ok) throw new Error(`generate-content gagal (${res.status})`);
      setStatusMsg("Sukses ✅ Generate content berhasil.");
    } catch (e) {
      setStatusMsg(e?.message || "Generate content error.");
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "upload");
    setStatusMsg("");
    setProgress(0);
  };

  /* ================= UPLOAD VIDEO ================= */
  const handleSubmit = () => {
    const file = fileRef.current?.files?.[0];

    if (!file) return setStatusMsg("Silakan pilih video terlebih dahulu.");
    if (!user?.id) return setStatusMsg("User belum terdeteksi.");
    if (!BASE) return setStatusMsg("API URL belum diset (REACT_APP_API_URL).");

    setUploading(true);
    setProgress(0);
    setStatusMsg("");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("uploader", String(user.id));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/post/create/`, true);

    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = async () => {
      setUploading(false);

      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);

        let postId = "";
        try {
          const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          postId = extractPostId(data);
        } catch {}

        if (fileRef.current) fileRef.current.value = "";
        setFileName("upload");

        await triggerGenerateContent(postId);
      } else {
        setStatusMsg(`Upload gagal (${xhr.status})`);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setStatusMsg("Gagal upload.");
    };

    xhr.send(formData);
  };

  /* ================= IMAGEGEN: POST /api/imagegen/generate/ ================= */
  const handleImageGen = async () => {
    const y = normalizeYear(year);
    if (y === null) return setStatusMsg("Tahun harus 4 digit (contoh: 2025).");
    if (!BASE) return setStatusMsg("API URL belum diset (REACT_APP_API_URL).");
    if (!user?.id) return setStatusMsg("User belum terdeteksi.");
    if (!prompt.trim()) return setStatusMsg("Prompt wajib diisi.");

    const n = Number(numImages);
    const safeN = Number.isFinite(n) && n > 0 ? Math.min(10, Math.max(1, n)) : 4;

    try {
      setStatusMsg("Generating images...");

      const res = await fetch(`${BASE}/api/imagegen/generate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          num_images: safeN,
          return_base64: true,
          year: Number(y),
          uploader: user.id,
          description: genDescription.trim() || "Generated image",
        }),
      });

      if (!res.ok) throw new Error(`Generate gagal (${res.status})`);

      const data = await res.json().catch(() => ({}));
      const images = Array.isArray(data?.images) ? data.images : [];

      if (!images.length) {
        setStatusMsg("Generate sukses, tapi tidak ada images di response.");
        return;
      }

      const folderId = extractFolderId(data, images);

      // popup pilih gambar terbaik
      await showPickPopup({
        prompt: data?.prompt || prompt.trim(),
        images,
        folderId,
      });
    } catch (err) {
      setStatusMsg(err?.message || "Terjadi error.");
    }
  };

  /* ================= PICK POPUP + SELECT ================= */
  const showPickPopup = async ({ prompt: pText, images, folderId }) => {
    let selected = images?.[0]?.filename || "";

    const gridItemsHtml = images
      .map((img, idx) => {
        const filename = img?.filename || `image_${idx + 1}.png`;
        const base64 = img?.base64 || "";
        const url = img?.url ? buildAbsUrl(img.url) : "";
        const src = base64 ? `data:image/png;base64,${base64}` : url;

        return `
          <button
            type="button"
            data-fn="${filename}"
            style="
              border: 2px solid ${idx === 0 ? "#111827" : "rgba(0,0,0,0.12)"};
              border-radius: 14px;
              overflow: hidden;
              padding: 0;
              cursor: pointer;
              background: #fff;
              display: block;
            "
          >
            <img
              src="${src}"
              alt="${filename}"
              style="width:100%; height:140px; object-fit:cover; display:block;"
            />
            <div style="padding:8px 10px; font-size:12px; text-align:left; color:#111827;">
              <b>${filename}</b>
            </div>
          </button>
        `;
      })
      .join("");

    const { isConfirmed, value } = await Swal.fire({
      title: "Pilih gambar terbaik",
      html: `
        <div style="text-align:left; font-size:13px; color:#6b7280; margin-bottom:10px;">
          Prompt: <b style="color:#111827;">${escapeHtml(pText)}</b>
          ${folderId ? `<div style="margin-top:4px;">folder_id: <b style="color:#111827;">${escapeHtml(folderId)}</b></div>` : ""}
        </div>
        <div id="imgGrid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
          ${gridItemsHtml}
        </div>
        <div style="margin-top:10px; font-size:12px; color:#6b7280;">
          Klik salah satu gambar untuk memilih, lalu tekan <b>Keep Selected</b>.
        </div>
      `,
      width: 900,
      showCancelButton: true,
      confirmButtonText: "Keep Selected",
      cancelButtonText: "Batal",
      didOpen: () => {
        const grid = document.getElementById("imgGrid");
        if (!grid) return;

        const btns = grid.querySelectorAll("button[data-fn]");
        btns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const fn = btn.getAttribute("data-fn") || "";
            if (!fn) return;
            selected = fn;

            btns.forEach((b) => {
              b.style.border = "2px solid rgba(0,0,0,0.12)";
            });
            btn.style.border = "2px solid #111827";
          });
        });
      },
      preConfirm: () => selected,
    });

    if (!isConfirmed) {
      setStatusMsg("Dibatalkan.");
      return;
    }

    const picked = value || selected;
    if (!picked) {
      setStatusMsg("Tidak ada gambar yang dipilih.");
      return;
    }
    if (!folderId) {
      setStatusMsg("Tidak menemukan folder_id. Pastikan response generate menyertakan folder_id atau url mengandung folder.");
      return;
    }

    await selectBestImage({ folderId, pick: picked });
  };

const selectBestImage = async ({ folderId, pick }) => {
  if (!BASE) return setStatusMsg("API URL belum diset (REACT_APP_API_URL).");

  try {
    setStatusMsg("Memilih gambar terbaik...");

    const res = await fetch(`${BASE}/api/imagegen/select/`, {
      method: "POST", // ✅ FIX: POST, bukan GET
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        folder_id: folderId,
        pick: pick,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // contoh: {"detail":"Method \"GET\" not allowed."}
      throw new Error(data?.detail || `Select gagal (${res.status})`);
    }

    if (!data?.success) throw new Error("Select gagal (success=false)");

    const kept = data?.kept_image;
    const keptUrl = kept?.url ? buildAbsUrl(kept.url) : "";

    await Swal.fire({
      icon: "success",
      title: "Berhasil!",
      html: `
        <div style="text-align:left; font-size:13px; color:#111827;">
          <div>${escapeHtml(data?.message || "Selection success")}</div>
          <div style="margin-top:8px; color:#6b7280;">Kept: <b style="color:#111827;">${escapeHtml(
            kept?.filename || pick
          )}</b></div>
          ${
            keptUrl
              ? `<img src="${keptUrl}" style="margin-top:12px; width:100%; max-height:260px; object-fit:cover; border-radius:14px; border:1px solid rgba(0,0,0,0.1);" />`
              : ""
          }
        </div>
      `,
      confirmButtonText: "OK",
    });

    setStatusMsg(`Sukses ✅ ${data?.message || "Selection done"}`);

    // optional: lanjut generate-content untuk post yang dipertahankan
    if (kept?.post_id) {
      await triggerGenerateContent(String(kept.post_id));
    }
  } catch (err) {
    setStatusMsg(err?.message || "Terjadi error saat select.");
  }
};

  /* ================= SCRAPE: POST /api/scrape/ ================= */
  const handleScrape = async () => {
    if (!user?.id) return setStatusMsg("User belum terdeteksi.");
    if (!scrapeUrl.trim()) return setStatusMsg("URL wajib diisi.");
    if (!BASE) return setStatusMsg("API URL belum diset (REACT_APP_API_URL).");

    try {
      setStatusMsg("Scraping media...");

      const res = await fetch(`${BASE}/api/scrape/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          url: scrapeUrl.trim(),
          uploader: user.id,
          description: scrapeDesc.trim() || "Optional description",
        }),
      });

      if (!res.ok) throw new Error(`Gagal scrape media (${res.status})`);

      const data = await res.json().catch(() => ({}));
      const postId = extractPostId(data);

      await triggerGenerateContent(postId);
    } catch (err) {
      setStatusMsg(err?.message || "Terjadi error.");
    }
  };

  const Tab = ({ id, label }) => {
    const active = activePage === id;
    return (
      <button
        type="button"
        onClick={() => {
          setActivePage(id);
          setStatusMsg("");
        }}
        className={[
          "flex-1 rounded-xl px-4 py-3 text-sm font-extrabold transition",
          active
            ? "bg-black text-white"
            : "bg-white text-black ring-1 ring-black/10 hover:bg-black hover:text-white",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Title */}
      <div className="px-6 pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-3">
            <span className="rounded-lg bg-black px-3 py-1 text-3xl font-extrabold text-white">Video</span>
            <span className="text-3xl font-extrabold tracking-tight">Tools</span>
          </div>
          <p className="mt-3 text-sm text-black/60">Upload / Text → Image / Scrape Media</p>
        </div>
      </div>

      {/* Card */}
      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.10)] ring-1 ring-black/10 sm:p-10">
          {/* Tabs */}
          <div className="mb-7 flex gap-3">
            <Tab id="upload" label="Upload" />
            <Tab id="imagegen" label="Text → Image" />
            <Tab id="scrape" label="Scrape Media" />
          </div>

          {/* UPLOAD */}
          {activePage === "upload" && (
            <>
              <div
                onClick={openPicker}
                className={[
                  "grid h-56 place-items-center rounded-2xl border-2 border-dashed",
                  "border-black/20 bg-white hover:border-black/40 hover:bg-black/[0.03] transition cursor-pointer",
                ].join(" ")}
              >
                <input hidden ref={fileRef} type="file" accept="video/*" onChange={onFileChange} />
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-black text-white">
                    <i className="ri-upload-cloud-2-line text-2xl" />
                  </div>
                  <div className="text-sm font-extrabold">Upload Video Here</div>
                  <div className="mt-1 text-xs text-black/50">Klik untuk memilih file video</div>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-black/70">{fileName}</div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className={[
                  "mt-6 mx-auto block w-full rounded-2xl px-5 py-4 text-sm font-extrabold",
                  uploading ? "bg-black/70 text-white cursor-not-allowed" : "bg-black text-white hover:opacity-90",
                ].join(" ")}
              >
                {uploading ? "Uploading..." : "Submit"}
              </button>

              {uploading && (
                <div className="mt-5">
                  <div className="h-3 overflow-hidden rounded-full bg-black/10">
                    <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 text-center text-xs text-black/60">{progress}%</div>
                </div>
              )}
            </>
          )}

          {/* IMAGEGEN */}
          {activePage === "imagegen" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-black/80">Tahun</label>
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    inputMode="numeric"
                    placeholder="contoh: 2025"
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-black/80">Jumlah Gambar</label>
                  <input
                    value={numImages}
                    onChange={(e) => setNumImages(e.target.value)}
                    inputMode="numeric"
                    placeholder="4"
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                  />
                  <div className="mt-2 text-xs text-black/50">1–10 (dibatasi otomatis)</div>
                </div>

                <div className="sm:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-black/80">Description</label>
                  <input
                    value={genDescription}
                    onChange={(e) => setGenDescription(e.target.value)}
                    placeholder="Generated cyberpunk city"
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <label className="mb-2 block text-sm font-bold text-black/80">Prompt</label>
              <textarea
                placeholder="A futuristic city at sunset"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-6 h-36 w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
              />

              <button
                type="button"
                onClick={handleImageGen}
                className="mx-auto block w-full rounded-2xl bg-black px-5 py-4 text-sm font-extrabold text-white hover:opacity-90"
              >
                Generate Images
              </button>

              <div className="mt-3 text-center text-xs text-black/50">
                Endpoint: <b>{BASE}/api/imagegen/generate/</b>
              </div>
            </>
          )}

          {/* SCRAPE */}
          {activePage === "scrape" && (
            <>
              <label className="mb-2 block text-sm font-bold text-black/80">URL</label>
              <input
                placeholder="Paste URL tiktok / instagram / youtube..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                className="mb-5 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
              />

              <label className="mb-2 block text-sm font-bold text-black/80">Description (optional)</label>
              <input
                placeholder="Optional description"
                value={scrapeDesc}
                onChange={(e) => setScrapeDesc(e.target.value)}
                className="mb-6 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black"
              />

              <button
                type="button"
                onClick={handleScrape}
                className="mx-auto block w-full rounded-2xl bg-black px-5 py-4 text-sm font-extrabold text-white hover:opacity-90"
              >
                Scrape Media
              </button>

              <div className="mt-3 text-center text-xs text-black/50">
                Endpoint: <b>{BASE}/api/scrape/</b>
              </div>
            </>
          )}

          {!!statusMsg && (
            <div className="mt-6 text-center text-sm font-semibold text-black/70">{statusMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
