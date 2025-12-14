import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import { useSession } from "../context/SessionContext";

export default function Curent() {
  const { token } = useSession();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [years, setYears] = useState([]); // list of numbers (should be only current year)
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg("");

        if (!API_BASE_URL) {
          throw new Error("API URL belum diset (REACT_APP_API_URL).");
        }

        const res = await fetch(`${API_BASE_URL}/api/post/tahun/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) throw new Error(`Gagal ambil tahun (${res.status})`);

        const data = await res.json();
        const list = Array.isArray(data?.tahun) ? data.tahun : [];

        const normalized = list
          .map((x) => {
            if (x && typeof x === "object") return Number(x.tahun);
            return Number(x);
          })
          .filter((n) => Number.isFinite(n));

        // ONLY current year
        const onlyCurrent = normalized
          .filter((y) => y === currentYear)
          .sort((a, b) => b - a);

        if (!alive) return;
        setYears(onlyCurrent);
      } catch (e) {
        if (!alive) return;
        setErrMsg(e?.message || "Terjadi error.");
        setYears([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [API_BASE_URL, token, currentYear]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* TOPBAR */}
      <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold">
            <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center border border-slate-200">
              <i className="ri-calendar-line text-xl" />
            </div>
            <span>Curent</span>

            <span className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold ring-1 ring-slate-200 text-slate-700">
              tahun sekarang: {currentYear}
            </span>
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
            <h2 className="text-xl font-extrabold tracking-tight">Current Year</h2>
            <p className="mt-1 text-sm text-slate-500">
              Data diambil dari <b>/api/post/tahun/</b> dan difilter: <b>tahun == {currentYear}</b>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Endpoint: <b className="text-slate-900">/api/post/tahun/</b>
          </div>
        </header>

        {!!errMsg && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errMsg}
          </div>
        )}

        {loading ? (
          <div className="grid min-h-[320px] place-items-center">
            <div className="text-sm text-slate-500">Loading…</div>
          </div>
        ) : years.length === 0 ? (
          <div className="grid min-h-[320px] place-items-center">
            <div className="text-sm text-slate-500">Memori belum dibuat :(</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {years.map((y) => (
              <Link key={y} to={`/feed?tahun=${encodeURIComponent(String(y))}`}>
                <button
                  type="button"
                  title={`Lihat feed tahun ${y}`}
                  className={[
                    "h-12 w-full rounded-2xl px-3 text-sm font-semibold tracking-wide transition",
                    "shadow-[0_10px_18px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_28px_rgba(0,0,0,0.14)]",
                    "active:translate-y-[-1px] hover:-translate-y-1",
                    "bg-[#5c8df0] text-white border border-transparent hover:bg-[#ffcc22] hover:text-slate-900",
                  ].join(" ")}
                >
                  {y}
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}
