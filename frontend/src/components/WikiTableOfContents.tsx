import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import { extractTocEntries, type TocEntry } from "../utils/contentHtml";

type WikiTableOfContentsProps = {
  html: string;
  className?: string;
};

function TocList({ entries }: { entries: TocEntry[] }) {
  return (
    <nav className="wiki-toc" aria-label="Оглавление">
      <Typography variant="subtitle2" className="wiki-toc-title" component="h2">
        Оглавление
      </Typography>
      <ul className="wiki-toc-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`wiki-toc-item wiki-toc-item--h${entry.level}`}>
            <a href={`#${entry.id}`} className="wiki-toc-link">
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function WikiTableOfContents({ html, className }: WikiTableOfContentsProps) {
  const entries = useMemo(() => extractTocEntries(html), [html]);

  if (entries.length < 2) {
    return null;
  }

  return (
    <div className={className}>
      <TocList entries={entries} />
    </div>
  );
}

export function WikiInlineToc({ html }: { html: string }) {
  const entries = useMemo(() => extractTocEntries(html), [html]);
  if (entries.length === 0) {
    return null;
  }
  return <TocList entries={entries} />;
}
