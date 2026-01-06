"use client";

import { useState } from "react";
import { FileText, Share2, Star, Trash2 } from "lucide-react";
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
    normalizedType === "doc" || lowerName.endsWith(".doc") || lowerUrl.includes(".doc");
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

const getPreviewImageUrl = (fileUrl, fileType, fileName) => {
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

  if (!isPdf) {
    return null;
  }

  try {
    const parsed = new URL(fileUrl, "http://localhost");
    if (!parsed.hostname.includes("imagekit.io")) {
      return null;
    }
    parsed.searchParams.set("tr", "pg-1,w-600,bg-FFFFFF");
    return parsed.toString();
  } catch (error) {
    return null;
  }
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

export default function PostCard({
  post,
  apiBase,
  token,
  onDeleted,
  showRatingStats = false,
  rank = null,
  compact = false,
}) {
  const [commentCount, setCommentCount] = useState(null);
  const [showPreview, setShowPreview] = useState(!compact);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);
  const previewImageUrl = getPreviewImageUrl(
    post.url,
    post.file_type,
    post.file_name
  );
  const shouldUseImage = previewImageUrl && !previewImageFailed;
  const previewUrl = getPreviewUrl(post.url, post.file_type, post.file_name);
  const displayName = cleanFileName(
    post.file_name || extractFileName(post.url)
  );
  const authUser = getAuthUser();
  const currentUsername = authUser?.username || authUser?.email || "";
  const owner = post.owner || {};
  const postOwnerName = owner.username || post.username || "";
  const postHeadline = owner.headline || "";
  const postOrganization = owner.organization || "";
  const ownerMeta = [postHeadline, postOrganization].filter(Boolean).join(" • ");
  const canDelete =
    token && currentUsername && postOwnerName && postOwnerName === currentUsername;
  const safeCount = commentCount ?? 0;
  const commentLabel = safeCount === 1 ? "1 comment" : `${safeCount} comments`;
  const rankLabel = typeof rank === "number" ? `Rank #${rank}` : "";
  const showComments = compact ? showPreview : true;
  const ratingValue =
    typeof post.average_rating === "number"
      ? post.average_rating.toFixed(1)
      : "0.0";
  const votesValue =
    typeof post.vote_count === "number" ? post.vote_count : 0;
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

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
    } catch (error) {
      toast.error("Could not delete post.");
    }
  };

  return (
    <article className="card overflow-hidden">
      <div className={`card-header ${compact ? "px-4 py-3" : ""}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {postOwnerName ? `@${postOwnerName}` : "anonymous"}
            </span>
            {ownerMeta ? (
              <span className="text-xs text-muted-foreground">{ownerMeta}</span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>
          {post.caption ? (
            <p className="mt-1 text-sm text-muted-foreground">{post.caption}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {formattedDate ? (
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
              {formattedDate}
            </span>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
            <span>{commentLabel}</span>
            <span className="h-1 w-1 rounded-full bg-border"></span>
            <span>Resume</span>
            {rankLabel ? (
              <>
                <span className="h-1 w-1 rounded-full bg-border"></span>
                <span>{rankLabel}</span>
              </>
            ) : null}
          </div>
          {showRatingStats ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="h-3 w-3 text-accent" />
                {ratingValue} ★
              </span>
              <span>({votesValue} votes)</span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-ghost" type="button" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              className="group inline-flex items-center gap-2"
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              aria-label={showPreview ? "Hide preview" : "Show preview"}
            >
              <div className="relative h-20 w-16 overflow-hidden rounded-md border border-border bg-muted">
                {shouldUseImage ? (
                  <img
                    className="h-full w-full object-cover"
                    src={previewImageUrl}
                    alt="Preview thumbnail"
                    loading="lazy"
                    onError={() => setPreviewImageFailed(true)}
                  />
                ) : previewUrl ? (
                  <iframe
                    className="h-full w-full pointer-events-none"
                    src={previewUrl}
                    title="Preview thumbnail"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    No preview
                  </div>
                )}
                <div className="absolute inset-0 bg-background/10 opacity-0 transition group-hover:opacity-100" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {showPreview ? "Hide" : "Preview"}
              </span>
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
              <button className="btn-danger" type="button" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className={`card-body space-y-4 ${compact ? "px-4 py-3" : ""}`}>
        {showPreview ? (
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            {previewUrl ? (
              <iframe
                className={`w-full ${compact ? "h-[320px] sm:h-[360px]" : "h-[520px] sm:h-[600px] lg:h-[680px]"}`}
                src={previewUrl}
                title={displayName}
                loading="lazy"
              />
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-3 text-muted-foreground ${
                  compact ? "h-[320px] sm:h-[360px]" : "h-[520px] sm:h-[600px] lg:h-[680px]"
                }`}
              >
                <FileText className="h-8 w-8" />
                <p className="text-sm">Preview not available.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            <span>Preview hidden.</span>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => setShowPreview(true)}
            >
              Show preview
            </button>
          </div>
        )}

        {showComments ? (
          <CommentSection
            postId={post.post_id}
            apiBase={apiBase}
            token={token}
            onCountChange={setCommentCount}
          />
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            <span>Comments hidden.</span>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => setShowPreview(true)}
            >
              Show comments
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
