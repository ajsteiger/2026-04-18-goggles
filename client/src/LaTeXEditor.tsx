import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorSelection } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";

const latexLang = StreamLanguage.define(stex);

export function LaTeXEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = "120px",
  autoFocus = false,
  compactSingleLine = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  autoFocus?: boolean;
  compactSingleLine?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const extensions = useMemo(() => {
    if (!compactSingleLine) return [latexLang, EditorView.lineWrapping];
    return [
      latexLang,
      EditorView.lineWrapping,
      keymap.of([
        {
          key: "Enter",
          run: () => true,
          shift: ({ state, dispatch }) => {
            dispatch(state.update(state.replaceSelection("\n"), {
              selection: EditorSelection.cursor(state.selection.main.from + 1),
              scrollIntoView: true,
            }));
            return true;
          },
        },
      ]),
    ];
  }, [compactSingleLine]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => {
      const target = hostRef.current?.querySelector<HTMLDivElement>(".cm-content");
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  return (
    <div ref={hostRef} className="latex-editor" style={{ minHeight }}>
      <CodeMirror
        value={value}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{ lineNumbers: true, foldGutter: false }}
        theme="light"
        height={minHeight}
      />
    </div>
  );
}
