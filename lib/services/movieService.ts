import "server-only";

import {
  findMovieById,
  findMovies,
  type MovieFilters,
  type MovieStatus,
} from "@/lib/repositories/movieRepository";
import { findShowtimesByMovieId } from "@/lib/repositories/showtimeRepository";

export async function getMoviesByStatus(
  status: MovieStatus,
  filters: Omit<MovieFilters, "status"> = {},
) {
  return findMovies({
    ...filters,
    status,
  });
}

export async function getCurrentlyPlayingMovies(
  filters: Omit<MovieFilters, "status"> = {},
) {
  return getMoviesByStatus("currently_playing", filters);
}

export async function getComingSoonMovies(
  filters: Omit<MovieFilters, "status"> = {},
) {
  return getMoviesByStatus("coming_soon", filters);
}

export async function getMovieSearchResults(
  searchTerm?: string,
  genres: string[] = [],
  showDate?: string,
) {
  return findMovies({
    searchTerm,
    genres,
    showDate,
  });
}

export async function getMovieDetails(movieId: number) {
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return null;
  }

  const movie = await findMovieById(movieId);

  if (!movie || movie.status === "inactive") {
    return null;
  }

  const showtimes = await findShowtimesByMovieId(movieId);

  return {
    ...movie,
    showtimes,
  };
}