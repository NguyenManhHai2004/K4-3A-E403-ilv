"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GlobalNav() {
  const pathname = usePathname();
  const isClassroom = pathname?.startsWith("/classroom");

  return (
    <header className="global-nav">
      <div className="brand-group">
        <div className="brand-badge">AI</div>
        <div>
          <span className="brand-title">Multi-Agent Classroom</span>
          <span className="brand-sub">Prototype Mock v1.0 · Hackathon K4-3A</span>
        </div>
      </div>

      <div className="screen-switcher">
        <Link href="/" className={`switch-btn${!isClassroom ? " active" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          Màn hình Bài Giảng
        </Link>
        <Link href="/classroom" className={`switch-btn${isClassroom ? " active" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Multi-Agent Classroom
        </Link>
      </div>

      <div className="nav-actions">
        <div className="user-pill">
          <div className="user-avatar">HV</div>
          <span>Học viên AI20K</span>
        </div>
      </div>
    </header>
  );
}
