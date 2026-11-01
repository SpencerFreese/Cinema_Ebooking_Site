import {
  notFound,
  redirect,
} from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  findMovieById,
  findMovieGenreIds,
} from "@/lib/repositories/movieRepository";
import {
  getAllGenres,
} from "@/lib/services/genreService";
import AdminPageHeader from "@/app/admin/components/AdminPageHeader";
import MovieForm from "@/app/admin/movies/components/MovieForm";
import DeleteMovieButton from "@/app/admin/movies/components/DeleteMovieButton";

export const dynamic = "force-dynamic";

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{
    movieId: string;
  }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const {
    movieId: movieIdText,
  } = await params;

  const movieId =
    Number(movieIdText);

  if (
    !Number.isInteger(movieId) ||
    movieId <= 0
  ) {
    notFound();
  }

  const [
    movie,
    genreIds,
    genres,
  ] = await Promise.all([
    findMovieById(movieId),
    findMovieGenreIds(movieId),
    getAllGenres(),
  ]);

  if (!movie) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <AdminPageHeader
        title={`Edit ${movie.title}`}
        description="Update the movie information currently stored in the database."
        backHref="/admin/movies"
      />

      <MovieForm
        mode="edit"
        movieId={movie.movieId}
        genres={genres}
        initialValues={{
          title: movie.title,

          description:
            movie.description ?? "",

          posterUrl:
            movie.posterUrl ?? "",

          trailerUrl:
            movie.trailerUrl ?? "",

          mpaaRating:
            movie.mpaaRating ?? "",

          castList:
            movie.castList ?? "",

          runtimeMinutes:
            movie.runtimeMinutes
              ?.toString() ?? "",

          releaseDate:
            movie.releaseDate ?? "",

          status: movie.status,

          genreIds,
        }}
      />
      
      <DeleteMovieButton
        movieId={movie.movieId}
        title={movie.title}
      />
    </main>
  );
}