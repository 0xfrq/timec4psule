import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import { useSession } from "../context/SessionContext";

export default function Timeline() {
  const [active, setActive] = useState(null);

  // fullscreen player state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSrc, setFullscreenSrc] = useState(null);
  const [targetPath, setTargetPath] = useState(null);

  const navigate = useNavigate();
  const fullscreenRef = useRef(null);

  useEffect(() => {
    if (!isFullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    fullscreenRef.current?.play?.().catch(() => {});

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const openFullscreenVideo = (key, path, videoSrc) => {
    setActive((prev) => (prev === key ? null : key));
    setTargetPath(path);
    setFullscreenSrc(videoSrc);
    setIsFullscreen(true);
  };

  const finishAndRedirect = () => {
    setIsFullscreen(false);
    if (targetPath) navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR style FEED */}
      <FeedNavbarLike rightInfo={active ? `Selected: ${active}` : "Timeline"} />

      {/* FULLSCREEN VIDEO */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[99999] bg-black">
          {/* top controls */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[100000]">
            <div className="pointer-events-auto mx-auto flex max-w-[1400px] items-center justify-end p-4">
              <button
                onClick={finishAndRedirect}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-slate-900 shadow-lg ring-1 ring-black/10 hover:bg-white"
              >
                <i className="ri-skip-forward-fill text-lg" />
                SKIP
              </button>
            </div>
          </div>

          <video
            ref={fullscreenRef}
            className="h-full w-full object-cover"
            src={fullscreenSrc || ""}
            autoPlay
            playsInline
            muted
            preload="auto"
            onEnded={finishAndRedirect}
          />
        </div>
      )}

      {/* MAIN */}
      <div className="px-6 py-10">
        <div className="mx-auto max-w-[1100px]">
          {/* header */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Timeline</h1>
              <p className="mt-1 text-sm text-slate-500">
                Pilih era → video fullscreen → otomatis pindah halaman.
              </p>
            </div>

            <div className="flex items-center gap-2">
              
               
            </div>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 place-items-center gap-7 md:grid-cols-3 md:gap-10">
            <TimeCard
              title="PAST"
              subText="Past Years"
              videoSrc="https://api.timecapsule.biz.id/public/video/pastt.mp4"
              active={active === "past"}
              onClick={() => openFullscreenVideo("past", "/Past", "https://api.timecapsule.biz.id/public/video/pastt.mp4")}
            />

            <TimeCard
              title="PRESENT"
              subText="Current Year"
              videoSrc="https://api.timecapsule.biz.id/public/video/pre.mp4"
              active={active === "present"}
              onClick={() => openFullscreenVideo("present", "/Curent", "https://api.timecapsule.biz.id/public/video/pre.mp4")}
              accent="yellow"
            />

            <TimeCard
              title="FUTURE"
              subText="Future Years"
              videoSrc="https://api.timecapsule.biz.id/public/video/ftr.mp4"
              active={active === "future"}
              onClick={() => openFullscreenVideo("future", "/Future", "https://api.timecapsule.biz.id/public/video/ftr.mp4")}
            />
          </div>
        </div>
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}

/** Navbar yang look & feel-nya sama kayak Feed */
function FeedNavbarLike({ rightInfo = "" }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  return (
    <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100">
            <i className="ri-time-line text-xl text-slate-900" />
          </div>
          <span className="text-lg">Timeline</span>
        </div>



        {/* Nav + user */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/Timeline"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
          >
            Home
          </Link>
          <Link
            to="/faq"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
          >
            Setting
          </Link>
          <Link
            to="/dashboard"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
          >
            Profile
          </Link>

          <div className="mx-2 hidden h-8 w-px bg-slate-200 sm:block" />

          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-xs text-slate-600">
              Halo, <b className="text-slate-900">{user?.username || "User"}</b>
              {rightInfo ? (
                <>
                  {" "}• <span className="text-slate-500">{rightInfo}</span>
                </>
              ) : null}
            </div>

            <button
              onClick={() => {
                logout?.();
                navigate("/login");
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeCard({ title, subText, videoSrc, active, onClick, accent = "blue" }) {
  const ringColor = accent === "yellow" ? "ring-[#ffcc22]" : "ring-[#5c8df0]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative h-[360px] w-[270px] overflow-hidden rounded-[22px] bg-black text-left shadow-[0_14px_30px_rgba(0,0,0,0.14)]",
        "transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_22px_46px_rgba(0,0,0,0.20)]",
        active ? `scale-[1.07] ${ringColor} ring-2` : "ring-1 ring-slate-200",
      ].join(" ")}
    >
      <video
        src={videoSrc}
        preload="metadata"
        muted
        playsInline
        className="pointer-events-none h-full w-full scale-[1.03] object-cover brightness-[0.72]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />

      <div className="pointer-events-none absolute inset-x-0 top-6 text-center">
        <div className="text-[30px] font-extrabold tracking-[0.22em] text-white drop-shadow-[0_10px_22px_rgba(0,0,0,0.35)]">
          {title}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 px-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur ring-1 ring-white/15">
            {subText}
          </span>

          <span
            className={[
              "grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur ring-1 ring-white/15",
              "transition group-hover:bg-white/20",
            ].join(" ")}
          >
            <i className="ri-play-fill text-xl" />
          </span>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className={[
              "h-full w-0 rounded-full transition-all duration-300 group-hover:w-full",
              accent === "yellow" ? "bg-[#ffcc22]" : "bg-[#5c8df0]",
            ].join(" ")}
          />
        </div>
      </div>
    </button>
  );
}
