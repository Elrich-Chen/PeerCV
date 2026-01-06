"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DEFAULT_API_URL, getToken, onAuthChange, validateSession } from "../auth";
import PostCard from "../components/PostCard";

export default function ProfilePage() {
  const [token, setToken] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [rankMap, setRankMap] = useState({});

  const apiBase = DEFAULT_API_URL;

  const loadPosts = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsEmpty(false);
    try {
      const response = await fetch(`${apiBase}/posts/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        setPosts([]);
        setIsEmpty(true);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load posts.");
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
      setIsEmpty(Array.isArray(data) && data.length === 0);
    } catch (error) {
      toast.error("Could not load your posts.");
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!token) {
      setRankMap({});
      return;
    }

    try {
      const response = await fetch(`${apiBase}/posts/leaderboard`);
      if (response.status === 204) {
        setRankMap({});
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to load leaderboard.");
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const nextMap = {};
      list.forEach((post, index) => {
        if (post?.post_id) {
          nextMap[String(post.post_id)] = index + 1;
        }
      });
      setRankMap(nextMap);
    } catch (error) {
      setRankMap({});
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
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.post_id !== postId));
    setRankMap((prev) => {
      if (!prev[postId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
          My Profile
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Your submissions</h1>
        <p className="text-sm text-muted-foreground">
          Your uploads and review history live here.
        </p>
      </header>

      {!token ? (
        <div className="card px-5 py-6 text-sm text-muted-foreground">
          Sign in to see your posts.
          <Link className="ml-2 text-accent hover:opacity-80" href="/login">
            Login
          </Link>
        </div>
      ) : loading ? (
        <div className="card px-5 py-6 text-sm text-muted-foreground">
          Loading your posts...
        </div>
      ) : isEmpty ? (
        <div className="card px-5 py-6">
          <p className="text-sm text-muted-foreground">
            You haven’t uploaded anything yet.
          </p>
          <Link className="btn-primary mt-4 inline-flex" href="/upload">
            Upload your first resume
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.post_id}
              post={post}
              apiBase={apiBase}
              token={token}
              onDeleted={handleDeleted}
              showRatingStats
              rank={rankMap[String(post.post_id)]}
              compact
            />
          ))}
        </div>
      )}
    </section>
  );
}
