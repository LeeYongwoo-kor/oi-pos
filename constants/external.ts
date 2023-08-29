export const EXTERNAL_URL = {
  ZIP_CLOUD: "https://zip-cloud.appspot.com",
  OPEN_AI: "https://api.openai.com/v1",
} as const;

export const EXTERNAL_ENDPOINT = {
  ZIP_CLOUD_SEARCH: `${EXTERNAL_URL.ZIP_CLOUD}/api/search`,
  OPEN_AI_CREATE_IMAGE: `${EXTERNAL_URL.OPEN_AI}/images/generations`,
} as const;
