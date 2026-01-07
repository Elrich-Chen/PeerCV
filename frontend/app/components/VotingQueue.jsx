"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_API_URL, getToken, onAuthChange, validateSession } from "../auth";

const ratingOptions = [1, 2, 3, 4, 5];

const appendPdfControls = (fileUrl) => {
  if (!fileUrl) {
    return fileUrl;
  }
  if (fileUrl.includes("#")) {
    return fileUrl;
  }
  return `${fileUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`;
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
    parsed.searchParams.set("tr", "pg-1,w-900,bg-FFFFFF");
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

export default function VotingQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [hoverScore, setHoverScore] = useState(0);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);
  const router = useRouter();

  const apiBase = useMemo(() => DEFAULT_API_URL, []);

  const loadQueue = async () => {
    if (!token) {
      setQueue([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/posts/queue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setQueue([]);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load votes.");
      }

      const data = await response.json();
      setQueue(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Could not load votes.");
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
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRate = async (score) => {
    if (!token) {
      toast.error("Sign in to rate resumes.");
      router.push("/login");
      return;
    }

    const current = queue[0];
    if (!current) {
      return;
    }

    setQueue((prev) => prev.slice(1));

    try {
      const response = await fetch(
        `${apiBase}/posts/${current.post_id}/rate?score=${score}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Rating failed.");
      }
    } catch (error) {
      toast.error("Could not submit rating.");
      setQueue((prev) => [current, ...prev]);
    }
  };

  const isPreviewOnly = !token;
  const current = queue[0] || null;
  const displayPost =
    current ||
    {
      owner: {
        username: "jake",
        headline: "Product Demo",
        organization: "ResumeRoast",
      },
      caption: "Sign in to start voting on real resumes.",
      file_name: "Jake_Ryan_Resume.pdf",
      url: "/resume-preview.pdf",
      file_type: "pdf",
    };
  const owner = displayPost.owner || {};
  const ownerMeta = [owner.headline, owner.organization]
    .filter(Boolean)
    .join(" • ");
  const previewImageUrl = getPreviewImageUrl(
    displayPost.url,
    displayPost.file_type,
    displayPost.file_name
  );
  const shouldUseImage = previewImageUrl && !previewImageFailed;
  const previewUrl = getPreviewUrl(
    displayPost.url,
    displayPost.file_type,
    displayPost.file_name
  );
  const displayName = cleanFileName(
    displayPost.file_name || extractFileName(displayPost.url)
  );
  const scoreLabel = {
    1: "Pass",
    2: "Needs work",
    3: "Solid",
    4: "Strong",
    5: "Hire",
  }[hoverScore];
  const previewKey = displayPost.url || "";

  useEffect(() => {
    setPreviewImageFailed(false);
  }, [previewKey]);

  if (loading && token) {
    return (
      <div className="card px-5 py-6 text-sm text-muted-foreground">
        Loading votes...
      </div>
    );
  }

  if (token && queue.length === 0) {
    return (
      <div className="card px-5 py-6 text-sm text-muted-foreground">
        You&apos;re all caught up!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
        <span>{token ? `Votes left ${queue.length}` : "Preview mode"}</span>
        <span>{token ? "Vote mode" : "Sign in to vote"}</span>
      </div>
      {isPreviewOnly ? (
        <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          You&apos;re previewing the voting flow.{" "}
          <Link className="text-accent hover:opacity-80" href="/login">
            Sign in to vote
          </Link>
          .
        </div>
      ) : null}
      <div className="card space-y-5 px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              @{owner.username || "anonymous"}
            </p>
            {ownerMeta ? (
              <p className="text-xs text-muted-foreground">{ownerMeta}</p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground">{displayName}</p>
            {displayPost.caption ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {displayPost.caption}
              </p>
            ) : null}
          </div>
          <span className="pill">{token ? "Up next" : "Preview"}</span>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background">
          {shouldUseImage ? (
            <img
              className="h-[520px] w-full object-contain bg-white sm:h-[600px] lg:h-[680px]"
              src={previewImageUrl}
              alt={displayName}
              loading="lazy"
              onError={() => setPreviewImageFailed(true)}
            />
          ) : previewUrl ? (
            <iframe
              className="h-[520px] w-full bg-white sm:h-[600px] lg:h-[680px]"
              src={previewUrl}
              title={displayName}
              loading="lazy"
            />
          ) : (
            <div className="flex h-[520px] flex-col items-center justify-center gap-3 text-muted-foreground sm:h-[600px] lg:h-[680px]">
              <span className="text-sm">
                {isPreviewOnly
                  ? "Sign in to load resumes."
                  : "Preview not available."}
              </span>
            </div>
          )}
          <div className="absolute right-4 top-4 flex flex-col items-end gap-3 rounded-lg border border-border bg-background/80 px-4 py-3 text-right backdrop-blur">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
              Rate this resume
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ratingOptions.map((score) => (
                <button
                  key={score}
                  className={`group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted transition ${
                    hoverScore >= score
                      ? "border-accent/60 bg-accent/20"
                      : "hover:border-accent/40 hover:bg-muted/60"
                  }`}
                  type="button"
                  onClick={() => handleRate(score)}
                  onMouseEnter={() => setHoverScore(score)}
                  onMouseLeave={() => setHoverScore(0)}
                  onFocus={() => setHoverScore(score)}
                  onBlur={() => setHoverScore(0)}
                  aria-label={`Rate ${score} star${score === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-5 w-5 transition ${
                      hoverScore >= score
                        ? "text-accent"
                        : "text-muted-foreground group-hover:text-accent"
                    }`}
                    fill={hoverScore >= score ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground">
              {scoreLabel || "Tap a star to vote"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
