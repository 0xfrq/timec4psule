import React, { useEffect, useRef, useState } from "react";
import "remixicon/fonts/remixicon.css";
import "../style.css"; // sesuaikan path css kamu

export default function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current?.[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // angka saja, ambil 1 digit terakhir
    const digit = (value || "").replace(/[^0-9]/g, "").slice(-1);

    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      // kalau kosong, mundur
      if (!code[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!text) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setCode(next);

    const focusIndex = Math.min(text.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const onVerify = () => {
    const joined = code.join("");
    if (joined.length < 6) return alert("Kode harus 6 digit!");
    alert("Verifying code: " + joined); // nanti sambung API
  };

  return (
    <div className="register-box">
      <i className="ri-shield-check-line login-icon"></i>

      <div className="register-title">Verify Code</div>
      <div className="register-desc">
        Enter the 6-digit code we <br /> sent to your email
      </div>

      <div className="code-container" onPaste={handlePaste}>
        {code.map((v, i) => (
          <input
            key={i}
            className="code-input"
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            ref={(el) => (inputsRef.current[i] = el)}
          />
        ))}
      </div>

      <button className="btn-blue" type="button" onClick={onVerify}>
        Verify
      </button>

      <p className="forgot-text">
        <a href="/login">Back to Login</a>
      </p>
    </div>
  );
}
