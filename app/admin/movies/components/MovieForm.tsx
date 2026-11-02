"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EMPTY_MOVIE_FORM,
  MPAA_RATINGS,
  type GenreOption,
  type MovieFormValues,
} from "@/lib/movieForm";

type MovieFormMode =
  | "add"
  | "edit";

type FieldErrors = Partial<
  Record<keyof MovieFormValues, string>
>;

function isValidHttpUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validateMovieForm(
  form: MovieFormValues,
) {
  const errors: FieldErrors = {};

  if (!form.title.trim()) {
    errors.title =
      "Title is required.";
  }

  if (form.runtimeMinutes) {
    const runtime =
      Number(form.runtimeMinutes);

    if (
      !Number.isInteger(runtime) ||
      runtime <= 0
    ) {
      errors.runtimeMinutes =
        "Runtime must be a positive whole number.";
    }
  }

  if (
    form.releaseDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(
      form.releaseDate,
    )
  ) {
    errors.releaseDate =
      "Select a valid release date.";
  }

  if (!isValidHttpUrl(form.posterUrl)) {
    errors.posterUrl =
      "Poster URL must begin with http:// or https://.";
  }

  if (!isValidHttpUrl(form.trailerUrl)) {
    errors.trailerUrl =
      "Trailer URL must begin with http:// or https://.";
  }

  return errors;
}

export default function MovieForm({
  mode,
  genres,
  movieId,
  initialValues = EMPTY_MOVIE_FORM,
}: {
  mode: MovieFormMode;
  genres: GenreOption[];
  movieId?: number;
  initialValues?: MovieFormValues;
}) {
  const router = useRouter();

  const [form, setForm] =
    useState<MovieFormValues>(
      initialValues,
    );

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const [serverError, setServerError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  function handleChange(
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setServerError("");
  }

  function toggleGenre(
    genreId: number,
  ) {
    setForm((current) => ({
      ...current,

      genreIds:
        current.genreIds.includes(
          genreId,
        )
          ? current.genreIds.filter(
              (id) => id !== genreId,
            )
          : [
              ...current.genreIds,
              genreId,
            ],
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setServerError("");

    const validationErrors =
      validateMovieForm(form);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    if (mode === "edit" && !movieId) {
      setServerError(
        "A valid movie must be selected before editing.",
      );
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const endpoint =
        mode === "add"
          ? "/api/admin/movies"
          : `/api/admin/movies/${movieId}`;

      const response = await fetch(endpoint, {
        method: mode === "add" ? "POST" : "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,

          runtimeMinutes:
            form.runtimeMinutes.trim() !== ""
              ? Number(form.runtimeMinutes)
              : null,
        }),
      });

      const contentType =
        response.headers.get("content-type") ?? "";

      if (
        !contentType.includes("application/json")
      ) {
        const responseText =
          await response.text();

        console.error(
          "Movie API returned a non-JSON response:",
          responseText,
        );

        setServerError(
          `Server error (${response.status}). Check the pnpm dev terminal.`,
        );

        return;
      }

      const data: {
        error?: string;
        movieId?: number;
      } = await response.json();

      if (!response.ok) {
        setServerError(
          data.error ??
            `Unable to save the movie (${response.status}).`,
        );

        return;
      }

      router.push(
        `/admin/movies?success=${
          mode === "add" ? "added" : "updated"
        }`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Add/Edit Movie request failed:",
        error,
      );

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to contact the movie API.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-zinc-300 p-6 dark:border-zinc-800"
    >
      {serverError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="title"
          className="text-sm font-semibold"
        >
          Title{" "}
          <span className="text-red-500">
            *
          </span>
        </label>

        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Avengers: Doomsday"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {errors.title ? (
          <p className="text-xs text-red-500">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-semibold"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Brief synopsis of the movie..."
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status"
            className="text-sm font-semibold"
          >
            Status{" "}
            <span className="text-red-500">
              *
            </span>
          </label>

          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="coming_soon">
              Coming Soon
            </option>

            <option value="currently_playing">
              Currently Playing
            </option>

            <option value="inactive">
              Inactive (hidden from the public site)
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="mpaaRating"
            className="text-sm font-semibold"
          >
            MPAA Rating
          </label>

          <select
            id="mpaaRating"
            name="mpaaRating"
            value={form.mpaaRating}
            onChange={handleChange}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">
              Select a rating
            </option>

            {MPAA_RATINGS.map(
              (rating) => (
                <option
                  key={rating}
                  value={rating}
                >
                  {rating}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="runtimeMinutes"
            className="text-sm font-semibold"
          >
            Runtime (minutes)
          </label>

          <input
            id="runtimeMinutes"
            name="runtimeMinutes"
            type="number"
            min="1"
            value={
              form.runtimeMinutes
            }
            onChange={handleChange}
            placeholder="e.g. 120"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />

          {errors.runtimeMinutes ? (
            <p className="text-xs text-red-500">
              {
                errors.runtimeMinutes
              }
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="releaseDate"
            className="text-sm font-semibold"
          >
            Release Date
          </label>

          <input
            id="releaseDate"
            name="releaseDate"
            type="date"
            value={form.releaseDate}
            onChange={handleChange}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />

          {errors.releaseDate ? (
            <p className="text-xs text-red-500">
              {errors.releaseDate}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="castList"
          className="text-sm font-semibold"
        >
          Cast
        </label>

        <input
          id="castList"
          name="castList"
          value={form.castList}
          onChange={handleChange}
          placeholder="e.g. Tom Hanks, Scarlett Johansson"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="posterUrl"
          className="text-sm font-semibold"
        >
          Poster URL
        </label>

        <input
          id="posterUrl"
          name="posterUrl"
          type="url"
          value={form.posterUrl}
          onChange={handleChange}
          placeholder="https://..."
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {errors.posterUrl ? (
          <p className="text-xs text-red-500">
            {errors.posterUrl}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="trailerUrl"
          className="text-sm font-semibold"
        >
          Trailer URL
        </label>

        <input
          id="trailerUrl"
          name="trailerUrl"
          type="url"
          value={form.trailerUrl}
          onChange={handleChange}
          placeholder="https://www.youtube.com/embed/..."
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {errors.trailerUrl ? (
          <p className="text-xs text-red-500">
            {errors.trailerUrl}
          </p>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">
          Genres
        </legend>

        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const selected =
              form.genreIds.includes(
                genre.genreId,
              );

            return (
              <button
                key={genre.genreId}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  toggleGenre(
                    genre.genreId,
                  )
                }
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  selected
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : mode === "add"
              ? "Add Movie"
              : "Save Movie Changes"}
        </button>

        <Link
          href="/admin/movies"
          className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}