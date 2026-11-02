export type MovieStatus = "currently_playing" | "coming_soon" | "inactive";

export type GenreOption = {
  genreId: number;
  name: string;
};

export type MovieSelectOption = {
  movieId: number;
  title: string;
  runtimeMinutes: number | null;
  status: MovieStatus;
};

export type MovieFormValues = {
  title: string;
  description: string;
  posterUrl: string;
  trailerUrl: string;
  mpaaRating: string;
  castList: string;
  runtimeMinutes: string;
  releaseDate: string;
  status: MovieStatus;
  genreIds: number[];
};

export const MPAA_RATINGS = [
  "G",
  "PG",
  "PG-13",
  "R",
  "NC-17",
] as const;

export const EMPTY_MOVIE_FORM: MovieFormValues = {
  title: "",
  description: "",
  posterUrl: "",
  trailerUrl: "",
  mpaaRating: "",
  castList: "",
  runtimeMinutes: "",
  releaseDate: "",
  status: "coming_soon",
  genreIds: [],
};