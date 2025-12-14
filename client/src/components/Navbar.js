import React from "react";
import { Link, useLocation } from "react-router-dom";
import "remixicon/fonts/remixicon.css";

export default function Navbar() {
  const { pathname } = useLocation();

  const isActive = (path) => pathname.toLowerCase() === path.toLowerCase();

  return (
    <div className="topbar">
      <div className="brand">
        <img
          src="https://dummyimage.com/220x70/4d8dff/ffffff&text=Time+Caps"
          className="preview-thumb"
          alt="Time Caps"
        />
      </div>

      <div className="nav-buttons">
        <Link to="/feed">
          <button className={`btn1 ${isActive("/feed") ? "active-nav" : ""}`}>
            Home
          </button>
        </Link>

        <Link to="/faq">
          <button className={`btn1 ${isActive("/faq") ? "active-nav" : ""}`}>
            Setting
          </button>
        </Link>

        <Link to="/Toolspage">
          <button className={`btn1 ${isActive("/Toolspage") ? "active-nav" : ""}`}>
            Tools
          </button>
        </Link>

        <Link to="/dashboard">
          <button className={`btn1 ${isActive("/dashboard") ? "active-nav" : ""}`}>
            Profile
          </button>
        </Link>
      </div>
    </div>
  );
}
