import React, { useRef, useState } from "react";
import "remixicon/fonts/remixicon.css";
import "../index.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { createProfileAPI } from "../api/profile";

export default function CreateProfile() {
  const { token } = useSession();
  const navigate = useNavigate();

  const fileRef = useRef(null);

  const [born, setBorn] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [tag, setTag] = useState(""); // bisa kamu anggap bio/tag
  const [photoFile, setPhotoFile] = useState(null);
  const [photoName, setPhotoName] = useState("");

  const [saving, setSaving] = useState(false);

  const openPicker = () => fileRef.current?.click();

  const onPickPhoto = (e) => {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);
    setPhotoName(f ? f.name : "");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      return Swal.fire({
        icon: "warning",
        title: "Belum login",
        text: "Silakan login dulu.",
      });
    }

    // validasi ringan
    if (!born.trim() || !country.trim() || !gender.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Data belum lengkap",
        text: "Born, Country, Gender wajib diisi.",
      });
    }

    const fd = new FormData();
    fd.append("born", born.trim());
    fd.append("country", country.trim());
    fd.append("gender", gender.trim());
    fd.append("bio", tag.trim()); // ✅ backend bisa pakai "bio" atau "tag"
    if (photoFile) fd.append("avatar", photoFile); // ✅ key "avatar" (samakan dengan backend)

    setSaving(true);
    try {
      await createProfileAPI(token, fd);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Profile berhasil disimpan.",
      });

      // ✅ balik ke dashboard, dashboard akan fetch data terbaru dari backend
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Gagal simpan profile (cek endpoint/backend).";

      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <header className="logo-box">
        <div className="logo">
          <img
            src="https://dummyimage.com/260x80/4d8dff/ffffff&text=TimeCaps"
            alt="Time Capsule Logo"
          />
        </div>
      </header>

      <div className="profile-wrapper">
        <div className="form-box">
          <div className="title-tab">Create Your Profile</div>

          <form onSubmit={onSubmit}>
            <label>Born</label>
            <input
              type="text"
              placeholder="................."
              value={born}
              onChange={(e) => setBorn(e.target.value)}
            />

            <label>Country</label>
            <input
              type="text"
              placeholder="................."
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />

            <label>Gender</label>
            <input
              type="text"
              placeholder="................."
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />

            <label>Tag</label>
            <textarea
              placeholder="................."
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />

            <button
              type="submit"
              className="upload-btn"
              style={{ marginTop: 12, width: "100%" }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="upload-box">
          <i className="ri-user-line"></i>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickPhoto}
          />

          <button type="button" className="upload-btn" onClick={openPicker}>
            Upload Photo
          </button>

          {photoName && (
            <div style={{ marginTop: 10, fontSize: 12 }}>{photoName}</div>
          )}
        </div>
      </div>
    </div>
  );
}
