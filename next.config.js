/** @type {import('next').NextConfig} */
const nextConfig = {
  // https://nextjs.org/docs/api-reference/next.config.js/react-strict-mode
  reactStrictMode: false,
  images: {
    domains: [
      "upload.wikimedia.org",
      "zip-cloud.appspot.com",
      "d18unyv5gnepny.cloudfront.net",
      "oaidalleapiprodscus.blob.core.windows.net",
    ],
  },
  webpack: (config) => {
    const envCheck = [
      "NEXTAUTH_URL",
      "NEXTAUTH_SECRET",
      "NEXT_PUBLIC_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL",
      "NEXT_PUBLIC_API_VERSION",
      "REDIS_HOST",
      "REDIS_PORT",
      "REDIS_PASSWORD",
      "AWS_S3_ACCESS_KEY",
      "AWS_S3_SECRET_KEY",
      "AWS_S3_BUCKET_NAME",
      "AWS_S3_BUCKET_REGION",
      "OPEN_AI_SECRET_KEY",
      "AWS_CLOUDFRONT_URL",
      "NEXT_PUBLIC_AWS_CLOUDFRONT_URL",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "LINE_CLIENT_ID",
      "LINE_CLIENT_SECRET",
      "EMAIL_SERVER_USER",
      "EMAIL_SERVER_PASSWORD",
      "EMAIL_SERVER_HOST",
      "EMAIL_SERVER_PORT",
      "EMAIL_FROM",
      "SENDGRID_API_KEY",
      "PAYPAL_CLIENT_ID",
      "PAYPAL_APP_SECRET",
      "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
      "RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED",
    ];
    envCheck.forEach((key) => {
      if (!process.env[key]) {
        throw new Error(
          `${key} environment variable is not defined. Build failed.`
        );
      }
    });
    return config;
  },
};

module.exports = nextConfig;
