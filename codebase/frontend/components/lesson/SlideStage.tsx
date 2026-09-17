import type { Slide } from "@/lib/types";

interface SlideStageProps {
  slide: Slide;
}

export function SlideStage({ slide }: SlideStageProps) {
  return (
    <div className="slide-canvas">
      <div>
        <span className="slide-header-tag">📖 {slide.tag}</span>
        <h2 className="slide-title">{slide.title}</h2>
        <div className="slide-body" dangerouslySetInnerHTML={{ __html: slide.body }} />
      </div>
    </div>
  );
}
