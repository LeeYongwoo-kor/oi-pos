import { Prisma } from "@prisma/client";
import {
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime";

type PrismaError =
  | PrismaClientUnknownRequestError
  | PrismaClientValidationError
  | PrismaClientInitializationError
  | PrismaClientRustPanicError;

function prismaErrorHandler(error: PrismaError | Error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2025":
        return {
          status: 404,
          message: "The requested item could not be found.",
        };
      case "P2002":
        return {
          status: 409,
          message: "The provided data conflicts with existing data.",
        };
      case "P2010":
        return {
          status: 400,
          message:
            "The submitted data is incorrect or incomplete. Please check your input.",
        };
      case "P2014":
        return {
          status: 400,
          message: "The provided data references a non-existent item.",
        };
      default:
        return {
          status: 500,
          message:
            "An unexpected database error occurred. Please try again later.",
        };
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      message: "The submitted data is incorrect or incomplete.",
    };
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 500,
      message:
        "An error occurred while initializing the application. Please try again later.",
    };
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      status: 500,
      message: "An unexpected error occurred. Please try again later.",
    };
  } else {
    return {
      status: 500,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}

export default prismaErrorHandler;
