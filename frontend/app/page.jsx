"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";
import FeatureGrid from "./components/FeatureGrid";

export default function HomePage() {
  const [previewAvailable, setPreviewAvailable] = useState(true);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
  const appendPdfControls = (fileUrl) => {
    if (!fileUrl) {
      return fileUrl;
    }
    if (fileUrl.includes("#")) {
      return fileUrl;
    }
    return `${fileUrl}#view=FitH&zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`;
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    let cancelled = false;

    const startLoading = () => {
      if (!cancelled) {
        setShouldLoadPreview(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(startLoading, { timeout: 1000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const timeoutId = window.setTimeout(startLoading, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadPreview) {
      return undefined;
    }
    let active = true;
    const checkFallback = async () => {
      try {
        const response = await fetch("/resume-preview.pdf", { method: "HEAD" });
        if (active && response.ok) {
          setPreviewAvailable(true);
        } else if (active) {
          setPreviewAvailable(false);
        }
      } catch (error) {
        if (active) {
          setPreviewAvailable(false);
        }
      }
    };

    checkFallback();

    return () => {
      active = false;
    };
  }, [shouldLoadPreview]);

  const previewUrl =
    shouldLoadPreview && previewAvailable
      ? appendPdfControls("/resume-preview.pdf")
      : "";
  const previewHeightClass = "h-[clamp(460px,70vh,760px)]";
  const previewName = previewAvailable ? "Sample resume" : "";
  const previewCaption = previewAvailable ? "Example resume preview." : "";

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span>
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="h-2 w-2 rounded-full bg-accent"></span>
            </span>
            Three-step review flow
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Get your <span className="text-accent">resume reviewed</span> by the
            people who matter.
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            A focused, community-first space for resume feedback. Upload once,
            preview instantly, and keep discussion tied to the work.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <span>Share resumes with a clean preview that stays on page.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <span>Threaded comments keep feedback structured and readable.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <span>Browse the community anytime without logging in.</span>
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="btn-primary" href="/login">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="btn-ghost" href="/upload">
              Upload a resume
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4" fill="currentColor" />
                ))}
              </div>
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
        <div id="preview" className="relative mt-6 scroll-mt-40">
          <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-accent/20 via-transparent to-transparent blur-2xl opacity-60"></div>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Live resume preview
              </span>
              <span className="text-xs text-muted-foreground">
                {previewName || "Waiting for uploads"}
              </span>
            </div>
            <div className="bg-background">
              {!shouldLoadPreview ? (
                <div
                  className={`flex ${previewHeightClass} items-center justify-center text-sm text-muted-foreground`}
                >
                  Loading preview...
                </div>
              ) : previewUrl ? (
                <iframe
                  className={`${previewHeightClass} w-full bg-white`}
                  src={previewUrl}
                  title={previewName || "Resume preview"}
                  loading="lazy"
                />
              ) : (
                <div
                  className={`flex ${previewHeightClass} flex-col items-center justify-center gap-3 text-sm text-muted-foreground`}
                >
                  <span>Add `resume-preview.pdf` to the public folder.</span>
                </div>
              )}
            </div>
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {previewCaption || "Recent uploads appear here automatically."}
            </div>
          </div>
        </div>
      </section>

      <FeatureGrid />

      <section className="rounded-2xl border border-border bg-card/40 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
              Contact
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Find me online for updates and collaborations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a
              className="text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-accent"
              href="https://elrichchen.com/"
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
            <a
              className="text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-accent"
              href="https://github.com/Elrich-Chen"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-accent"
              href="https://www.linkedin.com/in/elrich-chen/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border pt-8 pb-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>© 2026 Elrich Chen. All rights reserved.</p>
          <a
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono transition hover:text-accent"
            href="mailto:eklchen@uwaterloo.ca?subject=Resume%20Community%20Feedback"
          >
            Help by providing Feedback :)
          </a>
        </div>
      </footer>
    </div>
  );
}
