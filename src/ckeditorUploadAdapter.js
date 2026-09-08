import { Plugin, FileRepository } from "ckeditor5";
import { compressImageToDataUrl } from "./utils/imageCompress";

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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "이미지 업로드에 실패했습니다.");
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
