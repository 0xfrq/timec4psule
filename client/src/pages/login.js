import React, { useEffect, useMemo, useState } from "react";
import "remixicon/fonts/remixicon.css";
import "../style.css";
import Swal from "sweetalert2";
import { loginAPI } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  const { setAuth } = useSession();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark-mode");
    else root.classList.remove("dark-mode");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const themeIconClass = useMemo(
    () => `theme-toggle ${theme === "dark" ? "ri-sun-line" : "ri-moon-line"}`,
    [theme]
  );

  const fire = (opts) => Swal.fire(opts);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const u = username.trim();
    const p = password.trim();

    if (!u) return fire({ icon: "error", title: "Username Kosong!", text: "Silahkan isi username anda" });
    if (!p) return fire({ icon: "error", title: "Password Kosong!", text: "Silahkan isi password anda" });

    try {
      const res = await loginAPI({ username: u, password: p });

      setAuth({ token: res.data.token, user: res.data.user });

      fire({ icon: "success", title: "Berhasil!", text: "Login sukses!" });
      navigate("/Timeline");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Login gagal. Cek data / server.";
      fire({ icon: "error", title: "Gagal", text: msg });
      console.error(err);
    }
  };

  return (
    <>

      <div className="card">
        <div className="logo">
          <i className="ri-login-circle-line" />
        </div>

        <div className="title">Sign in</div>
        <div className="subtitle">
          Keep memories from every <br /> lifetime in your hands
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <i className="ri-user-line" />
            <input
              type="text"
              placeholder="Username..."
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="input-box">
            <i className="ri-lock-line" />
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i
              id="togglePassword"
              className={showPass ? "ri-eye-line" : "ri-eye-off-line"}
              onClick={() => setShowPass((s) => !s)}
              role="button"
              tabIndex={0}
            />
          </div>

          <button className="btn blue" type="submit">
            Sign In
          </button>

          {/* ✅ ganti tombol Sign up jadi teks link */}
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 14 }}>
            <span style={{ opacity: 0.8 }}>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={() => navigate("/register")}
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
              Sign up here
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
