import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;

function ensureWorker() {
  if (workerConfigured) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  workerConfigured = true;
}

export async function loadPdf(objectUrl: string): Promise<PDFDocumentProxy> {
  ensureWorker();
  const loadingTask = pdfjsLib.getDocument(objectUrl);
  return loadingTask.promise;
}

export async function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement
): Promise<void> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.4 });
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
}
