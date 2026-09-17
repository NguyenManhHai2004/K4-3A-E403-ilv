export type TranscriptBlockType = "h1" | "h2" | "quote" | "segment" | "paragraph";

export interface TranscriptBlock {
  type: TranscriptBlockType;
  citation?: string;
  html: string;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineFormat(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function parseTranscriptMarkdown(raw: string): TranscriptBlock[] {
  const lines = raw.split(/\r?\n/);
  const blocks: TranscriptBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const h1 = trimmed.match(/^#\s+(.*)/);
    if (h1) {
      blocks.push({ type: "h1", html: inlineFormat(h1[1]) });
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.*)/);
    if (h2) {
      blocks.push({ type: "h2", html: inlineFormat(h2[1]) });
      continue;
    }

    const quote = trimmed.match(/^>\s*(.*)/);
    if (quote) {
      blocks.push({ type: "quote", html: inlineFormat(quote[1]) });
      continue;
    }

    const segment = trimmed.match(/^\*\*\[([\w-]+)\]\*\*\s*(.*)/);
    if (segment) {
      blocks.push({ type: "segment", citation: segment[1], html: inlineFormat(segment[2]) });
      continue;
    }

    blocks.push({ type: "paragraph", html: inlineFormat(trimmed) });
  }

  return blocks;
}
