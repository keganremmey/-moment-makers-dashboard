// Session summaries in the seed use a tiny subset of markdown — **bold**
// and *italic* only, no links/lists/headings — so a full markdown
// dependency would be overkill. This escapes HTML first (defense in depth;
// the data is our own seed, not arbitrary user input) then converts just
// those two inline forms to HTML for use with dangerouslySetInnerHTML.

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
