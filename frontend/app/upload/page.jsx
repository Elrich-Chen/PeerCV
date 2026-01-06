"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DEFAULT_API_URL, getToken, onAuthChange, validateSession } from "../auth";

export default function UploadPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const apiBase = DEFAULT_API_URL;

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

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Sign in to upload resumes.");
      return;
    }

    if (!file) {
      toast.error("Select a PDF or Word document.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", caption);

      const response = await fetch(`${apiBase}/posts/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed.");
      }

      toast.success("Resume uploaded.");
      setFile(null);
      setCaption("");
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      router.push("/feed");
    } catch (error) {
      toast.error("Could not upload resume.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
          Upload
        </p>
        <h1 className="text-3xl font-semibold text-foreground">New resume post</h1>
        <p className="text-sm text-muted-foreground">
          PDF, DOC, or DOCX files only. Add a short caption for reviewers.
        </p>
      </header>

      {!token ? (
        <div className="card px-5 py-6 text-sm text-muted-foreground">
          You need to sign in before uploading.
          <Link className="ml-2 text-accent hover:opacity-80" href="/login">
            Login
          </Link>
        </div>
      ) : (
        <form className="card space-y-4 px-5 py-6" onSubmit={handleUpload}>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span>Resume file</span>
            <input
              ref={fileRef}
              className="input"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) =>
                setFile(event.target.files ? event.target.files[0] : null)
              }
            />
          </label>
          <label className="space-y-2 text-sm text-muted-foreground">
            <span>Caption</span>
            <input
              className="input"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="e.g., Product designer resume"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Publish post"}
            </button>
            <Link className="btn-ghost" href="/feed">
              Back to community
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
