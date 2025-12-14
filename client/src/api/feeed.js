import client from "./client";

/**
 * Contoh kontrak backend (bebas kamu sesuaikan):
 * GET /api/feed?cursor=
 * return:
 * {
 *   topic: { title, year, detail, text },
 *   videos: [{ id, src, title, caption, year }],
 *   comments: [{ id, videoId, name, text, createdAt }],
 *   nextCursor: "..." | null
 * }
 */
export const getFeedAPI = (cursor = null) =>
  client.get("/api/feeed", { params: cursor ? { cursor } : {} });

/**
 * POST /api/comments
 * body: { videoId, text }
 * return: { id, videoId, name, text, createdAt }
 */
export const postCommentAPI = (payload) =>
  client.post("/api/comments", payload);
