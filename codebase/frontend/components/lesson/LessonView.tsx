"use client";

import { useState } from "react";
import Link from "next/link";
import { slidesData } from "@/lib/mock-data";
import { LessonSidebar } from "./LessonSidebar";
import { SlideStage } from "./SlideStage";
import { SlideFooterNav } from "./SlideFooterNav";
import { useToast } from "@/components/ui/ToastProvider";

export function LessonView() {
  const [activeLesson, setActiveLesson] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const { showToast } = useToast();

  function changeSlide(delta: number) {
    const newIndex = slideIndex + delta;
    if (newIndex >= 0 && newIndex < slidesData.length) {
      setSlideIndex(newIndex);
    }
  }

  function handleSelectLesson(num: number) {
    setActiveLesson(num);
    if (num === 1) setSlideIndex(0);
  }

  return (
    <main className="view-container lesson-view active-view">
      <LessonSidebar activeLesson={activeLesson} onSelectLesson={handleSelectLesson} />

      <section className="lesson-main">
        <div className="lesson-content-header">
          <div>
            <div className="lesson-breadcrumb">
              <span>Khóa học AI</span> / <span>Module 1</span> / <span>Bài 01</span>
            </div>
            <h1 className="lesson-main-title">Bài 1: Cơ chế Attention và Kiến trúc Transformer</h1>
          </div>

          <Link
            href="/classroom"
            className="btn-enter-classroom"
            onClick={() => showToast("✨ Đã vào chế độ Multi-Agent Classroom!")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Bật Multi-Agent Classroom (3 AI Agents)
          </Link>
        </div>

        <div className="slide-stage-wrapper">
          <SlideStage slide={slidesData[slideIndex]} />
          <SlideFooterNav
            index={slideIndex}
            total={slidesData.length}
            onPrev={() => changeSlide(-1)}
            onNext={() => changeSlide(1)}
          />
        </div>
      </section>
    </main>
  );
}
