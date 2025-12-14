import React from "react";
import "remixicon/fonts/remixicon.css";
import "../designtimecaps.css";
import Navbar from "../components/Navbar";

export default function Download() {
  const styles = {
    main: {
      padding: "60px 40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    successTitle: {
      marginTop: 20,
      fontSize: 38,
      fontWeight: 700,
      color: "#3b5edb",
    },
    titleSpan: {
      background: "#ffc400",
      padding: "4px 10px",
      borderRadius: 4,
      color: "#000",
      marginRight: 8,
      display: "inline-block",
    },
    successCard: {
      marginTop: 40,
      width: 520,
      background: "white",
      padding: "40px 30px 55px",
      borderRadius: 20,
      boxShadow: "0 8px 18px rgba(0,0,0,0.1)",
      textAlign: "center",
    },
    successIcon: {
      width: 70,
      height: 70,
      margin: "auto",
      borderRadius: "50%",
      background: "#ffcc00",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: 32,
      fontWeight: 700,
      color: "#3b3b3b",
      border: "6px solid #fff",
      boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
    },
    filename: {
      marginTop: 18,
      background: "#eceffc",
      padding: "6px 20px",
      borderRadius: 20,
      fontSize: 14,
      color: "#333",
      letterSpacing: "0.5px",
      display: "inline-block",
    },
    downloadBox: { marginTop: 25, display: "flex", justifyContent: "center" },
    downloadBtn: {
      border: "2px solid #6fa0ff",
      background: "white",
      padding: "15px 0",
      width: 330,
      borderRadius: 12,
      fontSize: 20,
      fontWeight: 600,
      color: "#5c8df0",
      cursor: "pointer",
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    downloadAfter: {
      position: "absolute",
      right: 0,
      top: 0,
      width: 50,
      height: "100%",
      background: "#ffcc00",
      borderRadius: "0 10px 10px 0",
    },
    downloadText: { position: "relative", zIndex: 2 },
  };

  const filename = "Namafile.jpg";

  const handleDownload = () => {
    alert("Download Image (demo)");
    // nanti: arahkan ke url file hasil upscale
  };

  return (
    <div>
      <Navbar />

      {/* CONTENT */}
      <div style={styles.main}>
        <div style={styles.successTitle}>
          <span style={styles.titleSpan}>Upscale</span> Succesfully
        </div>

        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <i className="ri-download-cloud-2-fill" />
          </div>

          <div style={styles.filename}>
            <p id="namafile" style={{ margin: 0 }}>
              {filename}
            </p>
          </div>

          <div style={styles.downloadBox}>
            <button type="button" style={styles.downloadBtn} onClick={handleDownload}>
              <span style={styles.downloadText}>Download Image</span>
              <span style={styles.downloadAfter} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
