"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  clearAuthSession,
  DEFAULT_API_URL,
  getAuthUser,
  getToken,
  onAuthChange,
  validateSession,
} from "../auth";

export default function Navbar() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const updateId = "upload-fix-2026-01-07";
  const [showUpdate, setShowUpdate] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => {
      setToken(getToken());
      setUser(getAuthUser());
    };
    sync();
    const unsubscribe = onAuthChange(sync);
    validateSession(DEFAULT_API_URL).then(() => sync());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) {
        return;
      }
      ticking.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY < 40) {
          setIsHidden(false);
        } else if (delta > 8) {
          setIsHidden(true);
        } else if (delta < -8) {
          setIsHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const dismissed = window.localStorage.getItem(
      `peerCVUpdateDismissed:${updateId}`
    );
    if (dismissed === "true") {
      setShowUpdate(false);
    }
  }, [updateId]);

  const navItemClass = (href) =>
    [
      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition sm:px-4 sm:text-sm",
      "whitespace-nowrap",
      pathname === href
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");

  const actionClass =
    "inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-4 sm:text-sm";

  return (
    <header
      className={`sticky top-4 z-50 transition-transform duration-200 ${
        isHidden ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/90 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs"
          >
            Peer-CV
          </Link>
          <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:flex-1 sm:justify-center sm:overflow-visible sm:pb-0">
            <Link className={navItemClass("/feed")} href="/feed">
              Community
            </Link>
            <Link className={navItemClass("/queue")} href="/queue">
              Vote
            </Link>
            <Link className={navItemClass("/leaderboard")} href="/leaderboard">
              Leaderboard
            </Link>
          </nav>
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm text-muted-foreground sm:ml-auto sm:w-auto sm:justify-end sm:overflow-visible sm:pb-0">
            <Link
              className={actionClass}
              href="/upload"
            >
              <Plus className="h-4 w-4" />
              Upload
            </Link>
            {token ? (
              <>
                <Link
                  className={actionClass}
                  href="/profile"
                >
                  My Profile
                </Link>
                <button
                  className={actionClass}
                  type="button"
                  onClick={clearAuthSession}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className={actionClass}
                href="/login"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        {showUpdate ? (
          <div className="mt-3 overflow-hidden rounded-full border border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                Update
              </span>
              <div className="relative flex-1 overflow-hidden">
                <div className="ticker-track inline-flex items-center gap-4 whitespace-nowrap pr-6">
                  <span>Upload fix deployed. New resumes publish cleanly now.</span>
                </div>
              </div>
              <button
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                type="button"
                aria-label="Dismiss update"
                onClick={() => {
                  setShowUpdate(false);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      `peerCVUpdateDismissed:${updateId}`,
                      "true"
                    );
                  }
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
