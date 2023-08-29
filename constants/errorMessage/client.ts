export const ACCESS_QR_CODE_ERROR = {
  INVALID_QR_CODE:
    "This restaurant table does not exist. Please ask the staff for assistance",
  UNAVAILABLE_TABLE:
    "This table is currently unavailable. Please ask the staff for assistance",
} as const;

export const COMMON_ERROR = {
  SYSTEM_BUSY: "The system is currently busy. Please try again later",
  UNEXPECTED: "An unexpected error has occurred. Please try again later",
} as const;
