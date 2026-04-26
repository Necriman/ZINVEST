"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Code,
  Highlighter,
  Link2,
  Italic,
  ListChecks,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from "lucide-react";

const DEBOUNCE_MS = 1000;

const CustomShortcuts = Extension.create({
  name: "customShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        const previousUrl = this.editor.getAttributes("link").href;
        const url = window.prompt("URL:", previousUrl ?? "https://");
        if (url === null) return true;
        if (!url.trim()) {
          return this.editor.chain().focus().unsetLink().run();
        }
        return this.editor.chain().focus().setLink({ href: url.trim() }).run();
      },
      "Mod-Shift-h": () => {
        return this.editor
          .chain()
          .focus()
          .toggleHighlight({ color: "#FEF08A" })
          .run();
      },
      "Mod-Shift-9": () => {
        return this.editor.chain().focus().toggleTaskList().run();
      },
    };
  },
});

const editorClass =
  "prose prose-lg max-w-none min-h-[220px] px-4 py-3 focus:outline-none " +
  "[&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:text-[var(--text-primary)] " +
  "[&_.ProseMirror_a]:text-[var(--accent)] [&_.ProseMirror_a]:underline " +
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-3";

type Props = {
  lessonId: number;
  storageKeyPrefix: string;
  legacyPlainStorageKeyPrefix?: string;
  placeholder: string;
  onHtmlChange?: (html: string) => void;
  scrollCapOnMobile?: boolean;
  /** Increment `token` to insert HTML at the end of the document (e.g. quoted selection). */
  appendRequest?: { token: number; html: string };
};

export function NotionNotesEditor({
  lessonId,
  storageKeyPrefix,
  legacyPlainStorageKeyPrefix,
  placeholder,
  onHtmlChange,
  scrollCapOnMobile,
  appendRequest,
}: Props) {
  const [slashOpen, setSlashOpen] = useState(false);
  const htmlKey = `${storageKeyPrefix}-html-${lessonId}`;
  const legacyKey = legacyPlainStorageKeyPrefix
    ? `${legacyPlainStorageKeyPrefix}-${lessonId}`
    : null;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;

  const flushSave = useCallback(
    (html: string) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(htmlKey, html);
      onHtmlChangeRef.current?.(html);
    },
    [htmlKey],
  );

  const scheduleSave = useCallback(
    (html: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flushSave(html), DEBOUNCE_MS);
    },
    [flushSave],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Underline,
      CustomShortcuts,
    ],
    content: "<p></p>",
    immediatelyRender: false,
    autofocus: true,
    editable: true,
    injectCSS: true,
    editorProps: {
      attributes: {
        class: editorClass,
        spellcheck: "true",
      },
      handleKeyDown(_, event) {
        const target = event.target as HTMLElement | null;
        if (!target?.closest(".ProseMirror")) return false;
        if (event.key === "/" && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          setSlashOpen(true);
        } else if (event.key === "Escape") {
          setSlashOpen(false);
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      scheduleSave(ed.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, [lessonId]);

  useEffect(() => {
    if (!editor) return;
    if (typeof window === "undefined") return;

    let initial = window.localStorage.getItem(htmlKey) ?? "";
    if (!initial.trim() && legacyKey) {
      const plain = window.localStorage.getItem(legacyKey);
      if (plain?.trim()) {
        const escaped = plain
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        initial = `<p>${escaped.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
      }
    }
    editor.commands.setContent(initial.trim() ? initial : "<p></p>");
    onHtmlChangeRef.current?.(editor.getHTML());
  }, [editor, lessonId, htmlKey, legacyKey]);

  const flushSaveRef = useRef(flushSave);
  flushSaveRef.current = flushSave;
  const lastAppendToken = useRef<number>(-1);
  useEffect(() => {
    if (!editor || !appendRequest) return;
    if (appendRequest.token === lastAppendToken.current) return;
    lastAppendToken.current = appendRequest.token;
    editor.chain().focus("end").insertContent(appendRequest.html).run();
    flushSaveRef.current(editor.getHTML());
  }, [appendRequest?.token, appendRequest?.html, editor]);

  const btn = (active: boolean) =>
    `rounded-lg p-2 transition-colors ${
      active
        ? "bg-[var(--accent-bg)] text-[var(--accent)]"
        : "text-[var(--text-muted)] hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
    }`;

  const slashCommands = useMemo(
    () => [
      { label: "/ Heading 1", run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "/ Heading 2", run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "/ Bullet list", run: () => editor?.chain().focus().toggleBulletList().run() },
      { label: "/ Numbered list", run: () => editor?.chain().focus().toggleOrderedList().run() },
      { label: "/ Task list", run: () => editor?.chain().focus().toggleTaskList().run() },
      { label: "/ Quote", run: () => editor?.chain().focus().toggleBlockquote().run() },
      { label: "/ Code block", run: () => editor?.chain().focus().toggleCodeBlock().run() },
      { label: "/ Divider", run: () => editor?.chain().focus().setHorizontalRule().run() },
    ],
    [editor],
  );

  const openLinkPrompt = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="mt-2 min-h-[180px] animate-pulse rounded-xl border border-[var(--border)] bg-slate-100 dark:bg-white/5" />
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("underline"))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-pressed={editor.isActive("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/15" aria-hidden />
        <button
          type="button"
          title="Strikethrough (Ctrl+Shift+S)"
          className={btn(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Inline code (Ctrl+E)"
          className={btn(editor.isActive("code"))}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Highlight (Ctrl+Shift+H)"
          className={btn(editor.isActive("highlight"))}
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Insert link (Ctrl+K)"
          className={btn(editor.isActive("link"))}
          onClick={openLinkPrompt}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" aria-hidden />
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 2 }))}
          title="Heading 2 (Ctrl+Alt+2)"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 3 }))}
          title="Heading 3 (Ctrl+Alt+3)"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/15" aria-hidden />
        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          title="Bullet list (Ctrl+Shift+8)"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          title="Numbered list (Ctrl+Shift+7)"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Task list (Ctrl+Shift+9)"
          className={btn(editor.isActive("taskList"))}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="h-4 w-4" />
        </button>
      </div>
      <BubbleMenu editor={editor}>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-[var(--shadow-md)]">
          <button type="button" className={btn(editor.isActive("bold"))} title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></button>
          <button type="button" className={btn(editor.isActive("italic"))} title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></button>
          <button type="button" className={btn(editor.isActive("underline"))} title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></button>
          <button type="button" className={btn(editor.isActive("highlight"))} title="Highlight (Ctrl+Shift+H)" onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}><Highlighter className="h-4 w-4" /></button>
          <button type="button" className={btn(editor.isActive("link"))} title="Link (Ctrl+K)" onClick={openLinkPrompt}><Link2 className="h-4 w-4" /></button>
        </div>
      </BubbleMenu>
      <div
        className={
          scrollCapOnMobile ? "max-h-[min(40vh,320px)] overflow-y-auto lg:max-h-none" : ""
        }
      >
        <EditorContent editor={editor} />
      </div>
      {slashOpen ? (
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-2">
          <div className="mb-1 text-xs font-medium text-[var(--text-muted)]">Slash menu</div>
          <div className="grid gap-1 sm:grid-cols-2">
            {slashCommands.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                className="rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  cmd.run?.();
                  setSlashOpen(false);
                }}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
