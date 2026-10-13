import { Plugin, FileRepository } from "ckeditor5";
import { compressImageToDataUrl } from "./utils/imageCompress";
import { parseJsonSafely } from "./utils/http";

function uploadErrorMessage(status) {
  if (status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  if (status === 413) return "이미지 용량이 너무 큽니다. 더 작은 이미지로 시도해 주세요.";
  if (status === 504) return "업로드 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  return "이미지 업로드에 실패했습니다.";
}

// CKEditor calls upload() once per dropped/pasted/picked image and expects a
// promise resolving to { default: <url> }. Compression happens client-side
// so the request body (and Blob storage cost) stays small regardless of the
// original file size.
class CompressingUploadAdapter {
  constructor(loader, token) {
    this.loader = loader;
    this.token = token;
  }

  async upload() {
    const file = await this.loader.file;
    const dataUrl = await compressImageToDataUrl(file);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ dataUrl }),
    });
    // Non-JSON failures (e.g. Vercel's own 413/504 pages) would otherwise
    // surface as an opaque "Unexpected token" error in CKEditor's alert.
    const data = await parseJsonSafely(res);
    if (!res.ok) throw new Error(data.message || uploadErrorMessage(res.status));
    if (!data.url) throw new Error("이미지 업로드에 실패했습니다.");
    return { default: data.url };
  }

  abort() {}
}

// A real Plugin subclass (rather than a bare function) so CKEditor's
// dependency resolver guarantees FileRepository is initialized first.
export function createUploadAdapterPlugin(token) {
  return class CompressingUploadAdapterPlugin extends Plugin {
    static get requires() {
      return [FileRepository];
    }

    init() {
      this.editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
        new CompressingUploadAdapter(loader, token);
    }
  };
}
