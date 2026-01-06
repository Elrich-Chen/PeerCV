"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Medal, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_API_URL } from "../auth";

const formatRating = (value) => {
  if (typeof value !== "number") {
    return "New";
  }
  return value.toFixed(1);
};

const formatVotes = (value) => {
  if (typeof value !== "number") {
    return "0 votes";
  }
  return value === 1 ? "1 vote" : `${value} votes`;
};

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

export default function Leaderboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPreviewId, setExpandedPreviewId] = useState(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_API_URL}/posts/leaderboard`);
      if (response.status === 204) {
        setPosts([]);
        return;
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load leaderboard.");
      }
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="card px-5 py-6 text-sm text-muted-foreground">
        Loading leaderboard...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="card px-5 py-6 text-sm text-muted-foreground">
        No ratings yet.
      </div>
    );
  }

  const rankedPosts = [...posts].sort((a, b) => {
    const aRating = typeof a.average_rating === "number" ? a.average_rating : 0;
    const bRating = typeof b.average_rating === "number" ? b.average_rating : 0;
    if (bRating !== aRating) {
      return bRating - aRating;
    }
    const aVotes = typeof a.vote_count === "number" ? a.vote_count : 0;
    const bVotes = typeof b.vote_count === "number" ? b.vote_count : 0;
    return bVotes - aVotes;
  });
  const topThree = rankedPosts.slice(0, 3);
  const restPosts = rankedPosts.slice(3);
  const podiumOrder = [1, 0, 2];

  return (
    <div className="space-y-8">
      {topThree.length ? (
        <div className="grid gap-6 md:grid-cols-3 md:items-end pb-6">
          {podiumOrder.map((slot) => {
            const post = topThree[slot];
            if (!post) {
              return null;
            }
            const rank = slot + 1;
            const owner = post.owner || {};
            const ownerMeta = [owner.headline, owner.organization]
              .filter(Boolean)
              .join(" • ");
            const rating = formatRating(post.average_rating);
            const votes = formatVotes(post.vote_count);
            const displayName = cleanFileName(
              post.file_name || extractFileName(post.url)
            );
            const previewUrl = getPreviewUrl(
              post.url,
              post.file_type,
              post.file_name
            );
            const cardClass =
              rank === 1
                ? "md:order-2 md:-translate-y-2 border-amber-400/70 bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-transparent shadow-[0_0_40px_rgba(251,191,36,0.25)]"
                : rank === 2
                ? "md:order-1 md:translate-y-6 border-zinc-300/40 bg-gradient-to-b from-zinc-200/15 via-transparent to-transparent"
                : "md:order-3 md:translate-y-10 border-orange-500/50 bg-gradient-to-b from-orange-500/20 via-transparent to-transparent";
            const badgeClass =
              rank === 1
                ? "bg-amber-500/20 text-amber-200 border-amber-400/60"
                : rank === 2
                ? "bg-zinc-200/15 text-zinc-100 border-zinc-300/40"
                : "bg-orange-500/20 text-orange-200 border-orange-400/50";
            const rankIcon =
              rank === 1 ? (
                <Trophy className="h-4 w-4 text-amber-200" />
              ) : rank === 2 ? (
                <Medal className="h-4 w-4 text-zinc-200" />
              ) : (
                <Medal className="h-4 w-4 text-orange-200" />
              );
            return (
              <div
                key={post.post_id || rank}
                className={`card relative overflow-hidden rounded-3xl border p-6 ${cardClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                    {rankIcon}
                    <span>#{rank}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${badgeClass}`}
                  >
                    #{rank}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-center">
                  <div className="relative h-36 w-28 overflow-hidden rounded-xl border border-border bg-muted">
                    {previewUrl ? (
                      <iframe
                        className="h-full w-full pointer-events-none"
                        src={previewUrl}
                        title={displayName}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        No preview
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <p className="text-base font-semibold text-foreground">
                    @{owner.username || "anonymous"}
                  </p>
                  {ownerMeta ? (
                    <p className="text-xs text-muted-foreground">{ownerMeta}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {displayName}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-amber-300" />
                  <span className="text-foreground">{rating} ★</span>
                  <span>({votes})</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <Link
                    className="inline-flex text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-accent"
                    href={`/feed?post=${post.post_id}`}
                  >
                    View in community
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="hidden rounded-lg border border-border bg-muted px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:grid md:grid-cols-[80px_1fr_180px_160px]">
          <span>Rank</span>
          <span>User</span>
          <span className="text-right">Rating</span>
          <span className="text-right">Preview</span>
        </div>
        {restPosts.length === 0 ? (
          <div className="card px-5 py-6 text-sm text-muted-foreground">
            All rankings are currently in the top three.
          </div>
        ) : (
          restPosts.map((post, index) => {
            const owner = post.owner || {};
            const ownerMeta = [owner.headline, owner.organization]
              .filter(Boolean)
              .join(" • ");
            const rating = formatRating(post.average_rating);
            const votes = formatVotes(post.vote_count);
            const rank = index + 4;
            const previewUrl = getPreviewUrl(
              post.url,
              post.file_type,
              post.file_name
            );
            const displayName = cleanFileName(
              post.file_name || extractFileName(post.url)
            );
            const isExpanded = expandedPreviewId === post.post_id;
            const badgeClass = "border-border text-foreground";
            return (
              <div key={post.post_id || index} className="card px-5 py-4">
                <div className="grid gap-3 md:grid-cols-[80px_1fr_180px_160px] md:items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${badgeClass}`}
                    >
                      {rank}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono md:hidden">
                      Rank
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      @{owner.username || "anonymous"}
                    </p>
                    {ownerMeta ? (
                      <p className="text-xs text-muted-foreground">{ownerMeta}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {displayName}
                    </p>
                    {post.caption ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {post.caption}
                      </p>
                    ) : null}
                  </div>
                  <div className="md:text-right">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground">
                      <Star className="h-4 w-4 text-accent" />
                      <span>{rating} ★</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{votes}</p>
                  </div>
                  <div className="md:text-right">
                    <button
                      className="group inline-flex flex-col items-end gap-2 text-left"
                      type="button"
                      onClick={() =>
                        setExpandedPreviewId((prev) =>
                          prev === post.post_id ? null : post.post_id
                        )
                      }
                      aria-expanded={isExpanded}
                      aria-controls={`preview-${post.post_id}`}
                    >
                      <div className="relative h-20 w-16 overflow-hidden rounded-md border border-border bg-muted sm:h-24 sm:w-20">
                        {previewUrl ? (
                          <iframe
                            className="h-full w-full pointer-events-none"
                            src={previewUrl}
                            title={displayName}
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
                        {isExpanded ? "Hide preview" : "Preview"}
                      </span>
                    </button>
                    <Link
                      className="mt-2 inline-flex text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-accent"
                      href={`/feed?post=${post.post_id}`}
                    >
                      View in community
                    </Link>
                  </div>
                </div>

                {isExpanded ? (
                  <div id={`preview-${post.post_id}`} className="mt-4 space-y-3">
                    <div className="overflow-hidden rounded-lg border border-border bg-muted">
                      {previewUrl ? (
                        <iframe
                          className="h-72 w-full sm:h-80"
                          src={previewUrl}
                          title={`${displayName} preview`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                          Preview not available.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
