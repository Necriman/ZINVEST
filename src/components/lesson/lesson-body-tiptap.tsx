"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Code,
  Code2,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightboxProvider } from "@/components/ui/image-lightbox-provider";

const editorRootClass = cn(
  "lesson-inline-editor w-full",
  "min-h-[2rem] border-0 !border-transparent shadow-none ring-0 outline-none",
  "px-0 py-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none",
  "text-[var(--text-primary)]",
  "[&_p]:text-[15px] [&_p]:leading-[1.65] [&_p]:text-[var(--text-tertiary)]",
  "[&_h1]:mb-1 [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[var(--text-primary)]",
  "[&_h1:first-child]:mt-0",
  "[&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--text-primary)]",
  "[&_h2:first-child]:mt-0",
  "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)]",
  "[&_h3:first-child]:mt-0",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--border)] [&_blockquote]:pl-3 [&_blockquote]:text-[var(--text-secondary)]",
  "[&_code]:rounded [&_code]:bg-slate-200/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] dark:[&_code]:bg-white/10",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-slate-100",
  "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:cursor-zoom-in [&_img]:transition-opacity [&_img]:hover:opacity-90",
  "[&_img]:my-3 [&_img]:block [&_img]:border [&_img]:border-[var(--border)]",
);

type SlashCmd = { id: string; label: string; run: (ed: Editor) => void; icon: ReactNode };

function useBlockCommands() {
  return useMemo((): SlashCmd[] => {
    return [
      { id: "p", label: "Paragraph", icon: <Pilcrow className="h-4 w-4" />, run: (ed) => ed.chain().focus().setParagraph().run() },
      { id: "h1", label: "Heading 1", icon: <Type className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
      { id: "h2", label: "Heading 2", icon: <Type className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
      { id: "h3", label: "Heading 3", icon: <Type className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
      { id: "ul", label: "Bullet list", icon: <List className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleBulletList().run() },
      { id: "ol", label: "Numbered list", icon: <ListOrdered className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleOrderedList().run() },
      { id: "quote", label: "Quote", icon: <Quote className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleBlockquote().run() },
      { id: "code", label: "Code block", icon: <Code2 className="h-4 w-4" />, run: (ed) => ed.chain().focus().toggleCodeBlock().run() },
      {
        id: "image",
        label: "Image (URL)",
        icon: <ImageIcon className="h-4 w-4" />,
        run: (ed) => {
          const url = window.prompt("Image URL (https://…):");
          if (url?.trim()) ed.chain().focus().setImage({ src: url.trim() }).run();
        },
      },
      { id: "hr", label: "Divider", icon: <Minus className="h-4 w-4" />, run: (ed) => ed.chain().focus().setHorizontalRule().run() },
    ];
  }, []);
}

function MenuButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "relative rounded-md p-1.5 text-[var(--text-muted)] transition-colors",
        active
          ? "bg-[var(--accent-bg)] text-[var(--accent)]"
          : "hover:bg-slate-200/80 hover:text-[var(--text-primary)] dark:hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

type Props = {
  initialHtml: string;
  onDocumentChange: (html: string, plainText: string) => void;
  placeholder: string;
  /** Sticky formatting strip (Notion / Lex style) in addition to bubble/slash menus */
  showTopToolbar?: boolean;
  /** e.g. zinc-800 for dark course pages */
  toolbarSurfaceClassName?: string;
};

export function LessonBodyTiptap({
  initialHtml,
  onDocumentChange,
  placeholder,
  showTopToolbar = false,
  toolbarSurfaceClassName = "bg-[var(--bg-secondary)] border border-[var(--border)]",
}: Props) {
  const [slashPos, setSlashPos] = useState<{ x: number; y: number } | null>(null);
  const blockCommands = useBlockCommands();
  const skipFirstUpdate = useRef(true);

  const onUpdateCallback = useCallback(
    (ed: Editor) => {
      onDocumentChange(
        ed.getHTML(),
        ed.getText({ blockSeparator: "\n\n" }),
      );
    },
    [onDocumentChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder, showOnlyWhenEditable: true, showOnlyCurrent: true }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: editorRootClass, spellcheck: "true" },
      handleKeyDown: (view, event) => {
        if (event.key === "Escape") {
          setSlashPos(null);
          return false;
        }
        if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const { state } = view;
          const { $from, empty } = state.selection;
          if (empty && $from.parent.type.name === "paragraph") {
            const start = $from.start();
            const posInBlock = state.selection.from - start;
            if (posInBlock === 0) {
              event.preventDefault();
              const coords = view.coordsAtPos(state.selection.from);
              setSlashPos({ x: coords.left, y: coords.bottom + 4 });
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipFirstUpdate.current) {
        skipFirstUpdate.current = false;
        return;
      }
      onUpdateCallback(ed);
    },
  });

  const openLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url.trim() }).run();
  }, [editor]);

  useEffect(() => {
    if (!slashPos) return;
    const h = (e: MouseEvent) => {
      const el = e.target;
      if (el instanceof Element && el.closest("[data-lesson-slash-menu]")) return;
      setSlashPos(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [slashPos]);

  if (!editor) {
    return <div className="min-h-[4rem] animate-pulse rounded-lg bg-slate-200/30 dark:bg-white/5" aria-hidden />;
  }

  return (
    <div className="relative w-full" data-lesson-tiptap-root>
      {showTopToolbar ? (
        <div
          className={cn(
            "sticky top-0 z-10 -mx-1 mb-3 flex flex-wrap items-center gap-0.5 rounded-xl px-1 py-1.5",
            toolbarSurfaceClassName,
          )}
        >
          <select
            className="h-8 max-w-[7.5rem] rounded-md border-0 bg-transparent text-xs text-[var(--text-primary)] outline-none"
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              if (v === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
              if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
              if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : "p"
            }
            aria-label="Block type"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <span className="mx-0.5 h-5 w-px bg-[var(--border)]" />
          <MenuButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
          <span className="mx-0.5 h-5 w-px bg-[var(--border)]" />
          <MenuButton title="Link" active={editor.isActive("link")} onClick={openLink}>
            <Link2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}
          >
            <Highlighter className="h-4 w-4" />
          </MenuButton>
          <span className="mx-0.5 h-5 w-px bg-[var(--border)]" />
          <MenuButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MenuButton title="Code" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-4 w-4" />
          </MenuButton>
        </div>
      ) : null}
      <BubbleMenu editor={editor} options={{ placement: "top-start" }}>
        <div className="flex max-w-[min(100vw-1rem,380px)] flex-wrap items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-md">
          <MenuButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}
          >
            <Highlighter className="h-4 w-4" />
          </MenuButton>
          <MenuButton title="Link" active={editor.isActive("link")} onClick={openLink}>
            <Link2 className="h-4 w-4" />
          </MenuButton>
          <span className="mx-0.5 h-5 w-px bg-[var(--border)]" />
          <MenuButton
            title="H1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <span className="px-0.5 text-xs font-bold">H1</span>
          </MenuButton>
          <MenuButton
            title="H2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <span className="px-0.5 text-xs font-bold">H2</span>
          </MenuButton>
          <MenuButton
            title="H3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <span className="px-0.5 text-xs font-bold">H3</span>
          </MenuButton>
          <span className="mx-0.5 h-5 w-px bg-[var(--border)]" />
          <MenuButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            title="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="h-4 w-4" />
          </MenuButton>
        </div>
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        updateDelay={100}
        shouldShow={({ state }) => {
          const { $from, empty } = state.selection;
          if (!empty) return false;
          return $from.parent.type.name === "paragraph" && $from.parent.content.size === 0;
        }}
        options={{ placement: "left-start" }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!editor) return;
            const { view } = editor;
            const coords = view.coordsAtPos(editor.state.selection.from);
            setSlashPos({ x: coords.left, y: coords.bottom + 4 });
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] shadow-sm hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
          aria-label="Add block"
        >
          <Plus className="h-4 w-4" />
        </button>
      </FloatingMenu>

      <ImageLightboxProvider>
        <EditorContent
          editor={editor}
          className="border-0 !border-transparent shadow-none ring-0 outline-none focus-within:outline-none [&:focus-within]:ring-0"
        />
      </ImageLightboxProvider>

      {typeof document !== "undefined" && slashPos
        ? createPortal(
            <div
              data-lesson-slash-menu
              className="fixed z-[200] w-[min(100vw-1rem,300px)] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-lg"
              style={{ left: slashPos.x, top: slashPos.y }}
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Blocks</p>
              <ul className="max-h-56 overflow-y-auto">
                {blockCommands.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-slate-200/60 dark:hover:bg-white/10"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        c.run(editor);
                        setSlashPos(null);
                      }}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
