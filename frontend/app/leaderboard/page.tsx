import Link from "next/link";
import Leaderboard from "../components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
            Leaderboard
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Top rated resumes
          </h1>
          <p className="text-sm text-muted-foreground">
            See who is leading based on community ratings.
          </p>
        </div>
        <Link className="btn-ghost" href="/queue">
          Back to vote
        </Link>
      </header>
      <Leaderboard />
    </section>
  );
}
