import React, { useEffect, useMemo, useState } from "react";
import "../index.css";
import "remixicon/fonts/remixicon.css";
import { registerAPI } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark-mode");
    else root.classList.remove("dark-mode");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themeIconClass = useMemo(
    () => `theme-toggle ${theme === "dark" ? "ri-sun-line" : "ri-moon-line"}`,
    [theme]
  );

  const fire = (opts) => Swal.fire(opts);

  const handleSubmit = async () => {
    const e = email.trim();
    const u = username.trim();
    const p = password.trim();

    if (!e) return fire({ icon: "error", title: "Email Kosong!", text: "Silahkan isi email anda" });
    if (!u) return fire({ icon: "error", title: "Username Kosong!", text: "Silahkan isi username anda" });
    if (!p) return fire({ icon: "error", title: "Password Kosong!", text: "Silahkan isi password anda" });

    try {
      await registerAPI({ email: e, username: u, password: p });
      fire({ icon: "success", title: "Berhasil!", text: "Akun berhasil dibuat!" });
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Register gagal. Cek data / server.";
      fire({ icon: "error", title: "Gagal", text: msg });
      console.error(err);
    }
  };

  return (
    <>
      <i
        id="themeToggle"
        className={themeIconClass}
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        role="button"
        tabIndex={0}
      />

      <div className="card">
        <div className="logo">
          <i className="ri-login-circle-line" />
        </div>

        <h3 className="title">Create Your Account</h3>

        <p className="subtitle">
          Keep memories from every <br /> lifetime in your hands
        </p>

        <div className="input-box">
          <i className="ri-user-line" />
          <input
            type="email"
            placeholder="Email....."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-box">
          <i className="ri-user-line" />
          <input
            type="text"
            placeholder="Username......"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-box">
          <i className="ri-lock-line" />
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password...."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <i
            className={showPass ? "ri-eye-line" : "ri-eye-off-line"}
            onClick={() => setShowPass((s) => !s)}
            role="button"
            tabIndex={0}
          />
        </div>

        <button className="btn blue" type="button" onClick={handleSubmit}>
          Register
        </button>

        {/* ✅ ganti tombol Login jadi teks */}
        <div style={{ marginTop: 14, textAlign: "center", fontSize: 14 }}>
          <span style={{ opacity: 0.8 }}>Already have an account? </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              color: "#5c8df0",
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            Login here
          </button>
        </div>
      </div>
    </>
  );
}
