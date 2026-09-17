"use client";

import { PdfSlideStage } from "../lesson/PdfSlideStage";
import { SlideFooterNav } from "../lesson/SlideFooterNav";

interface LearningViewerProps {
  type: "slide" | "video";
  src: string;
  fallbackSrc?: string;
  pageIndex: number;
  pageCount: number;
  onPageCount: (count: number) => void;
  onPageChange: (nextPageIndex: number) => void;
}

export function LearningViewer({
  type,
  src,
  fallbackSrc,
  pageIndex,
  pageCount,
  onPageCount,
  onPageChange,
}: LearningViewerProps) {
  function changePage(delta: number) {
    const newIndex = pageIndex + delta;
    if (newIndex >= 0 && newIndex < pageCount) {
      onPageChange(newIndex);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-surface-elevated relative overflow-hidden">
      {type === "slide" ? (
        <div className="w-full h-full flex flex-col items-center p-6">
          <div className="slide-stage-canvas-shell flex-1 flex items-center justify-center w-full max-w-[960px]">
            <button
              className="btn-stage-nav prev"
              onClick={() => changePage(-1)}
              disabled={pageIndex === 0}
              aria-label="Slide trước"
            >
              ◀
            </button>
            <PdfSlideStage 
              objectUrl={src} 
              fallbackUrl={fallbackSrc}
              pageIndex={pageIndex} 
              onPageCount={onPageCount} 
            />
            <button
              className="btn-stage-nav next"
              onClick={() => changePage(1)}
              disabled={pageIndex === pageCount - 1}
              aria-label="Slide kế tiếp"
            >
              ▶
            </button>
          </div>
          <div className="mt-4">
            <SlideFooterNav
              index={pageIndex}
              total={pageCount}
              onPrev={() => changePage(-1)}
              onNext={() => changePage(1)}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black">
          <video 
            src={src} 
            controls 
            className="max-w-full max-h-full outline-none" 
            controlsList="nodownload"
          >
            Trình duyệt của bạn không hỗ trợ thẻ video.
          </video>
        </div>
      )}
    </div>
  );
}
