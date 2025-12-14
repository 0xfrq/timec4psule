import React, { useMemo, useState } from "react";
import "../designtimecaps.css";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { generateVideoFromTextAPI, uploadVideoAPI } from "../api/video";
import Navbar from "../components/Navbar";

export default function GenerateVideo() {
  const { token, user, logout } = useSession();
  const navigate = useNavigate();

  const tabs = useMemo(() => ["Text to Video", "Upload Video"], []);
  const [activeTab, setActiveTab] = useState("Text to Video");

  // text-to-video
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState("5"); // simpan angka biar gampang
  const [count, setCount] = useState("1");

  // upload video
  const [file, setFile] = useState(null);

  // ui
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // bisa jobId / url / data lain

  const fire = (opts) => Swal.fire(opts);

  const guardToken = () => {
    if (!token) {
      fire({ icon: "warning", title: "Belum login", text: "Silakan login dulu." });
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!guardToken()) return;

    if (!prompt.trim()) {
      return fire({ icon: "error", title: "Prompt kosong", text: "Isi prompt dulu." });
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        prompt: prompt.trim(),
        resolution,                 // "720p" / "1080p"
        durationSeconds: Number(duration), // 5 / 10
        count: Number(count),       // 1 / 2
      };

      const res = await generateVideoFromTextAPI(token, payload);

      // contoh hasil backend: { jobId, status, videoUrls: [] }
      setResult(res?.data || { ok: true });

      fire({ icon: "success", title: "Request terkirim", text: "Video sedang diproses." });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        logout();
        navigate("/login");
        return;
      }
      fire({
        icon: "error",
        title: "Gagal generate",
        text: err?.response?.data?.message || "Server error / endpoint belum ada.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!guardToken()) return;

    if (!file) {
      return fire({ icon: "error", title: "Belum pilih file", text: "Pilih video dulu." });
    }

    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("video", file); // field "video" sesuaikan backend
      // optional meta
      fd.append("resolution", resolution);
      fd.append("durationSeconds", String(duration));

      const res = await uploadVideoAPI(token, fd);

      setResult(res?.data || { ok: true });

      fire({ icon: "success", title: "Upload sukses", text: "Video berhasil diupload." });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        fire({ icon: "warning", title: "Session habis", text: "Silakan login lagi." });
        logout();
        navigate("/login");
        return;
      }
      fire({
        icon: "error",
        title: "Gagal upload",
        text: err?.response?.data?.message || "Server error / endpoint belum ada.",
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    pageTitle: {
      marginTop: 60,
      fontSize: 38,
      textAlign: "center",
      fontWeight: 600,
    },
    tabs: {
      display: "flex",
      justifyContent: "center",
      gap: 30,
      marginTop: 30,
      flexWrap: "wrap",
    },
    tabBtn: (isActive) => ({
      padding: "10px 18px",
      fontSize: 14,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: isActive ? "#5d8bf7" : "#999",
      fontWeight: 600,
      borderBottom: isActive ? "3px solid #5d8bf7" : "3px solid transparent",
    }),
    card: {
      width: 800,
      maxWidth: "92%",
      margin: "30px auto",
      background: "#111",
      color: "white",
      borderRadius: 20,
      padding: 30,
    },
    promptBox: {
      width: "100%",
      height: 180,
      background: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: 12,
      padding: 18,
      fontSize: 15,
      color: "white",
      resize: "none",
      outline: "none",
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 20,
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    select: {
      background: "#222",
      border: "1px solid #444",
      color: "white",
      padding: 10,
      borderRadius: 10,
      minWidth: 140,
      outline: "none",
    },
    btn: {
      background: "#FFC727",
      padding: "14px 30px",
      border: "none",
      borderRadius: 12,
      fontSize: 18,
      fontWeight: 600,
      cursor: "pointer",
      color: "#000",
      opacity: loading ? 0.7 : 1,
    },
    fileBox: {
      border: "1px dashed #444",
      borderRadius: 12,
      padding: 18,
      marginTop: 12,
      background: "#1a1a1a",
    },
    resultBox: {
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      background: "#1a1a1a",
      border: "1px solid #333",
      fontSize: 13,
      opacity: 0.95,
      overflowX: "auto",
    },
  };

  return (
    <div>
      <Navbar />

      <div style={{ padding: "10px 24px", fontSize: 13, opacity: 0.85 }}>
        Halo, <b>{user?.username || "User"}</b>
      </div>

      <div style={styles.pageTitle}>AI Generate Video</div>

      {/* TABS */}
      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            style={styles.tabBtn(activeTab === t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* CARD */}
      <div style={styles.card}>
        {/* Common options */}
        <div style={styles.row}>
          <select
            style={styles.select}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>

          <select
            style={styles.select}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
          </select>

          {activeTab === "Text to Video" && (
            <select
              style={styles.select}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            >
              <option value="1">1 video</option>
              <option value="2">2 video</option>
            </select>
          )}
        </div>

        {/* Text to Video */}
        {activeTab === "Text to Video" && (
          <>
            <textarea
              style={styles.promptBox}
              placeholder="Describe the scene or motion you want..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div style={styles.row}>
              <button
                type="button"
                style={styles.btn}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "Processing..." : "Generate • 25"}
              </button>
            </div>
          </>
        )}

        {/* Upload Video */}
        {activeTab === "Upload Video" && (
          <>
            <div style={styles.fileBox}>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
                {file ? `Selected: ${file.name}` : "No file selected"}
              </div>
            </div>

            <div style={styles.row}>
              <button
                type="button"
                style={styles.btn}
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </>
        )}

        {/* RESULT */}
        {result && (
          <div style={styles.resultBox}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Backend response</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
