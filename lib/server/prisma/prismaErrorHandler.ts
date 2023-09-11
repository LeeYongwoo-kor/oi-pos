import { Prisma } from "@prisma/client";
import {
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime";
import { NotFoundError, ValidationError } from "@/lib/shared/error/ApiError";
import { DatabaseError } from "../../shared/error/DatabaseError";

type PrismaError =
  | PrismaClientUnknownRequestError
  | PrismaClientValidationError
  | PrismaClientInitializationError
  | PrismaClientRustPanicError;

function prismaErrorHandler(err: PrismaError | Error): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        throw new NotFoundError("The requested item could not be found.", err);
      case "P2002":
        throw new DatabaseError(
          "The provided data conflicts with existing data.",
          err
        );
      case "P2010":
        throw new ValidationError(
          "The submitted data is incorrect or incomplete. Please check your input.",
          err
        );
      case "P2014":
        throw new ValidationError(
          "The provided data references a non-existent item.",
          err
        );
      default:
        throw new DatabaseError(
          "An unexpected database error occurred. Please try again later.",
          err
        );
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError(
      "The submitted data is incorrect or incomplete.",
      err
    );
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError(
      "An error occurred while initializing the application. Please try again later.",
      err
    );
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    throw new DatabaseError(
      "An unexpected error occurred. Please try again later.",
      err
    );
  } else {
    throw new DatabaseError(
      "An unexpected error occurred. Please try again later.",
      err
    );
  }
}

export default prismaErrorHandler;
