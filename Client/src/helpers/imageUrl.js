// Shared image URL resolver for all product components.
// Backend stores images as "uploads/products/xxx.jpg" (relative path).
// Static/legacy images start with "/assets/..." (served from public folder).

const IMG_URL = process.env.REACT_APP_IMG_URL || "";

/**
 * Normalize any image path to a relative uploads path.
 * Strips any absolute host prefix (http://...) so the image always
 * resolves via the current REACT_APP_IMG_URL, regardless of what host
 * was used when the path was originally stored (dev IP, staging, etc.)
 * @param {string} src
 * @returns {string} relative path like "uploads/products/xxx.jpg"
 */
function toRelativePath(src) {
  if (!src || typeof src !== "string") return "";
  // Strip any absolute URL base: http://host:port or https://host
  const withoutHost = src.replace(/^https?:\/\/[^/]+(:\d+)?/, "");
  // Remove leading slash
  return withoutHost.replace(/^\//, "");
}

/**
 * Resolve any product image path to a full URL.
 * @param {string|Array|null|undefined} img
 * @returns {string}
 */
export function getImgUrl(img) {
  if (!img) return "";
  // Resolve image into array format first to handle arrays, strings, JSON strings
  const imgs = resolveImageAsArray(img);
  const src = imgs[0] || "";
  if (!src || typeof src !== "string") return "";
  // Static legacy asset (from public folder) — leave as-is
  if (src.startsWith("/assets")) return process.env.PUBLIC_URL + src;
  // For all other paths (absolute URLs or relative), normalize to relative
  // so the current REACT_APP_IMG_URL is always used.
  const relative = toRelativePath(src);
  if (!relative) return "";
  // Strip any redundant "uploads/" prefix before re-adding it
  const clean = relative.replace(/^uploads\//, "");
  return `${IMG_URL}/uploads/${clean}`;
}

/**
 * Normalize any image value (string, JSON string, or array) into a clean array of paths.
 * Handles nested JSON arrays recursively.
 * @param {any} img
 * @returns {Array<string>}
 */
export function resolveImageAsArray(img) {
  if (!img) return [];
  if (Array.isArray(img)) {
    return img.flatMap(item => resolveImageAsArray(item)).filter(Boolean);
  }
  if (typeof img === "string") {
    const trimmed = img.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.flatMap(item => resolveImageAsArray(item)).filter(Boolean);
        }
      } catch (e) {
        // fail-through
      }
    }
    return [trimmed];
  }
  return [];
}
