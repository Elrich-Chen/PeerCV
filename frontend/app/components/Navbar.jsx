"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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

  const navItemClass = (href) =>
    [
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
      pathname === href
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");

  return (
    <header className="sticky top-4 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-4 rounded-full border border-border bg-card/90 px-6 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground"
          >
            Resume Community
          </Link>
          <nav className="flex flex-wrap items-center gap-2 md:flex-1 md:justify-center">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground md:ml-auto">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href="/upload"
            >
              <Plus className="h-4 w-4" />
              Upload
            </Link>
            {token ? (
              <>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  href="/profile"
                >
                  My Profile
                </Link>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  type="button"
                  onClick={clearAuthSession}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                href="/login"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
