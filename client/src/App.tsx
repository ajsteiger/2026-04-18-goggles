import { useState } from "react";
import { LeftPanel } from "./LeftPanel.js";
import { DocsBrowser } from "./DocsBrowser.js";
import { TemplateBrowser, SnippetBrowser } from "./ItemBrowser.js";
import { PreviewPanel } from "./PreviewPanel.js";

type Mode = "docs" | "templates" | "snippets";

export function App() {
  const [mode, setMode] = useState<Mode>("docs");
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  return (
    <div className={mode === "docs" ? "app" : "app no-preview"}>
      <LeftPanel mode={mode} onChangeMode={setMode} />
      <main className="main">
        {mode === "docs" && <DocsBrowser onSelectDoc={setActiveDocId} />}
        {mode === "templates" && <TemplateBrowser />}
        {mode === "snippets" && <SnippetBrowser />}
      </main>
      {mode === "docs" && <PreviewPanel docId={activeDocId} />}
    </div>
  );
}
