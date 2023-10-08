export const ACCESS_QR_CODE_ERROR = {
  INVALID_QR_CODE:
    "This restaurant table does not exist. Please ask the staff for assistance",
  UNAVAILABLE_TABLE:
    "This table is currently unavailable. Please ask the staff for assistance",
  TODAY_IS_NOT_OPENING_DAY:
    "Sorry😥 Today is not the opening day of this restaurant",
  OUT_OF_BUSINESS_HOURS:
    "Sorry😥 This restaurant is currently closed. Please come back during business hours",
} as const;

export const COMMON_ERROR = {
  SYSTEM_BUSY: "The system is currently busy. Please try again later",
  UNEXPECTED: "An unexpected error has occurred. Please try again later",
} as const;
