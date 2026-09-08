// Downscales and re-encodes an image in the browser before it's ever sent to
// the server, so editor uploads stay cheap on Blob storage/bandwidth and the
// request itself stays fast. Long edge is capped at MAX_DIMENSION and JPEG
// quality steps down until the encoded size clears MAX_BYTES.
const MAX_DIMENSION = 1600;
const MAX_BYTES = 1.5 * 1024 * 1024;
const MIN_QUALITY = 0.5;

export function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("이미지 파일을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Flatten transparency onto white before JPEG-encoding — JPEG has no
        // alpha channel, so an unfilled canvas would encode transparent PNG
        // areas as black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length * 0.75 > MAX_BYTES && quality > MIN_QUALITY) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
