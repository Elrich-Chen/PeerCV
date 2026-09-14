"use client";

import type { HTMLAttributes } from "react";

interface SkeletonBlockProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function SkeletonBlock({ className = "", ...props }: SkeletonBlockProps) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      aria-hidden
      {...props}
    />
  );
}

function FeedCardSkeleton() {
  return (
    <div className="card flex h-full flex-col p-4">
      <SkeletonBlock className="aspect-[3/4] w-full rounded-lg" />
      <div className="mt-3 flex flex-1 flex-col gap-2">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4 max-w-[180px] rounded-md" />
            <SkeletonBlock className="h-3 w-1/2 max-w-[120px] rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-14 shrink-0 rounded-md" />
        </div>
        <SkeletonBlock className="h-4 w-full rounded-md" />
        <SkeletonBlock className="h-3 w-2/3 rounded-md" />
        <SkeletonBlock className="mt-auto h-3 w-24 rounded-md" />
      </div>
    </div>
  );
}

interface FeedGridSkeletonProps {
  count?: number;
}

export function FeedGridSkeleton({ count = 8 }: FeedGridSkeletonProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CommentListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SkeletonBlock className="h-4 w-28 rounded-md" />
            <SkeletonBlock className="h-3 w-24 rounded-md" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-md" />
          <SkeletonBlock className="h-3 w-[92%] rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="grid gap-6 pb-6 md:grid-cols-3 md:items-end">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card rounded-3xl border p-6">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-7 w-14 rounded-full" />
            </div>
            <div className="mt-5 flex justify-center">
              <SkeletonBlock className="h-36 w-28 rounded-xl" />
            </div>
            <div className="mt-5 space-y-2 text-center">
              <SkeletonBlock className="mx-auto h-4 w-32" />
              <SkeletonBlock className="mx-auto h-3 w-40" />
            </div>
            <SkeletonBlock className="mx-auto mt-4 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card px-5 py-4">
            <div className="grid gap-3 md:grid-cols-[80px_1fr_180px_160px] md:items-center">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3 w-full max-w-md" />
              </div>
              <SkeletonBlock className="h-8 w-full max-w-[140px] justify-self-end rounded-full md:justify-self-end" />
              <SkeletonBlock className="h-20 w-16 justify-self-end rounded-md md:justify-self-end" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilePostListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="card-header flex-wrap gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-6 w-full max-w-lg" />
              <SkeletonBlock className="h-3 w-full max-w-md" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-8 w-24" />
            </div>
          </div>
          <div className="card-body space-y-3">
            <SkeletonBlock className="h-[200px] w-full rounded-lg sm:h-[240px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VotingQueueSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex justify-between">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
      <div className="card space-y-5 px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-48" />
            <SkeletonBlock className="h-4 w-full max-w-md" />
          </div>
          <SkeletonBlock className="h-8 w-24 rounded-full" />
        </div>
        <SkeletonBlock className="h-[520px] w-full rounded-lg sm:h-[600px] lg:h-[680px]" />
      </div>
    </div>
  );
}
