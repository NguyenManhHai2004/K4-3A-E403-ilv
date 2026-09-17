"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, renderPdfPage } from "@/lib/pdf";

interface PdfSlideStageProps {
  objectUrl: string;
  pageIndex: number;
  onPageCount: (count: number) => void;
}

export function PdfSlideStage({ objectUrl, pageIndex, onPageCount }: PdfSlideStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    loadPdf(objectUrl).then((doc) => {
      if (cancelled) return;
      docRef.current = doc;
      onPageCount(doc.numPages);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectUrl]);

  useEffect(() => {
    if (!ready || !docRef.current || !canvasRef.current) return;
    renderPdfPage(docRef.current, pageIndex + 1, canvasRef.current);
  }, [ready, pageIndex]);

  return (
    <div className="slide-canvas" style={{ alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} className="pdf-page-canvas" />
    </div>
  );
}
