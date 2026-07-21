import { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";

// In-place page editor — mirrors BookPage's size/padding/typography exactly
// (same px-14/pt-10/pb-16 page box) so flipping between read and edit mode
// never changes the book's apparent size or font ratio.
//
// Lazy-loaded from WorkManual so CKEditor (~1MB) is only fetched once an
// admin actually enters edit mode, not by every visitor reading a manual.
export default function BookPageEditor({ html, pageNum, onHtmlChange, editorKey, side, totalPages }) {
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문을 작성해보세요."));

  return (
    <div className="w-full h-full min-h-full px-14 pt-10 pb-16 relative break-keep flex flex-col">
      <div className="flex-1 min-h-0">
        <div className="dudc-ckeditor dudc-ckeditor-lg h-full">
          <CKEditor
            key={editorKey}
            editor={ClassicEditor}
            data={html}
            config={ckeditorConfig}
            onChange={(_event, editor) => onHtmlChange(editor.getData())}
          />
        </div>
      </div>
      <div
        className={`absolute bottom-6 text-[11px] font-light tracking-wide text-outline/60 pointer-events-none ${
          side === "left" ? "left-9" : "right-9"
        }`}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}
