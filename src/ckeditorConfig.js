import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Font,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  BlockQuote,
  List,
  Link,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageStyle,
  ImageResize,
  ImageTextAlternative,
} from "ckeditor5";
import { createUploadAdapterPlugin } from "./ckeditorUploadAdapter";

export { ClassicEditor };

const CKEDITOR_PLUGINS = [
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Font,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  BlockQuote,
  List,
  Link,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageStyle,
  ImageResize,
  ImageTextAlternative,
];

const CKEDITOR_TOOLBAR = [
  "heading",
  "|",
  "fontFamily",
  "fontSize",
  "fontColor",
  "fontBackgroundColor",
  "|",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "|",
  "alignment",
  "|",
  "bulletedList",
  "numberedList",
  "|",
  "blockQuote",
  "insertTable",
  "link",
  "uploadImage",
  "|",
  "undo",
  "redo",
];

// Self-hosted CKEditor 5 requires a licenseKey; "GPL" opts into the free,
// open-source distribution (shows a small "Powered by CKEditor" badge).
//
// `uploadToken` is the admin's JWT — the upload adapter sends it as a Bearer
// token to /api/upload-image, which is admin-gated the same way every other
// write endpoint in this app is.
export function createCkeditorConfig(placeholder, uploadToken) {
  return {
    licenseKey: "GPL",
    plugins: [...CKEDITOR_PLUGINS, createUploadAdapterPlugin(uploadToken)],
    toolbar: CKEDITOR_TOOLBAR,
    image: {
      toolbar: ["imageStyle:inline", "imageStyle:wrapText", "imageStyle:breakText", "|", "imageTextAlternative"],
    },
    fontFamily: {
      options: [
        "default",
        "Noto Sans KR, sans-serif",
        "맑은 고딕, Malgun Gothic, sans-serif",
        "돋움, Dotum, sans-serif",
        "굴림, Gulim, sans-serif",
        "바탕, Batang, serif",
        "Georgia, serif",
        "Arial, Helvetica, sans-serif",
        "Courier New, Courier, monospace",
      ],
      supportAllValues: true,
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
    },
    placeholder,
  };
}
