"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faStrikethrough,
  faListUl,
  faListOl,
  faQuoteRight,
  faLink,
  faLinkSlash,
  faHeading,
  faRotateLeft,
  faRotateRight,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Commencez à écrire…",
  minHeight = 240,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-700",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-4 py-3 text-gray-900 bg-white rounded-b-lg",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien :", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={`border border-gray-300 rounded-lg bg-white ${className}`}
        style={{ minHeight }}
      />
    );
  }

  const btn = (active: boolean) =>
    `px-2.5 py-1.5 rounded text-sm transition-colors ${
      active
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div
      className={`border border-gray-300 rounded-lg bg-white overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
          title="Titre"
          aria-label="Titre niveau 2"
        >
          <FontAwesomeIcon icon={faHeading} />
          <span className="ml-1 text-xs">2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))}
          title="Sous-titre"
          aria-label="Titre niveau 3"
        >
          <FontAwesomeIcon icon={faHeading} />
          <span className="ml-1 text-xs">3</span>
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
          title="Gras (Ctrl+B)"
          aria-label="Gras"
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
          title="Italique (Ctrl+I)"
          aria-label="Italique"
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive("strike"))}
          title="Barré"
          aria-label="Barré"
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
          title="Liste à puces"
          aria-label="Liste à puces"
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
          title="Liste numérotée"
          aria-label="Liste numérotée"
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive("blockquote"))}
          title="Citation"
          aria-label="Citation"
        >
          <FontAwesomeIcon icon={faQuoteRight} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btn(editor.isActive("code"))}
          title="Code"
          aria-label="Code"
        >
          <FontAwesomeIcon icon={faCode} />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={setLink}
          className={btn(editor.isActive("link"))}
          title="Ajouter un lien"
          aria-label="Ajouter un lien"
        >
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className={btn(false)}
          title="Retirer le lien"
          aria-label="Retirer le lien"
          disabled={!editor.isActive("link")}
        >
          <FontAwesomeIcon icon={faLinkSlash} />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btn(false)}
          title="Annuler (Ctrl+Z)"
          aria-label="Annuler"
          disabled={!editor.can().undo()}
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btn(false)}
          title="Refaire"
          aria-label="Refaire"
          disabled={!editor.can().redo()}
        >
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
      </div>
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
