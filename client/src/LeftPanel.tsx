import { useState } from "react";

type Mode = "docs" | "templates" | "snippets";

export function LeftPanel({
  mode,
  onChangeMode,
}: {
  mode: Mode;
  onChangeMode: (m: Mode) => void;
}) {
  return (
    <aside className="left-panel">
      <div className="left-tabs">
        <button className={mode === "docs" ? "active" : ""} onClick={() => onChangeMode("docs")}>
          docs
        </button>
        <button className={mode === "templates" ? "active" : ""} onClick={() => onChangeMode("templates")}>
          templates
        </button>
        <button className={mode === "snippets" ? "active" : ""} onClick={() => onChangeMode("snippets")}>
          questions
        </button>
      </div>
    </aside>
  );
}
