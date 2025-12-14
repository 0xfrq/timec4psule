import React, { useEffect, useMemo, useRef, useState } from "react";
import "remixicon/fonts/remixicon.css";
import "../designtimecaps.css"; // kalau ada
import Navbar from "../components/Navbar";

export default function Feed() {
  const [query, setQuery] = useState("");
  const feedRef = useRef(null);

  const baseVideos = useMemo(
    () => [
      {
        id: 1,
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        title: "Yurika Anjani Sasmita",
        caption:
          "Lorem ipsum sit dolor ametur hash a duck of the marvellous father and lawson with the hot goat.",
        year: "2024",
      },
      {
        id: 2,
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        title: "Another Story",
        caption: "Caption of video here...",
        year: "2024",
      },
    ],
    []
  );

  // list yang akan di-render (nambah terus saat scroll mentok bawah)
  const [videos, setVideos] = useState(baseVideos);

  // infinite scroll clone (mirip script HTML kamu)
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      if (nearBottom) {
        setVideos((prev) => [
          ...prev,
          ...baseVideos.map((v) => ({
            ...v,
            id: `${v.id}-${prev.length}-${Date.now()}`,
          })),
        ]);
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [baseVideos]);

  const comments = [
    { id: 1, name: "Anton Planet Ban", text: "ipsum sit dolor ametur..." },
    { id: 2, name: "Anton Planet Ban", text: "ipsum sit dolor ametur..." },
    { id: 3, name: "Anton Planet Ban", text: "ipsum sit dolor ametur..." },
  ];

  return (
    <div>
      <Navbar />

      {/* SEARCH */}
      <div className="search-row">
        <input
          type="text"
          placeholder="Explore your story..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-btn" type="button">
          <i className="ri-search-line" style={{ color: "#2d2e30" }} />
        </button>

        <a href="#">
          <button className="upload-btn" type="button">
            <i className="ri-upload-line" style={{ color: "#151a1e" }} /> Upload
          </button>
        </a>
      </div>

      {/* LAYOUT */}
      <div className="container">
        {/* LEFT: TOPIC */}
        <div className="card topic">
          <div className="topic-badge">Suggested Topic</div>
          <h2>My Bini</h2>
          <div className="year">2024</div>

          <div className="detail">Detail</div>

          <p className="topic-text">
            Lorem ipsum sit dolor ametur hash a duck of the marvellous father and lawson with
            the hot goat goblin government and stay cool boy...
          </p>
        </div>

        {/* MIDDLE: VIDEO FEED */}
        <div className="video-feed" ref={feedRef}>
          {videos.map((v) => (
            <div className="video-card" key={v.id}>
              <video src={v.src} controls />

              <div className="video-actions">
                <div className="act-btn" title="Like">❤️</div>
                <div className="act-btn" title="Save">💾</div>
                <div className="act-btn" title="Share">📤</div>
              </div>

              <div className="video-caption">
                <div className="title">{v.title}</div>
                <div className="caption-text">{v.caption}</div>
                <div className="year">{v.year}</div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: COMMENTS */}
        <div className="card comments">
          <div className="comment-title">COMMENT</div>

          {comments.map((c) => (
            <div className="comment" key={c.id}>
              <div className="avatar" />
              <div className="comment-body">
                <div className="name">
                  <p className="pp1">{c.name}</p>
                </div>
                <div className="text">
                  <p className="pp1">{c.text}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="comment-input">
            <input type="text" placeholder="Type a comment..." />
            <button className="send-btn" type="button">
              <i className="ri-send-plane-fill" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
