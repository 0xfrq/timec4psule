import React from "react";
import "remixicon/fonts/remixicon.css";

export default function ToolsPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      {/* TOPBAR */}
      <div className="h-16 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center border border-slate-200">
              <i className="ri-tools-fill text-xl text-slate-900" />
            </div>
            <span className="text-lg">Tools</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="feed"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Home
            </a>
            <a
              href="faq"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Setting
            </a>
            <a
              href="#"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Tools
            </a>
            <a
              href="dashboard"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Profile
            </a>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          {/* HERO */}
          <section className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Every tool you could want to edit images in bulk
            </h1>
            <p className="mt-2 text-sm text-slate-500 tracking-[0.25em]">
              Your online photo editor is here and forever free!
            </p>
          </section>

          {/* CARDS */}
          <section className="mt-10 grid gap-8 md:grid-cols-2">
            {/* Card 1 */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="relative aspect-square w-full">
                <img
                  src="https://images.unsplash.com/photo-1521898284481-a5ec348cb555?auto=format&fit=crop&w=1200&q=60"
                  alt="Upscale"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center ring-1 ring-slate-200">
                    <i className="ri-image-2-line text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Upscale</div>
                    <div className="text-xs text-slate-500">Enhance image resolution</div>
                  </div>
                </div>

                <a href="/upscale" className="mt-4 block">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#5c8df0] px-4 py-3 text-sm font-extrabold text-white hover:brightness-110"
                  >
                    Get Started
                  </button>
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="relative aspect-square w-full">
                <img
                  src="https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1200&q=60"
                  alt="Remove Background"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center ring-1 ring-slate-200">
                    <i className="ri-scissors-2-line text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">Remove Background</div>
                    <div className="text-xs text-slate-500">Clean cutout automatically</div>
                  </div>
                </div>

                <a href="/remove" className="mt-4 block">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#black] px-4 py-3 text-sm font-extrabold text-slate-900 hover:brightness-105"
                  >
                    Get Started
                  </button>
                </a>
              </div>
            </div>
          </section>

          <div className="h-10" />
        </div>
      </div>

      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; background: #f8fafc; }
      `}</style>
    </div>
  );
}
