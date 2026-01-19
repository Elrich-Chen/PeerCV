"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAuthUser } from "../auth";

const formatTimestamp = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getOwnerDetails = (item) => {
  const owner = item?.owner || {};
  return {
    username: owner.username || item?.username || "",
    headline: owner.headline || "",
  };
};

export default function CommentSection({
  postId,
  apiBase,
  token,
  onCountChange,
  layout = "default",
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const isModal = layout === "modal";

  const isReady = body.trim().length > 0;
  const authUser = getAuthUser();
  const currentUsername = authUser?.username || authUser?.email || "";

  const buttonClass = useMemo(() => {
    if (isReady) {
      return "btn-primary shadow-[0_0_16px_rgba(255,61,0,0.35)]";
    }
    return "btn-ghost text-muted-foreground";
  }, [isReady]);

  const commentCardClass = (optimistic) =>
    [
      "rounded-xl border border-border px-4 py-3",
      isModal ? "bg-muted/30" : "bg-background",
      optimistic ? "opacity-70" : "",
    ].join(" ");

  const commentsByParent = useMemo(() => {
    const map = new Map();
    comments.forEach((comment) => {
      const parentId = comment.parent_comment_id || null;
      const key = parentId ? String(parentId) : "root";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(comment);
    });
    return map;
  }, [comments]);

  const rootComments = commentsByParent.get("root") || [];

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/comments/${postId}`);
      if (!response.ok) {
        throw new Error("Failed to load comments.");
      }
      const data = await response.json();
      const fallbackTimestamp = new Date().toISOString();
      const normalized = (Array.isArray(data) ? data : []).map((comment) => ({
        ...comment,
        created_at: comment.created_at || fallbackTimestamp,
      }));
      setComments(normalized);
    } catch (error) {
      toast.error("Could not load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    setBody("");
    setReplyTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [postId]);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(comments.length);
    }
  }, [comments, onCountChange]);

  const handleInput = (event) => {
    setBody(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Sign in to add comments.");
      return;
    }

    if (!isReady || submitting) {
      return;
    }

    const optimistic = {
      id: `temp-${Date.now()}`,
      username: authUser?.username || "you",
      body: body.trim(),
      created_at: new Date().toISOString(),
      parent_comment_id: replyTo?.id || null,
      optimistic: true,
    };

    setComments((prev) => [optimistic, ...prev]);
    setBody("");
    setReplyTo(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${apiBase}/comments/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          body: optimistic.body,
          parent_comment_id: replyTo?.id || null,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to add comment.");
      }

      toast.success("Comment added.", { duration: 2000 });
      await loadComments();
    } catch (error) {
      setComments((prev) => prev.filter((item) => item.id !== optimistic.id));
      toast.error("Could not add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!token) {
      toast.error("Sign in to delete comments.");
      return;
    }

    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Delete failed.");
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted.", { duration: 2000 });
    } catch (error) {
      toast.error("Could not delete comment.");
    }
  };

  const handleReply = (comment) => {
    const ownerDetails = getOwnerDetails(comment);
    setReplyTo({
      id: comment.id,
      username: ownerDetails.username || "anonymous",
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const renderThread = (comment, depth = 0) => {
    const commentId = String(comment.id);
    const replies = commentsByParent.get(commentId) || [];
    const hasIndent = depth > 0;
    const nextDepth = Math.min(depth + 1, 1);
    const ownerDetails = getOwnerDetails(comment);
    const commentOwnerName = ownerDetails.username;
    const commentHeadline = ownerDetails.headline;
    const displayName = commentOwnerName || "anonymous";

    return (
      <div
        key={commentId}
        className={`space-y-3 ${hasIndent ? "ml-8 border-l-2 border-zinc-800 pl-4" : ""}`}
      >
        <div className={commentCardClass(comment.optimistic)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                @{displayName}
              </span>
              {commentHeadline ? (
                <span className="text-xs text-muted-foreground">
                  {commentHeadline}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              <span>{formatTimestamp(comment.created_at)}</span>
              <button
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                type="button"
                onClick={() => handleReply(comment)}
                disabled={comment.optimistic}
              >
                Reply
              </button>
              {token &&
              currentUsername &&
              commentOwnerName &&
              commentOwnerName === currentUsername ? (
                <button
                  className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={comment.optimistic}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {comment.body}
          </p>
        </div>

        {replies.length > 0 ? (
          <div className="space-y-3">
            {replies.map((reply) => renderThread(reply, nextDepth))}
          </div>
        ) : null}
      </div>
    );
  };

  const commentHeader = (
    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
      <span>
        Comments {comments.length ? `(${comments.length})` : ""}
      </span>
      <button
        className="btn-ghost px-2 py-1 text-[10px]"
        type="button"
        onClick={loadComments}
      >
        Refresh
      </button>
    </div>
  );

  const renderForm = () => {
    if (!token) {
      if (layout === "modal") {
        return null;
      }
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Sign in to add a comment.{" "}
          <Link className="text-accent hover:opacity-80" href="/login">
            Login
          </Link>
        </div>
      );
    }

    return (
      <form
        className={layout === "modal" ? "space-y-3" : "card space-y-3 px-4 py-4"}
        onSubmit={handleSubmit}
      >
        {replyTo ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            <span>
              Replying to <span className="text-foreground">@{replyTo.username}</span>
            </span>
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-accent"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          className={`textarea min-h-[90px] resize-none border-zinc-800 ${
            isModal ? "rounded-xl bg-background/80" : ""
          }`}
          placeholder="Write a helpful note..."
          value={body}
          onInput={handleInput}
          rows={2}
        />
        <div className="flex justify-end">
          <button
            className={buttonClass}
            type="submit"
            disabled={!isReady || submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    );
  };

  const renderList = () => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Loading comments...</p>;
    }
    if (rootComments.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Be the first to leave feedback.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {rootComments.map((comment) => renderThread(comment, 0))}
      </div>
    );
  };

  if (layout === "modal") {
    const loginPrompt = !token ? (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Sign in to add and manage comments.{" "}
        <Link className="text-accent hover:opacity-80" href="/login">
          Login
        </Link>
      </div>
    ) : null;
    const formContent = renderForm();

    return (
      <section className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {commentHeader}
          {loginPrompt}
          {renderList()}
        </div>
        {formContent ? (
          <div className="border-t border-border bg-card/95 px-5 py-4">
            {formContent}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {commentHeader}
      {renderForm()}
      {renderList()}
    </section>
  );
}
