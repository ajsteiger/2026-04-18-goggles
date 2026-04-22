import { useEffect, useMemo, useState } from "react";
import { api, type DocumentManifest, type Template } from "./api.js";
import { DocumentEditor } from "./DocumentEditor.js";

function fuzzyMatch(doc: DocumentManifest, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [doc.name, doc.baseTemplateId, doc.notes, ...doc.tags].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function DocsBrowser({
  onSelectDoc,
}: {
  onSelectDoc: (id: string | null) => void;
}) {
  const [docs, setDocs] = useState<DocumentManifest[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [query, setQuery] = useState("");
  const [autoFocusEditor, setAutoFocusEditor] = useState(false);

  async function refresh() {
    const [d, t] = await Promise.all([api.listDocuments(), api.listTemplates()]);
    setDocs(d);
    setTemplates(t);
    if (!newTemplateId && t.length) setNewTemplateId(t[0]?.id ?? "");
  }

  useEffect(() => { refresh(); }, []);

  async function create() {
    if (!newTemplateId) return;
    const name = newName.trim() || "Untitled";
    const d = await api.createDocument(newTemplateId, name);
    setNewName("");
    await refresh();
    setSelectedId(d.id);
    setAutoFocusEditor(true);
    onSelectDoc(d.id);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setAutoFocusEditor(false);
    onSelectDoc(id);
  }

  const filtered = useMemo(() => docs.filter((d) => fuzzyMatch(d, query)), [docs, query]);
  const selectedDoc = docs.find((d) => d.id === selectedId);

  return (
    <div className="browser">
      <div className="browser-sidebar">
        <div className="browser-toolbar browser-create-section">
          <div className="browser-toolbar-label">create document</div>
          <input
            type="text"
            placeholder="document name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <select value={newTemplateId} onChange={(e) => setNewTemplateId(e.target.value)}>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
          </select>
          <button onClick={create} disabled={!newTemplateId}>create</button>
        </div>
        <div className="browser-toolbar browser-filter-section">
          <div className="browser-toolbar-label">filter</div>
          <input
            type="search"
            placeholder="filter docs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="browser-list">
          {filtered.map((d) => (
            <li
              key={d.id}
              className={d.id === selectedId ? "active" : ""}
              onClick={() => handleSelect(d.id)}
            >
              <div className="name">{d.name}</div>
              {d.tags.length > 0 && (
                <div className="tags">{d.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
              )}
              <div className="meta">{d.baseTemplateId}</div>
            </li>
          ))}
          {filtered.length === 0 && <li className="empty">no matches</li>}
        </ul>
      </div>
      <div className="browser-content">
        {selectedId && selectedDoc ? (
          <DocumentEditor
            id={selectedId}
            baseTemplateId={selectedDoc.baseTemplateId}
            autoFocusEditor={autoFocusEditor}
            onFocused={() => setAutoFocusEditor(false)}
            onForked={async (nextId) => {
              await refresh();
              setSelectedId(nextId);
            }}
          />
        ) : (
          <div className="empty">select or create a document</div>
        )}
      </div>
    </div>
  );
}
