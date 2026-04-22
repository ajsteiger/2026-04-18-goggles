import { useEffect, useState } from "react";

export function TagEditor({
  tags,
  onChange,
  placeholder = "add tag…",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [tags]);

  function commit(raw: string) {
    const next = raw.trim();
    if (!next) return;
    const key = next.toLowerCase();
    if (tags.some((tag) => tag.toLowerCase() === key)) {
      setValue("");
      return;
    }
    onChange([...tags, next]);
    setValue("");
  }

  function remove(tag: string) {
    onChange(tags.filter((current) => current !== tag));
  }

  return (
    <div className="tag-editor">
      <div className="tag-editor-badges">
        {tags.map((tag) => (
          <button key={tag} type="button" className="tag tag-editable" onClick={() => remove(tag)}>
            <span>{tag}</span>
            <span className="tag-remove">×</span>
          </button>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next.includes(",")) {
              const [first, ...rest] = next.split(",");
              commit(first);
              setValue(rest.join(","));
              return;
            }
            setValue(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(value);
            }
            if (e.key === "Backspace" && !value && tags.length > 0) {
              e.preventDefault();
              remove(tags[tags.length - 1]);
            }
          }}
          onBlur={() => commit(value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
