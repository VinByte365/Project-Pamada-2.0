"use client";

import { useEffect, useMemo, useState } from "react";
import { AppFrame, Stat } from "@/components/aloe-guard";
import { api, CommunityPost, Comment } from "@/lib/api";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  // Modal / form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "Propagation, Soil Nutrients",
    author_name: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [postsData, commentsData] = await Promise.all([
        api.community.listPosts(),
        api.comments.list(),
      ]);
      setPosts(postsData || []);

      // Group comments by post_id
      const grouped: Record<string, Comment[]> = {};
      for (const c of commentsData || []) {
        if (c.post_id) {
          grouped[c.post_id] = [...(grouped[c.post_id] || []), c];
        }
      }
      setComments(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load community discussions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      content: "",
      tags: "Soil Health, Organic Pest Control",
      author_name: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: CommunityPost) => {
    setEditingPost(p);
    setFormData({
      title: p.title || "",
      content: p.content || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      author_name: p.author_name || "",
    });
    setIsModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      setSaving(true);
      setError("");
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingPost) {
        await api.community.updatePost(editingPost.id, payload);
        setNotification("Community discussion post updated.");
      } else {
        await api.community.createPost(payload);
        setNotification("New post shared with the grower community!");
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      setSaving(true);
      await api.community.deletePost(id);
      setDeleteConfirmId(null);
      setNotification("Discussion post removed.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim()) return;
    try {
      setCommentSaving(true);
      await api.comments.create({
        post_id: postId,
        content: newCommentText.trim(),
      });
      setNewCommentText("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setCommentSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment.");
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const tagsStr = Array.isArray(p.tags) ? p.tags.join(" ") : p.tags || "";
      const text = `${p.title} ${p.content} ${tagsStr} ${p.author_name || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [posts, search]);

  const totalComments = Object.values(comments).reduce((acc, list) => acc + list.length, 0);

  return (
    <AppFrame active="Community">
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">FARMSYSTEM <span>·</span> GROWER COLLABORATION</p>
            <h1>Aloe Grower Community</h1>
            <p>Exchange organic soil management tips, disease treatment insights, and commercial harvest updates.</p>
          </div>
          <button className="primary-button" onClick={openAddModal} type="button">
            ＋ Start a Discussion
          </button>
        </div>

        {notification && (
          <div className="alert-banner success" role="status">
            <span>{notification}</span>
            <button className="text-button" onClick={() => setNotification("")} type="button">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-banner error" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={() => setError("")} type="button">✕</button>
          </div>
        )}

        <div className="stats-grid">
          <Stat icon="C" label="Discussions" value={loading ? "—" : String(posts.length)} detail="Topics started" />
          <Stat icon="💬" label="Grower Replies" value={loading ? "—" : String(totalComments)} detail="Community comments" />
          <Stat
            icon="👥"
            label="Contributors"
            value={loading ? "—" : String(new Set(posts.map((p) => p.author_name).filter(Boolean)).size || 1)}
            detail="Active cultivators"
          />
          <Stat icon="🏷" label="Categories" value="8" detail="Agronomy topics" />
        </div>

        <section className="panel">
          <div className="filters-row">
            <label className="search-field">
              <span>Search Community Posts</span>
              <span className="search-input">
                <span aria-hidden="true">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search discussion topics, crop tips, or grower tags..."
                />
              </span>
            </label>
          </div>

          {loading ? (
            <div className="dashboard-empty">Loading community discussions from backend...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="dashboard-empty">
              <span className="empty-illustration">💬</span>
              <strong>{posts.length === 0 ? "No discussions yet." : "No posts match your search."}</strong>
              <p>Be the first to share an agronomy tip or ask a question regarding Aloe Vera cultivation.</p>
              {posts.length === 0 && (
                <button className="secondary-button" onClick={openAddModal} type="button">
                  Create First Discussion
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
              {filteredPosts.map((post) => {
                const postComments = comments[post.id] || [];
                const isExpanded = activePostId === post.id;
                const tagsList = Array.isArray(post.tags)
                  ? post.tags
                  : (post.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

                return (
                  <article
                    key={post.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "6px",
                      padding: "20px",
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                          <span className="status-badge healthy" style={{ fontSize: "9px" }}>
                            {post.author_name || "Aloe Grower"}
                          </span>
                          <time style={{ color: "var(--muted)", fontSize: "10px" }}>
                            {post.created_at ? new Date(post.created_at).toLocaleString() : "Recently"}
                          </time>
                        </div>
                        <h2 style={{ margin: "0 0 8px", font: "600 20px var(--font-display), serif", color: "var(--forest)" }}>
                          {post.title}
                        </h2>
                      </div>
                      <div className="table-actions">
                        <button
                          className="btn-icon"
                          title="Edit Post"
                          onClick={() => openEditModal(post)}
                          type="button"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete Post"
                          onClick={() => setDeleteConfirmId(post.id)}
                          type="button"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: "10px 0 14px", color: "var(--ink)", fontSize: "13px", lineHeight: "1.65" }}>
                      {post.content}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid #edf0e9", paddingTop: "12px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {tagsList.map((tag, idx) => (
                          <span key={idx} className="tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <button
                        className="secondary-button"
                        style={{ minHeight: "32px", fontSize: "11px", padding: "0 12px" }}
                        onClick={() => setActivePostId(isExpanded ? null : post.id)}
                        type="button"
                      >
                        💬 {postComments.length} {postComments.length === 1 ? "Comment" : "Comments"} {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>

                    {/* Threaded Comments Section */}
                    {isExpanded && (
                      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed var(--line)", background: "#fafbf8", padding: "16px", borderRadius: "5px" }}>
                        <h3 style={{ margin: "0 0 12px", color: "var(--forest)", fontSize: "13px" }}>
                          Discussion Replies ({postComments.length})
                        </h3>

                        {postComments.length === 0 ? (
                          <p className="subtle-text" style={{ margin: "0 0 12px" }}>
                            No comments yet. Share your experience or feedback below!
                          </p>
                        ) : (
                          <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
                            {postComments.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  background: "#ffffff",
                                  border: "1px solid var(--line)",
                                  borderRadius: "4px",
                                  padding: "10px 12px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                                    <strong style={{ fontSize: "11px", color: "var(--forest)" }}>
                                      {c.author_name || "Fellow Grower"}
                                    </strong>
                                    <span style={{ fontSize: "9px", color: "var(--muted)" }}>
                                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                                    </span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "12px", color: "var(--ink)" }}>{c.content}</p>
                                </div>
                                <button
                                  className="text-button"
                                  style={{ color: "var(--danger)", fontSize: "10px" }}
                                  onClick={() => handleDeleteComment(c.id)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            style={{ flex: 1, minHeight: "36px", padding: "0 10px", border: "1px solid #dce2d8", borderRadius: "4px", fontSize: "12px" }}
                            placeholder="Write a reply or recommendation..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <button
                            className="primary-button"
                            style={{ minHeight: "36px", padding: "0 14px", fontSize: "11px" }}
                            disabled={commentSaving || !newCommentText.trim()}
                            onClick={() => handleAddComment(post.id)}
                            type="button"
                          >
                            {commentSaving ? "Posting..." : "Reply"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>{editingPost ? "Edit Discussion Post" : "Share a Discussion Post"}</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)} type="button">✕</button>
              </div>
              <form onSubmit={handleSavePost}>
                <div className="form-grid single">
                  <div className="form-field">
                    <label>Discussion Topic / Title *</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Best organic treatments for Aloe Rust in high humidity"
                    />
                  </div>
                  <div className="form-field">
                    <label>Tags / Categories (comma separated)</label>
                    <input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g. Pathology, Irrigation, Soil NPK, Harvest"
                    />
                  </div>
                  <div className="form-field">
                    <label>Post Body &amp; Details *</label>
                    <textarea
                      required
                      style={{ minHeight: "120px" }}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Detail your experience, trial observations, soil sensor readings, or questions..."
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Publishing..." : editingPost ? "Save Changes" : "Publish Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="modal-backdrop" onClick={() => !saving && setDeleteConfirmId(null)}>
            <div className="modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Delete Discussion</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)} type="button">✕</button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "12px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this discussion topic and all associated replies?
              </p>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => handleDeletePost(deleteConfirmId)}
                  disabled={saving}
                >
                  {saving ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AppFrame>
  );
}

