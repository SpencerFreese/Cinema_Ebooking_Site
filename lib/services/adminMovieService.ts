import "server-only";

import {
  findAllGenres,
} from "@/lib/repositories/genreRepository";

import {
  findMovieById,
  insertMovie,
  updateMovie,
  type MovieWriteInput,
} from "@/lib/repositories/movieRepository";

import {
  MPAA_RATINGS,
  type MovieStatus,
} from "@/lib/movieForm";

import type { PosterProvider } from "@/lib/providers/posterProvider";
import { TMDBPosterAdapter } from "@/lib/providers/tmdbPosterAdapter";

const defaultPosterProvider: PosterProvider =
  new TMDBPosterAdapter();

export class AdminMovieValidationError
  extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);

    this.name =
      "AdminMovieValidationError";
  }
}

type UnknownRecord =
  Record<string, unknown>;

function isObject(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function optionalText(
  value: unknown,
) {
  return (
    typeof value === "string" &&
    value.trim()
      ? value.trim()
      : null
  );
}

function isValidHttpUrl(
  value: string | null,
) {
  if (!value) {
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

function isValidDate(
  value: string,
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() === day
  );
}

async function normalizeMovieInput(
  body: unknown,
  {
    fetchPosterWhenMissing,
    posterProvider =
      defaultPosterProvider,
  }: {
    fetchPosterWhenMissing: boolean;
    posterProvider?: PosterProvider;
  },
): Promise<MovieWriteInput> {
  if (!isObject(body)) {
    throw new AdminMovieValidationError(
      "Invalid movie information.",
    );
  }

  const title =
    optionalText(body.title);

  if (!title) {
    throw new AdminMovieValidationError(
      "Title is required.",
    );
  }

  const status = body.status;

  if (
    status !==
      "currently_playing" &&
    status !== "coming_soon" &&
    status !== "inactive"
  ) {
    throw new AdminMovieValidationError(
      "Invalid movie status.",
    );
  }

  let runtimeMinutes:
    number | null = null;

  if (
    body.runtimeMinutes !== null &&
    body.runtimeMinutes !==
      undefined &&
    body.runtimeMinutes !== ""
  ) {
    runtimeMinutes = Number(
      body.runtimeMinutes,
    );

    if (
      !Number.isInteger(
        runtimeMinutes,
      ) ||
      runtimeMinutes <= 0
    ) {
      throw new AdminMovieValidationError(
        "Runtime must be a positive whole number.",
      );
    }
  }

  const releaseDate =
    optionalText(body.releaseDate);

  if (
    releaseDate &&
    !isValidDate(releaseDate)
  ) {
    throw new AdminMovieValidationError(
      "Select a valid release date.",
    );
  }

  const mpaaRating =
    optionalText(body.mpaaRating);

  if (
    mpaaRating &&
    !MPAA_RATINGS.includes(
      mpaaRating as
        (typeof MPAA_RATINGS)[number],
    )
  ) {
    throw new AdminMovieValidationError(
      "Invalid MPAA rating.",
    );
  }

  let posterUrl =
    optionalText(body.posterUrl);

  const trailerUrl =
    optionalText(body.trailerUrl);

  if (
    !isValidHttpUrl(posterUrl)
  ) {
    throw new AdminMovieValidationError(
      "Poster URL must begin with http:// or https://.",
    );
  }

  if (
    !isValidHttpUrl(trailerUrl)
  ) {
    throw new AdminMovieValidationError(
      "Trailer URL must begin with http:// or https://.",
    );
  }

  const genreIds =
    Array.isArray(body.genreIds)
      ? [
          ...new Set(
            body.genreIds.map(Number),
          ),
        ]
      : [];

  if (
    genreIds.some(
      (genreId) =>
        !Number.isInteger(
          genreId,
        ) ||
        genreId <= 0,
    )
  ) {
    throw new AdminMovieValidationError(
      "Invalid genre selection.",
    );
  }

  if (genreIds.length > 0) {
    const genres =
      await findAllGenres();

    const validGenreIds =
      new Set(
        genres.map(
          (genre) =>
            genre.genreId,
        ),
      );

    if (
      genreIds.some(
        (genreId) =>
          !validGenreIds.has(
            genreId,
          ),
      )
    ) {
      throw new AdminMovieValidationError(
        "Invalid genre selection.",
      );
    }
  }

  if (
    !posterUrl &&
    fetchPosterWhenMissing
  ) {
    posterUrl =
      await posterProvider.getPosterUrl(
        title,
      );
  }

  return {
    title,

    description:
      optionalText(
        body.description,
      ),

    posterUrl,
    trailerUrl,
    mpaaRating,

    castList:
      optionalText(body.castList),

    runtimeMinutes,
    releaseDate,

    status:
      status as MovieStatus,

    genreIds,
  };
}

export async function createAdminMovie(
  body: unknown,
) {
  const input =
    await normalizeMovieInput(
      body,
      {
        fetchPosterWhenMissing:
          true,
      },
    );

  return insertMovie(input);
}

export async function updateAdminMovie(
  movieId: number,
  body: unknown,
) {
  if (
    !Number.isInteger(movieId) ||
    movieId <= 0
  ) {
    throw new AdminMovieValidationError(
      "Invalid movie ID.",
    );
  }

  const existingMovie =
    await findMovieById(movieId);

  if (!existingMovie) {
    throw new AdminMovieValidationError(
      "Movie not found.",
      404,
    );
  }

  const input =
    await normalizeMovieInput(
      body,
      {
        /*
         * In edit mode, an empty
         * poster field means remove
         * the poster. Do not silently
         * fetch another one.
         */
        fetchPosterWhenMissing:
          false,
      },
    );

  await updateMovie(
    movieId,
    input,
  );

  return movieId;
}