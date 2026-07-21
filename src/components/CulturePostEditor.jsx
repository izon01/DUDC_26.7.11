import { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";
import { stripHtml } from "../utils/html";

// Full-width, single-column editor canvas (Naver-blog-style) that replaces the
// entire reading area while an admin creates or edits a culture post.
//
// Lazy-loaded from CultureManual so CKEditor (~1MB) is only fetched once an
// admin actually opens the editor, not by every visitor reading a post.
export default function CulturePostEditor({ mode, initialValues, isSaving, onCancel, onSave }) {
  const [title, setTitle] = useState(initialValues.title);
  const [bodyHtml, setBodyHtml] = useState(initialValues.bodyHtml);
  const [checkPointsText, setCheckPointsText] = useState(initialValues.checkPoints.join("\n"));
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문 내용을 자유롭게 작성해보세요."));

  function handleSubmit() {
    const trimmedTitle = title.trim();
    const isBodyEmpty = stripHtml(bodyHtml).trim().length === 0;
    if (!trimmedTitle || isBodyEmpty) return;

    const checkPoints = checkPointsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    onSave({ title: trimmedTitle, bodyHtml, checkPoints });
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest">
      <div className="h-16 bg-white stitch-border-b px-10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-primary shrink-0">
            {mode === "edit" ? "edit_note" : "post_add"}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="포스트 제목을 입력하세요"
            className="w-full text-[20px] font-bold text-on-surface bg-transparent border-none outline-none focus:ring-0 placeholder:text-outline/40"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant font-bold text-[13px] hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-full bg-primary text-white font-bold text-[13px] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto px-10 py-10">
        <div className="dudc-ckeditor dudc-ckeditor-sticky">
          <CKEditor
            editor={ClassicEditor}
            data={bodyHtml}
            config={ckeditorConfig}
            onChange={(_event, editor) => setBodyHtml(editor.getData())}
          />
        </div>

        <div className="mt-10">
          <label className="text-[14px] font-bold text-on-surface-variant mb-2 block" htmlFor="post-checkpoints">
            체크포인트 (한 줄에 하나씩)
          </label>
          <textarea
            id="post-checkpoints"
            value={checkPointsText}
            onChange={(e) => setCheckPointsText(e.target.value)}
            rows={5}
            placeholder={"예:\n출입구에서 동료를 만나면 밝게 인사하기\n엘리베이터 안에서는 조용히 대화하기"}
            className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-[14px] focus:border-primary focus:ring-0 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
