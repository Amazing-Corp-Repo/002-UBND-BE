export const BUILT_IN_CORS_ORIGINS = Object.freeze([
  "https://cong-dan-tangnhonphu-git-update-digital-map-long-d139.vercel.app",
  "https://sos-tnp-longlo.vercel.app",
]);

const normalizeOrigin = (origin) =>
  typeof origin === "string" ? origin.trim().replace(/\/+$/, "") : origin;

export const isCorsOriginAllowed = (origin, configuredOrigins = []) => {
  // Requests from server-side clients such as Postman do not include Origin.
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = [...configuredOrigins, ...BUILT_IN_CORS_ORIGINS].map(
    normalizeOrigin
  );

  return (
    allowedOrigins.includes("*") || allowedOrigins.includes(normalizedOrigin)
  );
};
