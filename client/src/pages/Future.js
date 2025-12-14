import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "remixicon/fonts/remixicon.css";

export default function Future() {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [years, setYears] = useState([]); // array number
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (!API_BASE_URL) throw new Error("API URL belum diset (REACT_APP_API_URL).");

        const res = await fetch(`${API_BASE_URL}/api/post/tahun/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Gagal ambil tahun (${res.status})`);

        const data = await res.json();
        const raw = Array.isArray(data?.tahun) ? data.tahun : [];

        // ambil tahun dan filter future: > tahun sekarang
        const onlyFuture = raw
          .map((x) => Number(x?.tahun))
          .filter((n) => Number.isFinite(n) && n > currentYear)
          .sort((a, b) => a - b);

        if (alive) setYears(onlyFuture);
      } catch (e) {
        if (alive) setErr(e?.message || "Terjadi error.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [API_BASE_URL, currentYear]);

  const goFeed = (y) => navigate(`/feed?tahun=${encodeURIComponent(String(y))}`);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOPBAR */}
      <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100">
              <i className="ri-time-line text-xl" />
            </div>
            <span>Future</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/feed"
              className="rounded-full bg-[#5c8df0] px-4 py-2 text-sm font-extrabold text-white hover:brightness-110"
            >
              Home
            </Link>
            <Link
              to="/Timeline"
              className="rounded-full bg-[#ffcc22] px-4 py-2 text-sm font-extrabold text-slate-900 hover:brightness-105"
            >
              Timeline
            </Link>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Future Years (>{currentYear})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Data dari <b>/api/post/tahun/</b> lalu difilter tahun di atas tahun sekarang.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Tahun sekarang: <b className="text-slate-900">{currentYear}</b>
          </div>
        </header>

        {/* States */}
        {loading ? (
          <div className="grid place-items-center py-20 text-sm text-slate-500">
            Loading…
          </div>
        ) : err ? (
          <div className="grid place-items-center py-20 text-sm text-rose-600">
            {err}
          </div>
        ) : !years.length ? (
          <div className="grid place-items-center py-24">
            <div className="text-sm text-slate-500">Memori belum dibuat :(</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => goFeed(y)}
                  title={`Buka feed tahun ${y}`}
                  className={[
                    "h-12 rounded-2xl px-3 text-sm font-semibold tracking-wide transition",
                    "shadow-[0_10px_18px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_28px_rgba(0,0,0,0.14)]",
                    "active:translate-y-[-1px] hover:-translate-y-1",
                    "bg-[#5c8df0] text-white border border-transparent hover:bg-[#ffcc22] hover:text-slate-900",
                  ].join(" ")}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="mt-5 text-sm text-slate-600">
              Klik salah satu tahun untuk menuju <b>/feed?tahun=YYYY</b>.
            </div>
          </>
        )}
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}
