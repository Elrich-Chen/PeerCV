"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Share2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CommentSection from "./CommentSection";
import { getAuthUser } from "../auth";

const appendPdfControls = (fileUrl) => {
  if (!fileUrl) {
    return fileUrl;
  }
  if (fileUrl.includes("#")) {
    return fileUrl;
  }
  return `${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`;
};

const getPdfViewerUrl = (fileUrl) => appendPdfControls(fileUrl);

const getPreviewUrl = (fileUrl, fileType, fileName) => {
  if (!fileUrl) {
    return null;
  }

  const normalizedType = (fileType || "").toLowerCase();
  const lowerName = (fileName || "").toLowerCase();
  const lowerUrl = (fileUrl || "").toLowerCase();

  const isPdf =
    normalizedType === "pdf" ||
    lowerName.endsWith(".pdf") ||
    lowerUrl.includes(".pdf");
  const isDoc =
    normalizedType === "doc" ||
    lowerName.endsWith(".doc") ||
    lowerUrl.includes(".doc");
  const isDocx =
    normalizedType === "docx" ||
    lowerName.endsWith(".docx") ||
    lowerUrl.includes(".docx");

  if (isPdf) {
    return getPdfViewerUrl(fileUrl);
  }

  if (isDoc || isDocx) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      fileUrl
    )}`;
  }

  return null;
};

const extractFileName = (value) => {
  if (!value) {
    return "";
  }
  try {
    const parsed = new URL(value);
    const name = parsed.pathname.split("/").pop();
    return name || "";
  } catch (error) {
    return value;
  }
};

const cleanFileName = (value) => {
  if (!value) {
    return "Untitled resume";
  }

  const lastDot = value.lastIndexOf(".");
  const hasExtension = lastDot > 0;
  const base = hasExtension ? value.slice(0, lastDot) : value;
  const ext = hasExtension ? value.slice(lastDot) : "";
  const parts = base.split("_");

  if (parts.length > 1) {
    const tail = parts[parts.length - 1];
    if (/^\d+$/.test(tail) || /^[a-z0-9]{6,}$/i.test(tail)) {
      parts.pop();
      const cleanedBase = parts.join("_").trim();
      return cleanedBase ? `${cleanedBase}${ext}` : value;
    }
  }

  return value;
};

const formatPostDate = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function ReviewModal({
  post,
  apiBase,
  token,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onDeleted,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handleKey = (event) => {
      const target = event.target;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditable) {
        return;
      }
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && hasPrev) {
        onPrev();
      }
      if (event.key === "ArrowRight" && hasNext) {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasNext, hasPrev, onClose, onNext, onPrev]);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus();
    }
  }, []);

  if (!post) {
    return null;
  }

  const previewUrl = getPreviewUrl(post.url, post.file_type, post.file_name);
  const displayName = cleanFileName(
    post.file_name || extractFileName(post.url)
  );
  const owner = post.owner || {};
  const postOwnerName = owner.username || post.username || "anonymous";
  const postHeadline = owner.headline || "";
  const postOrganization = owner.organization || "";
  const ownerMeta = [postHeadline, postOrganization].filter(Boolean).join(" • ");
  const formattedDate = formatPostDate(post.created_at);
  const ratingValue =
    typeof post.average_rating === "number"
      ? post.average_rating.toFixed(1)
      : "0.0";
  const votesValue = typeof post.vote_count === "number" ? post.vote_count : 0;
  const authUser = getAuthUser();
  const currentUsername = authUser?.username || authUser?.email || "";
  const canDelete =
    token && currentUsername && postOwnerName && postOwnerName === currentUsername;

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const shareUrl = `${window.location.origin}/feed?post=${post.post_id}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied.");
        return;
      }

      window.prompt("Copy this link:", shareUrl);
    } catch (error) {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      toast.error("Sign in to delete posts.");
      return;
    }

    const confirmDelete = window.confirm(
      "Delete this post and all of its comments?"
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/posts/${post.post_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Delete failed.");
      }

      toast.success("Post deleted.");
      if (onDeleted) {
        onDeleted(post.post_id);
      }
      onClose();
    } catch (error) {
      toast.error("Could not delete post.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground transition hover:text-foreground"
          type="button"
          onClick={onClose}
          aria-label="Close review"
        >
          <X className="h-4 w-4" />
        </button>

        <button
          className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPrev();
          }}
          disabled={!hasPrev}
          aria-label="Previous resume"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
          disabled={!hasNext}
          aria-label="Next resume"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="flex h-full flex-col lg:flex-row">
          <div className="relative flex h-[55vh] w-full flex-col border-b border-border bg-muted/20 lg:h-full lg:w-[65%] lg:border-b-0 lg:border-r">
            {previewUrl ? (
              <iframe
                className="h-full w-full object-contain"
                src={previewUrl}
                title={displayName}
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <FileText className="h-8 w-8" />
                <p className="text-sm">Preview not available.</p>
              </div>
            )}
          </div>

          <div className="flex h-[45vh] w-full flex-col border-t border-border bg-card/80 lg:h-full lg:w-[35%] lg:border-l lg:border-t-0">
            <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    @{postOwnerName}
                  </p>
                  {ownerMeta ? (
                    <p className="text-xs text-muted-foreground">{ownerMeta}</p>
                  ) : null}
                  <h2 className="mt-2 text-lg font-semibold text-foreground">
                    {displayName}
                  </h2>
                  {post.caption ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.caption}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  {formattedDate ? (
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                      {formattedDate}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <Star className="h-4 w-4 text-accent" />
                    <span className="text-foreground">{ratingValue} ★</span>
                    <span>({votesValue} votes)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="btn-ghost" type="button" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                {post.url ? (
                  <a
                    className="btn-ghost"
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open file
                  </a>
                ) : null}
                {canDelete ? (
                  <button
                    className="btn-danger"
                    type="button"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <CommentSection
                postId={post.post_id}
                apiBase={apiBase}
                token={token}
                layout="modal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
