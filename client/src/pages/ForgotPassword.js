import React, { useState } from "react";
import "remixicon/fonts/remixicon.css";
import "../style.css"; // sesuaikan path css kamu
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSendCode = () => {
    const e = email.trim();
    if (!e) return alert("Email harus diisi!");
    // nanti sambung API kirim kode ke email

    // pindah ke halaman enter code
    navigate("/enter-code");
  };

  return (
    <div className="register-box">
      <i className="ri-lock-password-line login-icon"></i>

      <div className="register-title">Forgot Password</div>
      <div className="register-desc">
        Enter your email to reset <br /> your password
      </div>

      <div className="input-box">
        <i className="ri-mail-line"></i>
        <input
          type="email"
          placeholder="Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="btn-blue" type="button" onClick={handleSendCode}>
        Send Code
      </button>

      <p className="forgot-text">
        <a href="/login">Back to Login</a>
      </p>
    </div>
  );
}
