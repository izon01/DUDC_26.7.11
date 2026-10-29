// Per-file size ceiling for manual-document uploads (server side; the browser
// copy lives in src/utils/uploadLimits.js — keep the two in sync).
//
// Files travel as base64 inside a JSON body, which inflates them by ~33%, and
// Vercel rejects any request body over 4.5MB before our code runs. 3MB raw is
// ~4.2MB encoded, so 3MB is the most that fits — and only if each request
// carries a single file. After moving to a server without that cap (and to
// multipart uploads) this is the one number to raise.
export const MAX_UPLOAD_MB = 3;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
