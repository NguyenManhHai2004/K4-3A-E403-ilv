import { parseTranscriptMarkdown } from "@/lib/transcript-parser";

interface TranscriptPanelProps {
  raw: string;
}

export function TranscriptPanel({ raw }: TranscriptPanelProps) {
  if (!raw) {
    return (
      <div className="transcript-empty">
        Không tìm thấy file transcript trên máy này (thư mục <code>vlearn-pack/</code> không được commit lên repo —
        chỉ có trên máy local đã tải data pack).
      </div>
    );
  }

  const blocks = parseTranscriptMarkdown(raw);

  return (
    <div className="transcript-body">
      {blocks.map((block, i) => {
        if (block.type === "h1") {
          return (
            <h2 key={i} className="transcript-h1" dangerouslySetInnerHTML={{ __html: block.html }} />
          );
        }
        if (block.type === "h2") {
          return (
            <h3 key={i} className="transcript-h2" dangerouslySetInnerHTML={{ __html: block.html }} />
          );
        }
        if (block.type === "quote") {
          return (
            <div key={i} className="transcript-quote" dangerouslySetInnerHTML={{ __html: block.html }} />
          );
        }
        if (block.type === "segment") {
          return (
            <p key={i} className="transcript-segment">
              {block.citation && <span className="transcript-citation">{block.citation}</span>}
              <span dangerouslySetInnerHTML={{ __html: block.html }} />
            </p>
          );
        }
        return <p key={i} className="transcript-paragraph" dangerouslySetInnerHTML={{ __html: block.html }} />;
      })}
    </div>
  );
}
