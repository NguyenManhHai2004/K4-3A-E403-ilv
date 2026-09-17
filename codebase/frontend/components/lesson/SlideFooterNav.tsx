interface SlideFooterNavProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function SlideFooterNav({ index, total, onPrev, onNext }: SlideFooterNavProps) {
  return (
    <div className="slide-footer-nav">
      <span className="slide-indicator">
        Slide {index + 1} / {total}
      </span>

      <div className="slide-controls">
        <button className="btn-slide-nav" onClick={onPrev} disabled={index === 0}>
          ◀ Slide trước
        </button>
        <button className="btn-slide-nav" onClick={onNext} disabled={index === total - 1}>
          Slide kế tiếp ▶
        </button>
      </div>
    </div>
  );
}
