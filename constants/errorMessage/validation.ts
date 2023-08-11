import { COUNTER_NUMBER_MAX, TABLE_NUMBER_MAX } from "../plan";

export const RESTAURANT_INFO_ERROR = {
  NAME_REQUIRED: "Restaurant Name is required",
  NAME_MAX: "Restaurant Name should be at most 30 characters",
  NAME_SPECIAL_CHAR:
    "No special characters allowed. You cannot enter only spaces",
  BRANCH_REQUIRED: "Branch Name is required",
  BRANCH_MAX: "Branch Name should be at most 30 characters",
  BRANCH_SPECIAL_CHAR:
    "No special characters allowed. You cannot enter only spaces",
  PHONE_REQUIRED: "Phone Number is required",
  PHONE_INVALID: "Must be a valid phone number",
  PHONE_DUPLICATE: "Phone Number already exists. Please enter a new one",
  POST_CODE_REQUIRED: "Post Code is required",
  POST_CODE_MAX: "Post Code should be at most 7 characters",
  POST_CODE_INVALID: "Must be a valid post code",
  POST_CODE_NOT_FOUND: "Post Code not found. Please enter a valid one",
  REST_ADDRESS_REQUIRED: "Rest Address is required",
  REST_ADDRESS_MAX: "Rest Address should be at most 100 characters",
  REST_ADDRESS_SPECIAL_CHAR:
    "No special characters allowed other than address characters",
} as const;

export const RESTAURANT_HOURS_ERROR = {
  HOLIDAY_CANNOT_SPECIFIY: "You cannot specify all days as holidays",
  LAST_ORDER_BUINESS_HOUR_INVALID: "Last Order must be within Business Hours",
} as const;

export const RESTAURANT_TABLES_ERROR = {
  TABLE_NUMBER_REQUIRED: "Table Number is required",
  TABLE_NUMBER_POSITIVE: "Table number must be a positive number",
  TABLE_NUMBER_MAX: `Table number must be less than ${TABLE_NUMBER_MAX}`,
  COUNTER_NUMBER_REQUIRED: "Counter Number is required",
  COUNTER_NUMBER_POSITIVE: "Counter number must be a positive number",
  COUNTER_NUMBER_MAX: `Counter number must be less than ${COUNTER_NUMBER_MAX}`,
} as const;
