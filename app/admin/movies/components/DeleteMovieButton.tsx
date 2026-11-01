"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteMovieButton({
  movieId,
  title,
}: {
  movieId: number;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/movies/${movieId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Unable to delete the movie.");
        setConfirming(false);
        return;
      }

      router.push("/admin/movies?success=deleted");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-300 p-6 dark:border-red-900">
      <h2 className="text-xl font-semibold text-red-600">Delete Movie</h2>

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Permanently removes this movie along with its showtimes, genre links,
        and favorites. This cannot be undone.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-5 rounded-lg border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Delete Movie
        </button>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium">
            Delete &quot;{title}&quot;?
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}