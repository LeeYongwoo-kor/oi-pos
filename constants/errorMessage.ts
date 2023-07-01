export const RESTAURANT_INFO = {
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
  REST_ADDRESS_REQUIRED: "Rest Address is required",
  REST_ADDRESS_MAX: "Rest Address should be at most 100 characters",
  REST_ADDRESS_SPECIAL_CHAR:
    "No special characters allowed other than address characters",
} as const;
