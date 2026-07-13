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
} from "ckeditor5";

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
];

const CKEDITOR_TOOLBAR = [
  "heading",
  "|",
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
  "|",
  "undo",
  "redo",
];

// Self-hosted CKEditor 5 requires a licenseKey; "GPL" opts into the free,
// open-source distribution (shows a small "Powered by CKEditor" badge).
export function createCkeditorConfig(placeholder) {
  return {
    licenseKey: "GPL",
    plugins: CKEDITOR_PLUGINS,
    toolbar: CKEDITOR_TOOLBAR,
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
    },
    placeholder,
  };
}
