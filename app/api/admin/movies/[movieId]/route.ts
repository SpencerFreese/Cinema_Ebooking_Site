import {
  NextResponse,
} from "next/server";
import { getSession } from "@/lib/auth";
import {
  AdminMovieValidationError,
  updateAdminMovie,
} from "@/lib/services/adminMovieService";
import { deleteMovie } from "@/lib/repositories/movieRepository";

function isDuplicateEntryError(
  error: unknown,
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  );
}

export async function PUT(
  request: Request,

  {
    params,
  }: {
    params: Promise<{
      movieId: string;
    }>;
  },
) {
  const session =
    await getSession();

  if (
    !session ||
    session.role !== "admin"
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const {
      movieId: movieIdText,
    } = await params;

    const movieId =
      Number(movieIdText);

    const body =
      await request.json();

    await updateAdminMovie(
      movieId,
      body,
    );

    return NextResponse.json({
      movieId,
    });
  } catch (error) {
    if (
      error instanceof
      AdminMovieValidationError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status:
            error.statusCode,
        },
      );
    }

    if (
      isDuplicateEntryError(
        error,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A movie with this title and release date already exists.",
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "Failed to update movie:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to update the movie. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId: movieIdText } = await params;
  const movieId = Number(movieIdText);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  try {
    const deleted = await deleteMovie(movieId);

    if (!deleted) {
      return NextResponse.json({ error: "Movie not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // MySQL refuses the delete when orders reference one of the movie's showtimes
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return NextResponse.json(
        {
          error:
            "This movie has existing orders and cannot be deleted.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to delete movie:", error);

    return NextResponse.json(
      { error: "Unable to delete the movie. Please try again." },
      { status: 500 },
    );
  }
}