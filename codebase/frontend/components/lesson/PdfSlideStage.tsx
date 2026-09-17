"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, renderPdfPage } from "@/lib/pdf";

interface PdfSlideStageProps {
  objectUrl: string;
  fallbackUrl?: string;
  pageIndex: number;
  onPageCount: (count: number) => void;
}

export function PdfSlideStage({ objectUrl, fallbackUrl, pageIndex, onPageCount }: PdfSlideStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function loadDocument() {
      try {
        const doc = await loadPdf(objectUrl);
        if (cancelled) return;
        docRef.current = doc;
        onPageCount(doc.numPages);
        setError(null);
        setReady(true);
        return;
      } catch (primaryError) {
        if (!fallbackUrl || fallbackUrl === objectUrl) {
          if (!cancelled) {
            setError(primaryError instanceof Error ? primaryError.message : "Không tải được slide PDF.");
          }
          return;
        }
      }

      try {
        const doc = await loadPdf(fallbackUrl);
        if (cancelled) return;
        docRef.current = doc;
        onPageCount(doc.numPages);
        setError(null);
        setReady(true);
      } catch (fallbackError) {
        if (!cancelled) {
          setError(fallbackError instanceof Error ? fallbackError.message : "Không tải được slide PDF.");
        }
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackUrl, objectUrl]);

  useEffect(() => {
    if (!ready || !docRef.current || !canvasRef.current) return;
    renderPdfPage(docRef.current, pageIndex + 1, canvasRef.current);
  }, [ready, pageIndex]);

  if (error) {
    return (
      <div className="slide-canvas">
        <div className="transcript-empty" style={{ maxWidth: 480, textAlign: "center" }}>
          Không tải được slide PDF. {error}
        </div>
      </div>
    );
  }

  return (
    <div className="slide-canvas" style={{ alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} className="pdf-page-canvas" />
    </div>
  );
}
