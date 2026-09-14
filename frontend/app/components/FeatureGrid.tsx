"use client";

import { Copy, Medal, Trophy } from "lucide-react";

export default function FeatureGrid() {
  return (
    <section className="border-t border-border pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
            How it works
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            Three steps to clearer feedback.
          </h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                Contextual Feedback
              </p>
              <p className="text-sm text-muted-foreground">
                Leave comments right on the PDF. Discuss details in threads.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative h-44 w-full max-w-xs rounded-xl border border-white/10 bg-zinc-900/60">
                <div className="absolute inset-4 rounded-lg bg-zinc-800/80"></div>
                <div className="absolute left-6 top-8 w-28 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-foreground">
                  Strong intro.
                </div>
                <div className="absolute bottom-6 right-6 w-32 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] text-foreground">
                  Add metrics here?
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                Live Leaderboard
              </p>
              <p className="text-sm text-muted-foreground">
                Vote on resumes in real-time. See who ranks #1.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-amber-200">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    @elrich
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-amber-200">
                  5.0
                  <span className="text-xs text-amber-200">★</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground">
                    <Medal className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    @user2
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  4.8
                  <span className="text-xs text-muted-foreground">★</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                Share Anywhere
              </p>
              <p className="text-sm text-muted-foreground">
                Get a unique link to drop in Slack or Discord.
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-foreground">resume.co/u/elrich</span>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-foreground"
                  type="button"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Slack
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Discord
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
