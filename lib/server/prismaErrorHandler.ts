import { Prisma } from "@prisma/client";
import {
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime";
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/CustomError";

type PrismaError =
  | PrismaClientUnknownRequestError
  | PrismaClientValidationError
  | PrismaClientInitializationError
  | PrismaClientRustPanicError;

function prismaErrorHandler(error: PrismaError | Error): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        throw new NotFoundError(
          "The requested item could not be found.",
          error
        );
      case "P2002":
        throw new DatabaseError(
          "The provided data conflicts with existing data.",
          error
        );
      case "P2010":
        throw new ValidationError(
          "The submitted data is incorrect or incomplete. Please check your input.",
          error
        );
      case "P2014":
        throw new ValidationError(
          "The provided data references a non-existent item.",
          error
        );
      default:
        throw new DatabaseError(
          "An unexpected database error occurred. Please try again later.",
          error
        );
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError(
      "The submitted data is incorrect or incomplete.",
      error
    );
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError(
      "An error occurred while initializing the application. Please try again later.",
      error
    );
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new DatabaseError(
      "An unexpected error occurred. Please try again later.",
      error
    );
  } else {
    throw new DatabaseError(
      "An unexpected error occurred. Please try again later.",
      error
    );
  }
}

export default prismaErrorHandler;
