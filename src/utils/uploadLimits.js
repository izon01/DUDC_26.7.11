// Per-file size ceiling for manual-document uploads (browser side; the server
// copy lives in api/_lib/uploadLimits.js — keep the two in sync). See that file
// for why 3MB is the ceiling on Vercel and what to change after migrating.
export const MAX_UPLOAD_MB = 3;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
