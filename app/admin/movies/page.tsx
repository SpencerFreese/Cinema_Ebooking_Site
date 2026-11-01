import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  findMovies,
} from "@/lib/repositories/movieRepository";
import AdminPageHeader from "@/app/admin/components/AdminPageHeader";
import EditMoviePicker from "./components/EditMoviePicker";

export const dynamic = "force-dynamic";

export default async function ManageMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const [{ success }, movies] =
    await Promise.all([
      searchParams,
      findMovies(),
    ]);

  const movieOptions = movies.map(
    (movie) => ({
      movieId: movie.movieId,
      title: movie.title,
      runtimeMinutes:
        movie.runtimeMinutes,
      status: movie.status,
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <AdminPageHeader
        title="Manage Movies"
        description="Add a new movie or update information for a movie already stored in the database."
      />

      {success === "added" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Movie added successfully.
        </p>
      ) : null}

      {success === "updated" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Movie information updated successfully.
        </p>
      ) : null}

      {success === "deleted" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Movie deleted successfully.
        </p>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-300 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">
            Add a Movie
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create a new movie record and
            assign its genres.
          </p>

          <Link
            href="/admin/movies/add"
            className="mt-5 inline-flex rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Add New Movie
          </Link>
        </article>

        <article className="rounded-2xl border border-zinc-300 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">
            Edit a Movie
          </h2>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Select an existing movie, then
            change any stored information.
          </p>

          {movieOptions.length > 0 ? (
            <EditMoviePicker
              movies={movieOptions}
            />
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              No movies are currently
              available to edit.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}