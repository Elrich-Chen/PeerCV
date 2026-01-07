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
      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs transition sm:px-4 sm:text-sm",
      "whitespace-nowrap",
      pathname === href
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ].join(" ");

  const actionClass =
    "inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-4 sm:text-sm";

  return (
    <header className="sticky top-4 z-50">
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
      </div>
    </header>
  );
}
