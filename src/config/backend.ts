const HTTP_URL_PATTERN = /^https?:\/\//i;

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const normalizeBaseRoot = (value: string) =>
  trimTrailingSlashes(value.trim()).replace(/\/api\/v[12]$/i, "");

const getBackendBaseUrl = () => {
  const value = (
    import.meta.env.VITE_BE_BASE_URL ??
    import.meta.env.VITE_BE_API_BASE_URL ??
    ""
  ).trim();

  if (!value) {
    return "/api/proxy";
  }

  return normalizeBaseRoot(value);
};

const getBrowserOrigin = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "http://localhost";
};

export const buildBackendUrl = (baseUrl: string, path = "") => {
  const normalizedBaseUrl = trimTrailingSlashes(baseUrl.trim());
  const normalizedPath = path
    ? path.startsWith("/")
      ? path
      : `/${path}`
    : "";
  const url = `${normalizedBaseUrl}${normalizedPath}`;

  if (HTTP_URL_PATTERN.test(url)) {
    return url;
  }

  return new URL(url, getBrowserOrigin()).toString();
};

export const BE_BASE_URL = getBackendBaseUrl();
export const OAUTH_BASE_URL = `${BE_BASE_URL}/oauth2`;
export const API_V1_BASE_URL = `${BE_BASE_URL}/api/v1`;
