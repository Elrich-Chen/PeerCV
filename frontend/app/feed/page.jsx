"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_API_URL, getToken, onAuthChange, validateSession } from "../auth";
import ReviewModal from "../components/ReviewModal";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const lastUrlRef = useRef("");
  const urlSyncRef = useRef(null);

  const apiBase = DEFAULT_API_URL;

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

  const sortByNewest = (items) => {
    return [...items].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/posts/`);
      if (!response.ok) {
        throw new Error("Failed to load posts.");
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setPosts(sortByNewest(list));
    } catch (error) {
      toast.error("Could not load the community.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sync = () => setToken(getToken());
    sync();
    return onAuthChange(sync);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    validateSession(apiBase).then((user) => {
      if (!user) {
        toast.error("Session expired. Please sign in again.");
      }
    });
  }, [token, apiBase]);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTargetIdFromLocation = () => {
    if (typeof window === "undefined") {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    const paramPostId = params.get("post");
    const hashPostId = window.location.hash.startsWith("#post-")
      ? window.location.hash.replace("#post-", "")
      : null;
    return paramPostId || hashPostId;
  };

  const openFromLocation = () => {
    const targetId = getTargetIdFromLocation();
    if (!targetId) {
      if (activeIndex !== null) {
        setActiveIndex(null);
      }
      return;
    }
    const index = posts.findIndex(
      (post) => String(post.post_id) === targetId
    );
    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }
    openFromLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, posts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handlePopState = () => {
      openFromLocation();
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, activeIndex]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (urlSyncRef.current) {
      clearTimeout(urlSyncRef.current);
    }

    urlSyncRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      const postId =
        activeIndex !== null ? String(posts[activeIndex]?.post_id || "") : "";

      if (!postId) {
        url.searchParams.delete("post");
        url.hash = "";
      } else {
        url.searchParams.set("post", postId);
        url.hash = `post-${postId}`;
      }

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl && nextUrl !== lastUrlRef.current) {
        window.history.replaceState(null, "", nextUrl);
        lastUrlRef.current = nextUrl;
      }
    }, 150);

    return () => {
      if (urlSyncRef.current) {
        clearTimeout(urlSyncRef.current);
      }
    };
  }, [activeIndex, posts]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    if (activeIndex >= posts.length) {
      setActiveIndex(posts.length ? posts.length - 1 : null);
    }
  }, [activeIndex, posts]);

  const handleDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.post_id !== postId));
    if (activeIndex !== null && posts[activeIndex]?.post_id === postId) {
      setActiveIndex(null);
    }
  };

  const activePost = activeIndex !== null ? posts[activeIndex] : null;
  const hasPrev = activeIndex !== null && activeIndex > 0;
  const hasNext = activeIndex !== null && activeIndex < posts.length - 1;
  const handleClose = () => {
    setActiveIndex(null);
  };
  const stepIndex = (delta) => {
    setActiveIndex((prev) => {
      if (typeof prev !== "number") {
        return prev;
      }
      if (!posts.length) {
        return null;
      }
      const next = Math.max(0, Math.min(prev + delta, posts.length - 1));
      return next;
    });
  };

  const FeedCard = ({ post, index }) => {
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
      if (isVisible) {
        return undefined;
      }
      if (typeof window === "undefined") {
        return undefined;
      }
      const node = cardRef.current;
      if (!node) {
        return undefined;
      }
      if (!("IntersectionObserver" in window)) {
        setIsVisible(true);
        return undefined;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );

      observer.observe(node);
      return () => observer.disconnect();
    }, [isVisible]);

    const previewImageUrl = isVisible
      ? getPreviewImageUrl(post.url, post.file_type, post.file_name)
      : null;
    const previewUrl = isVisible
      ? getPreviewUrl(post.url, post.file_type, post.file_name)
      : null;
    const shouldUseImage = previewImageUrl && !imageFailed;

    const owner = post.owner || {};
    const ownerMeta = [owner.headline, owner.organization]
      .filter(Boolean)
      .join(" • ");
    const formattedDate = formatPostDate(post.created_at);
    const displayName = cleanFileName(post.file_name || extractFileName(post.url));
    const ratingValue =
      typeof post.average_rating === "number" ? post.average_rating.toFixed(1) : "0.0";
    const votesValue = typeof post.vote_count === "number" ? post.vote_count : 0;

    return (
      <button
        ref={cardRef}
        key={post.post_id}
        id={`post-${post.post_id}`}
        className="group card flex h-full flex-col p-4 text-left transition hover:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent"
        type="button"
        onClick={() => setActiveIndex(index)}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted">
          {!isVisible ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Loading preview...
            </div>
          ) : shouldUseImage ? (
            <img
              className="h-full w-full object-cover bg-white"
              src={previewImageUrl}
              alt={`${displayName} preview`}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : previewUrl ? (
            <iframe
              className="h-full w-full pointer-events-none"
              src={previewUrl}
              title={`${displayName} preview`}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              No preview
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-background opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              Open review
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                @{owner.username || post.username || "anonymous"}
              </p>
              {ownerMeta ? (
                <p className="text-xs text-muted-foreground">{ownerMeta}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-accent" />
              <span className="text-foreground">{ratingValue}</span>
              <span>({votesValue})</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground">{displayName}</p>
            {post.caption ? (
              <p className="text-xs text-muted-foreground">{post.caption}</p>
            ) : null}
          </div>
          {formattedDate ? (
            <p className="mt-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
              {formattedDate}
            </p>
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
            Community
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            Resume community reviews.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Post a resume, preview inline, then leave focused feedback.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link className="btn-primary" href="/upload">
            New post
          </Link>
          <button className="btn-ghost" type="button" onClick={loadPosts}>
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="card px-5 py-6 text-sm text-muted-foreground">
          Loading community...
        </div>
      ) : posts.length === 0 ? (
        <div className="card px-5 py-6">
          <p className="text-sm text-muted-foreground">
            No posts yet. Upload a resume to get started.
          </p>
          <Link className="btn-primary mt-4 inline-flex" href="/upload">
            Upload resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post, index) => (
            <FeedCard key={post.post_id} post={post} index={index} />
          ))}
        </div>
      )}
      {activePost ? (
        <ReviewModal
          post={activePost}
          apiBase={apiBase}
          token={token}
          onClose={handleClose}
          onPrev={() => stepIndex(-1)}
          onNext={() => stepIndex(1)}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onDeleted={handleDeleted}
        />
      ) : null}
    </section>
  );
}
