import Link from "next/link";
import VotingQueue from "../components/VotingQueue";

export default function QueuePage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
            Vote
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Quick resume reviews
          </h1>
          <p className="text-sm text-muted-foreground">
            Rate resumes one by one to keep the leaderboard fresh.
          </p>
        </div>
        <Link className="btn-ghost" href="/leaderboard">
          View leaderboard
        </Link>
      </header>
      <VotingQueue />
    </section>
  );
}
