import React, { useEffect, useMemo, useState } from "react";
import "remixicon/fonts/remixicon.css";


export default function SettingPage() {
  const [activePage, setActivePage] = useState("faq");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark-mode");
    else root.classList.remove("dark-mode");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const themeBtnText = useMemo(
    () => (theme === "dark" ? "Switch to Light" : "Switch to Dark"),
    [theme]
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert("Terkirim! (demo)");
  };

  const TabBtn = ({ id, label }) => {
    const active = activePage === id;
    return (
      <button
        type="button"
        onClick={() => setActivePage(id)}
        className={[
          "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition",
          active
            ? "bg-slate-900 text-white shadow-sm"
            : "bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col">
      {/* TOPBAR (fullscreen, light tone) */}
      <div className="h-16 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-6">
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center border border-slate-200">
              <i className="ri-settings-3-fill text-xl text-slate-900" />
            </div>
            <span className="text-lg">Settings</span>
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
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Setting
            </a>
           
            <a
              href="Dashboard"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Profile
            </a>

             <a
              href="uploadvideo"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-200"
            >
              Upload Video
            </a>
          </div>
        </div>
      </div>

      {/* MAIN: fullscreen area */}
      <div className="flex-1 min-h-0">
        <div className="mx-auto h-full max-w-[1400px] px-6 py-6">
          <div className="grid h-full min-h-0 grid-cols-12 gap-6">
            {/* SIDEBAR */}
            <aside className="col-span-3 h-full min-h-0 overflow-hidden">
              <div className="h-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="text-sm font-extrabold text-slate-900">Menu</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Pilih halaman setting di kiri
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
                  <TabBtn id="faq" label="FAQ" />
                  <TabBtn id="contact" label="Contact Us" />
                </div>
              </div>
            </aside>

            {/* CONTENT */}
            <section className="col-span-9 h-full min-h-0 overflow-hidden">
              <div className="h-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="shrink-0 border-b border-slate-200 px-6 py-4">
                  <div className="text-lg font-extrabold">
                    {activePage === "faq" && "Frequently Asked Questions"}
                    {activePage === "contact" && "Contact Us"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {activePage === "faq" && "Pertanyaan yang sering ditanyakan."}
                    {activePage === "contact" && "Kirim pesan ke tim."}
                  </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 min-h-0 overflow-auto p-6">
                  {/* FAQ */}
                  {activePage === "faq" && (
                    <div className="space-y-4">
                      {[
                        {
                          q: "What types of cleaning services do you offer?",
                          a:
                            "We offer a range of services, including residential cleaning, deep cleaning, move-in/move-out cleaning, and seasonal deep cleaning.",
                        },
                        {
                          q: "Are your cleaning products eco-friendly?",
                          a:
                            "Yes, we use environmentally safe products to ensure your home stays clean without harming the planet.",
                        },
                        {
                          q: "How do I schedule a cleaning service?",
                          a:
                            "You can book through our website or contact our support team to arrange an appointment.",
                        },
                        {
                          q: "Do I need to be home during the cleaning?",
                          a:
                            "No, it's optional. You may provide access instructions to our team.",
                        },
                        {
                          q: "What if I'm not satisfied with the cleaning?",
                          a:
                            "We provide a satisfaction guarantee. Contact us within 24 hours, and we'll re-clean the area for free.",
                        },
                      ].map((it, idx) => (
                        <details
                          key={idx}
                          className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 open:ring-slate-300"
                        >
                          <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
                            {it.q}
                          </summary>
                          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{it.a}</p>
                        </details>
                      ))}
                    </div>
                  )}

                  {/* CONTACT */}
                  {activePage === "contact" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-extrabold ring-1 ring-slate-200">
                          <i className="ri-mail-line" />
                          Contact Us
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                          Interested in working together? Fill out the Project Inquiry form
                        </p>

                        <div className="mt-5 space-y-2 text-sm text-slate-700">
                          <div><b>TIme Capsule Group</b></div>
                          <div>Ketintang Surabaya East Java Indonesia</div>
                          <div>Timecapsule@gmail.com</div>
                          <div>+6281359264810</div>
                        </div>
                      </div>

                      <form
                        className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
                        id="contactForm"
                        onSubmit={handleContactSubmit}
                      >
                        <div className="space-y-4">
                          <input
                            type="text"
                            id="name"
                            placeholder="Name"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <input
                            type="email"
                            id="email"
                            placeholder="Email"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <input
                            type="text"
                            id="subject"
                            placeholder="Subject"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <textarea
                            id="message"
                            placeholder="Message"
                            className="min-h-[140px] w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <button
                            type="submit"
                            id="send-btn"
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:opacity-90"
                          >
                            SEND
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
                    <div className="space-y-6">
                      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                      FAQ */}
                  {activePage === "faq" && (
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                        <div className="text-sm font-extrabold text-slate-900">Font Size</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Ini cuma UI (belum ngubah font beneran)
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <label className="cursor-pointer">
                            <input type="radio" name="fontsize" defaultChecked className="hidden" />
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-slate-200 hover:ring-slate-300">
                              Small
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input type="radio" name="fontsize" className="hidden" />
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-slate-200 hover:ring-slate-300">
                              Medium
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input type="radio" name="fontsize" className="hidden" />
                            <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-slate-200 hover:ring-slate-300">
                              Large
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACCOUNT */}
                  {activePage === "account" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                        <div className="text-sm font-extrabold text-slate-900">Akun</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Pengaturan akun (demo UI)
                        </div>
                      </div>

                      {[
                        { title: "Ubah Username", desc: "Mengganti nama pengguna Anda", btn: "Edit" },
                        { title: "Ganti Email", desc: "Perbarui alamat email akun", btn: "Edit" },
                        { title: "Ganti Kata Sandi", desc: "Ubah password untuk keamanan akun", btn: "Edit" },
                        { title: "Info Akun", desc: "Lihat informasi detail akun", btn: "Lihat" },
                        { title: "Tanggal Login Terakhir", desc: "20 November 2025 • 14:22" },
                      ].map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
                        >
                          <div>
                            <div className="text-sm font-extrabold text-slate-900">{it.title}</div>
                            <div className="mt-1 text-sm text-slate-600">{it.desc}</div>
                          </div>

                          {it.btn ? (
                            <button
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                              type="button"
                            >
                              {it.btn}
                            </button>
                          ) : null}
                        </div>
                      ))}

                      <div className="pt-2">
                        <button
                          className="w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white hover:brightness-110"
                          type="button"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAQ */}
                  {activePage === "faq" && (
                    <div className="space-y-4">
                      {[
                        {
                          q: "What types of cleaning services do you offer?",
                          a:
                            "We offer a range of services, including residential cleaning, deep cleaning, move-in/move-out cleaning, and seasonal deep cleaning.",
                        },
                        {
                          q: "Are your cleaning products eco-friendly?",
                          a:
                            "Yes, we use environmentally safe products to ensure your home stays clean without harming the planet.",
                        },
                        {
                          q: "How do I schedule a cleaning service?",
                          a:
                            "You can book through our website or contact our support team to arrange an appointment.",
                        },
                        {
                          q: "Do I need to be home during the cleaning?",
                          a:
                            "No, it’s optional. You may provide access instructions to our team.",
                        },
                        {
                          q: "What if I’m not satisfied with the cleaning?",
                          a:
                            "We provide a satisfaction guarantee. Contact us within 24 hours, and we’ll re-clean the area for free.",
                        },
                      ].map((it, idx) => (
                        <details
                          key={idx}
                          className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 open:ring-slate-300"
                        >
                          <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
                            {it.q}
                          </summary>
                          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{it.a}</p>
                        </details>
                      ))}
                    </div>
                  )}

                  {/* CONTACT */}
                  {activePage === "contact" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-extrabold ring-1 ring-slate-200">
                          <i className="ri-mail-line" />
                          Contact Us
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                          Interested in working together? Fill out the Project Inquiry form
                        </p>

                        <div className="mt-5 space-y-2 text-sm text-slate-700">
                          <div><b>TIme Capsule Group</b></div>
                          <div>Ketintang Surabaya East Java Indonesia</div>
                          <div>Timecapsule@gmail.com</div>
                          <div>+6281359264810</div>
                        </div>
                      </div>

                      <form
                        className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"
                        id="contactForm"
                        onSubmit={handleContactSubmit}
                      >
                        <div className="space-y-4">
                          <input
                            type="text"
                            id="name"
                            placeholder="Name"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <input
                            type="email"
                            id="email"
                            placeholder="Email"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <input
                            type="text"
                            id="subject"
                            placeholder="Subject"
                            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <textarea
                            id="message"
                            placeholder="Message"
                            className="min-h-[140px] w-full rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-200 outline-none focus:ring-slate-300"
                          />
                          <button
                            type="submit"
                            id="send-btn"
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:opacity-90"
                          >
                            SEND
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </section>
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
