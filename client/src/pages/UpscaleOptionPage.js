import React, { useState } from "react";
import "../designtimecaps.css";
import Navbar from "../components/Navbar";

export default function UpscaleOptionPage() {
  const [scale, setScale] = useState("2x");

  const styles = {
    imageBox: {
      width: "65%",
      height: 500,
      border: "2px dashed #ff9d9d",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fafafa",
      fontSize: 40,
      fontWeight: 500,
      marginLeft: "5%",
      marginRight: "5%",
    },
    panel: {
      width: "35%",
      background: "#eef0f7",
      padding: "40px 30px",
      borderRadius: 10,
    },
    title: {
      fontSize: 32,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    yellow: {
      background: "#ffc400",
      padding: "4px 6px",
      borderRadius: 4,
      color: "#5c8df0",
    },
    optionBtn: (active) => ({
      width: "100%",
      marginTop: 20,
      border: "2px solid #5c8df0",
      padding: "16px 0",
      borderRadius: 12,
      fontSize: 18,
      fontWeight: 600,
      background: active ? "#5c8df0" : "rgba(255,255,255,0)",
      color: active ? "white" : "#5c8df0",
      cursor: "pointer",
    }),
    upscaleBtn: {
      marginTop: 40,
      width: "100%",
      padding: "18px 0",
      background: "#ffcc00",
      border: 0,
      borderRadius: 12,
      fontSize: 20,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    main: {
      display: "flex",
      gap: 20,
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
  };

  const onUpscale = () => {
    alert(`Upscale: ${scale.toUpperCase()} (demo)`);
  };

  return (
    <div>
      <Navbar />

      <br />
      <br />
      <br />

      <div style={styles.main}>
        <div style={styles.imageBox}>IMAGE</div>

        <div style={styles.panel}>
          <div style={styles.title}>
            <span style={styles.yellow}>Upscale</span> Option
          </div>

          <button
            type="button"
            style={styles.optionBtn(scale === "2x")}
            onClick={() => setScale("2x")}
          >
            2X UPSCALE
          </button>

          <button
            type="button"
            style={styles.optionBtn(scale === "4x")}
            onClick={() => setScale("4x")}
          >
            4X UPSCALE
          </button>

          <button type="button" style={styles.upscaleBtn} onClick={onUpscale}>
            Upscale ➜
          </button>
        </div>
      </div>
    </div>
  );
}
