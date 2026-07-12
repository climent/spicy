/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Sparkles,
  MoveLeft,
  MoveRight,
  MousePointerClick,
  AlertTriangle,
} from "lucide-react";
import {
  Slide,
  SlideElement,
  SlideTheme,
  ElementType,
  MIN_FONT_SIZE,
} from "../types";
import { formatPublishedDate } from "../utils/dateFormatter";

interface SlideCanvasProps {
  slides: Slide[];
  activeSlideIndex: number;
  selectedElementId: string | null;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (index: number, direction: "left" | "right") => void;
  onSelectElement: (id: string | null) => void;
  onAddElementToActiveSlide: (type: ElementType) => void;
  onApplyTemplateToActiveSlide: (templateType: string) => void;
  metaTitle: string;
  metaCreator: string;
  metaDept: string;
  metaRef: string;
  isExporting?: boolean;
  isArchived: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function SlideCanvas({
  slides,
  activeSlideIndex,
  selectedElementId,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onSelectElement,
  onAddElementToActiveSlide,
  onApplyTemplateToActiveSlide,
  metaTitle,
  metaCreator,
  metaDept,
  metaRef,
  isExporting,
  isArchived,
  isDarkMode = false,
  onToggleDarkMode,
}: SlideCanvasProps) {
  const activeSlide = slides[activeSlideIndex] || slides[0];
  const theme = activeSlide?.theme;
  const elements = activeSlide?.elements || [];

  const [isDragOver, setIsDragOver] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const elementStackRef = useRef<HTMLDivElement>(null);

  const checkOverflow = () => {
    if (elementStackRef.current) {
      const el = elementStackRef.current;
      // Use an 8px buffer to avoid subpixel calculation mismatches, scrollbar width fluctuations, or minor padding differences
      const hasVerticalOverflow = el.scrollHeight > el.clientHeight + 8;
      const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 8;
      setIsOverflowing(hasVerticalOverflow || hasHorizontalOverflow);
    }
  };

  useEffect(() => {
    checkOverflow();
    if (elementStackRef.current && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        checkOverflow();
      });
      observer.observe(elementStackRef.current);
      return () => observer.disconnect();
    }
  }, [elements, activeSlide?.id, theme]);

  if (!activeSlide || !theme) return null;

  // Handle drops
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isArchived) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isArchived) return;

    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;

      const data = JSON.parse(dataStr);
      if (data.dragType === "element") {
        onAddElementToActiveSlide(data.type);
      } else if (data.dragType === "template") {
        onApplyTemplateToActiveSlide(data.template);
      }
    } catch (err) {
      console.error("Error handling drag and drop drop event", err);
    }
  };

  const getFontClass = (fontFamily: SlideTheme["fontFamily"]) => {
    switch (fontFamily) {
      case "Space Grotesk":
        return "font-space-grotesk";
      case "JetBrains Mono":
        return "font-jetbrains-mono";
      case "Playfair Display":
        return "font-playfair-display";
      case "Inter":
      default:
        return "font-inter";
    }
  };

  return (
    <div
      id="canvas-workspace"
      className="flex-1 bg-slate-50 flex flex-col items-center justify-between p-6 overflow-y-auto overflow-x-hidden select-none h-full"
    >
      {/* Top action bar */}
      <div
        id="canvas-header"
        className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex items-center justify-between mb-2"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Interactive Preview
          </span>
          <h2 className="text-sm font-bold text-slate-800 truncate max-w-md">
            {metaTitle || "Untitled Presentation"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Deck ordering controls */}
          <div id="deck-slide-counter-container" className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button
              id="deck-move-left-btn"
              disabled={activeSlideIndex === 0}
              onClick={() => onMoveSlide(activeSlideIndex, "left")}
              className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 rounded-lg cursor-pointer transition-all"
              title="Move Slide Backward"
            >
              <MoveLeft className="w-3.5 h-3.5" />
            </button>
            <span id="deck-slide-counter" className="text-[11px] font-bold px-2 text-slate-600">
              Slide {activeSlideIndex + 1} of {slides.length}
            </span>
            <button
              id="deck-move-right-btn"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => onMoveSlide(activeSlideIndex, "right")}
              className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 rounded-lg cursor-pointer transition-all"
              title="Move Slide Forward"
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="deck-duplicate-btn"
            onClick={() => onDuplicateSlide(activeSlideIndex)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>

          <button
            id="deck-delete-btn"
            disabled={slides.length <= 1}
            onClick={() => onDeleteSlide(activeSlideIndex)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Widescreen (16:9) Slide Area */}
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex-1 flex items-center justify-center relative min-h-[360px] my-2">
        {/* Dynamic Overflow Warning Banner positioned absolutely so it does not displace layout */}
        {isOverflowing && (
          <div
            id="canvas-overflow-alert"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-amber-50/95 backdrop-blur border border-amber-200 rounded-xl p-2.5 flex items-center gap-2.5 shadow-lg text-amber-800 transition-all"
          >
            <div className="p-1 bg-amber-100 rounded-lg text-amber-600 animate-bounce shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-none mb-0.5">
                Content Exceeds Slide Canvas Bounds
              </span>
              <p className="text-[10px] text-amber-600 leading-normal">
                An element (e.g. paragraph or bullet list) is overflowing the
                available slide area. Consider shrinking its font size,
                adjusting alignments, or reducing content to maintain clear
                layout readability.
              </p>
            </div>
          </div>
        )}

        <div
          id={`slide-render-${activeSlide.id}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`aspect-video w-full shadow-2xl rounded-2xl relative overflow-hidden transition-all duration-200 flex flex-col justify-between p-12 slide-shadow ${getFontClass(theme.fontFamily)}`}
          style={{
            backgroundColor: theme.background,
            color: theme.text,
            border:
              theme.cardStyle === "bordered"
                ? "2px solid rgba(0,0,0,0.08)"
                : "none",
            boxShadow:
              theme.cardStyle === "shadow"
                ? "0 25px 50px -12px rgba(0,0,0,0.15)"
                : "none",
          }}
        >
          {/* Metadata Header Band */}
          <div
            id="slide-metadata-header"
            className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-60 tracking-wider mb-2 border-b pb-2"
            style={{ borderColor: `${theme.accent}30` }}
          >
            <span className="truncate max-w-[200px]">
              {metaDept || (isExporting ? "" : "DEPARTMENT")}
            </span>
            <span className="truncate max-w-[200px]">
              {metaRef || (isExporting ? "" : "CREATOR NAME")}
            </span>
          </div>

          {/* Core Content Elements Workspace Stack */}
          <div
            id="slide-element-stack"
            ref={elementStackRef}
            className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0 select-none scrollbar-thin px-3"
          >
            <div
              className={`flex flex-col gap-4 py-3 w-full ${activeSlide.contentAlign === "top" ? "mb-auto" : activeSlide.contentAlign === "bottom" ? "mt-auto" : "my-auto"}`}
            >
              {elements.length === 0 ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all min-h-[160px]"
                  style={{ borderColor: `${theme.accent}30` }}
                >
                  <MousePointerClick className="w-8 h-8 opacity-40 mb-2 text-indigo-500 animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wide opacity-50">
                    Drag Template or Elements here
                  </span>
                  <span className="text-[10px] opacity-40 text-center max-w-[260px] mt-1">
                    Use the left builder sidebar to layout your
                    accessibility-locked slide content.
                  </span>
                </div>
              ) : (
                elements.map((el, index) => {
                  const isSelected = el.id === selectedElementId;

                  return (
                    <div
                      id={`canvas-element-${el.id}`}
                      key={el.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(el.id);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer relative transition-all group border ${
                        isSelected
                          ? "border-indigo-500 bg-black/5 ring-1 ring-indigo-500"
                          : "border-transparent hover:bg-black/5"
                      }`}
                    >
                      {/* Visual Hover Badge */}
                      <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-all bg-indigo-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow z-10 select-none">
                        {el.type.toUpperCase()} ({el.fontSize}pt)
                      </div>

                      {/* Render exact element styles conforming to strict >= 20pt */}
                      {el.type === "title" && (
                        <h2
                          id={`render-title-${el.id}`}
                          className="font-bold tracking-tight leading-snug"
                          style={{
                            fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                            color: el.color || theme.text,
                            textAlign: el.align,
                          }}
                        >
                          {el.content || "Click to edit title text"}
                        </h2>
                      )}

                      {el.type === "subtitle" && (
                        <h3
                          id={`render-subtitle-${el.id}`}
                          className="font-semibold uppercase tracking-wider"
                          style={{
                            fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                            color: el.color || theme.accent,
                            textAlign: el.align,
                          }}
                        >
                          {el.content || "Supporting presentation subtitle"}
                        </h3>
                      )}

                      {el.type === "paragraph" && (
                        <p
                          id={`render-paragraph-${el.id}`}
                          className="leading-relaxed opacity-90 whitespace-pre-wrap font-medium"
                          style={{
                            fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                            color: el.color || theme.text,
                            textAlign: el.align,
                          }}
                        >
                          {el.content ||
                            "Insert clear narrative slides here. Enforcing a minimum text size of 20pt ensures perfect legibility for distant presentation displays."}
                        </p>
                      )}

                      {el.type === "bulletList" && (
                        <ul
                          id={`render-bullets-${el.id}`}
                          className="space-y-2.5 list-none"
                          style={{ textAlign: el.align }}
                        >
                          {(el.listItems || []).map((item, bIdx) => (
                            <li
                              id={`render-bullet-li-${bIdx}`}
                              key={bIdx}
                              className="flex items-start gap-3"
                              style={{
                                fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                                color: el.color || theme.text,
                                justifyContent:
                                  el.align === "center"
                                    ? "center"
                                    : el.align === "right"
                                      ? "flex-end"
                                      : "flex-start",
                              }}
                            >
                              <span
                                className="shrink-0 font-bold"
                                style={{ color: theme.accent }}
                              >
                                •
                              </span>
                              <span className="font-semibold">
                                {item || "Empty bullet item"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {el.type === "quote" && (
                        <div
                          id={`render-quote-${el.id}`}
                          className="flex gap-4 py-1"
                          style={{
                            justifyContent:
                              el.align === "center"
                                ? "center"
                                : el.align === "right"
                                  ? "flex-end"
                                  : "flex-start",
                          }}
                        >
                          <div
                            className="w-1.5 rounded shrink-0"
                            style={{ backgroundColor: theme.accent }}
                          />
                          <div
                            className="italic font-medium leading-relaxed"
                            style={{
                              fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                              color: el.color || theme.text,
                              textAlign: el.align,
                            }}
                          >
                            "
                            {el.content ||
                              "Designing for accessibility guarantees that we reach everyone."}
                            "
                          </div>
                        </div>
                      )}

                      {el.type === "stat" && (
                        <div
                          id={`render-stat-${el.id}`}
                          className="flex flex-col"
                          style={{
                            alignItems:
                              el.align === "center"
                                ? "center"
                                : el.align === "right"
                                  ? "flex-end"
                                  : "flex-start",
                          }}
                        >
                          <div
                            className="font-bold tracking-tight leading-none mb-1"
                            style={{
                              fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize * 1.8)}px`,
                              color:
                                el.headingColor || el.color || theme.accent,
                            }}
                          >
                            {el.statNumber || "100%"}
                          </div>
                          <div
                            className="font-bold uppercase tracking-wide opacity-80"
                            style={{
                              fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                              color: el.color || theme.text,
                            }}
                          >
                            {el.statLabel || "Compliance Verified"}
                          </div>
                        </div>
                      )}

                      {el.type === "grid" && (
                        <div
                          id={`render-grid-${el.id}`}
                          className="grid grid-cols-2 gap-6 w-full"
                          style={{
                            textAlign: el.align,
                          }}
                        >
                          {(el.gridItems || []).map((col) => (
                            <div
                              id={`render-grid-col-${col.id}`}
                              key={col.id}
                              className="p-4 rounded-xl border flex flex-col gap-1"
                              style={{
                                borderColor: `${theme.accent}25`,
                                backgroundColor: `${theme.background === "#ffffff" ? "#f9fafb" : "#1e293b"}aa`,
                              }}
                            >
                              <h4
                                className="font-bold"
                                style={{
                                  fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize * 1.15)}px`,
                                  color:
                                    el.headingColor || el.color || theme.accent,
                                }}
                              >
                                {col.title || "Grid Heading"}
                              </h4>
                              <p
                                className="opacity-90 font-medium"
                                style={{
                                  fontSize: `${Math.max(MIN_FONT_SIZE, el.fontSize)}px`,
                                  color: el.color || theme.text,
                                }}
                              >
                                {col.desc ||
                                  "Grid detailed information description."}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {el.type === "image" && (
                        <div
                          id={`render-image-${el.id}`}
                          className="flex w-full"
                          style={{
                            justifyContent:
                              el.align === "center"
                                ? "center"
                                : el.align === "right"
                                  ? "flex-end"
                                  : "flex-start",
                          }}
                        >
                          {el.imageUrl ? (
                            <div
                              className="relative overflow-visible transition-all"
                              style={{ width: `${el.imageWidth || 60}%` }}
                            >
                              <img
                                src={el.imageUrl}
                                alt={
                                  el.imageAlt ||
                                  "Accessible presentation graphic"
                                }
                                referrerPolicy="no-referrer"
                                className="w-full h-auto object-contain max-h-[240px] sm:max-h-[300px] md:max-h-[320px]"
                              />
                            </div>
                          ) : (
                            <div
                              className="p-6 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 bg-slate-50/50"
                              style={{
                                borderColor: `${theme.accent}40`,
                                width: `${el.imageWidth || 60}%`,
                              }}
                            >
                              <span className="text-[11px] font-bold uppercase tracking-wide opacity-50">
                                No Image Loaded
                              </span>
                              <span className="text-[9px] opacity-40 text-center">
                                Use the Canvas Inspector to upload or choose an
                                image
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Metadata Footer Band */}
          <div
            id="slide-metadata-footer"
            className="flex items-center justify-between text-[11px] font-bold uppercase opacity-60 tracking-wider mt-2 border-t pt-2"
            style={{ borderColor: `${theme.accent}30` }}
          >
            <span className="truncate max-w-[250px]">
              {metaCreator || formatPublishedDate(new Date())}
            </span>
            <span>
              SLIDE {activeSlideIndex + 1} OF {slides.length}
            </span>
          </div>

          {/* Drag over Visual Overlay */}
          {isDragOver && (
            <div
              id="drag-over-overlay"
              className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[1px] border-4 border-dashed border-indigo-500 rounded-2xl flex flex-col items-center justify-center gap-2 z-50 select-none pointer-events-none animate-pulse"
            >
              <div className="p-3 bg-white rounded-full shadow-lg text-indigo-600 animate-bounce">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-sm font-bold text-indigo-800 bg-white/90 px-3 py-1.5 rounded-full shadow uppercase tracking-wide">
                Drop to Apply Layout Item
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails Filmstrip list */}
      <div
        id="deck-filmstrip"
        className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm shrink-0"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />{" "}
            Widescreen Presentation Filmstrip
          </span>
          <button
            id="filmstrip-add-slide-btn"
            disabled={isArchived}
            onClick={onAddSlide}
            className="flex items-center gap-1 py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3 h-3" /> Add Slide
          </button>
        </div>

        <div
          id="filmstrip-slides-list"
          className="flex items-center gap-2 overflow-x-auto py-1.5 px-2"
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlideIndex;
            const slideFontClass = getFontClass(slide.theme.fontFamily);

            return (
              <div
                id={`filmstrip-slide-card-${idx}`}
                key={slide.id}
                onClick={() => {
                  onSelectSlide(idx);
                  onSelectElement(null); // Clear element selection on slide change
                }}
                className={`h-16 aspect-video rounded-xl border transition-all duration-150 p-2 flex flex-col justify-between shrink-0 cursor-pointer overflow-hidden relative ${
                  isActive
                    ? "ring-2 ring-indigo-600 border-transparent shadow-md"
                    : "border-slate-200 hover:border-slate-400"
                } ${slideFontClass}`}
                style={{
                  backgroundColor: slide.theme.background,
                  color: slide.theme.text,
                }}
              >
                <div className="text-[7px] font-bold truncate max-w-[65px] opacity-70">
                  {slide.elements[0]?.content ||
                    slide.elements[0]?.title ||
                    `Slide ${idx + 1}`}
                </div>

                <div className="flex items-end justify-between text-[6px] font-extrabold opacity-60">
                  <span>S{idx + 1}</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                    <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Build Version Tag */}
      <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl flex justify-end px-1 mt-1 shrink-0">
        <span
          id="preview-build-version"
          className="text-[10px] font-mono text-slate-400 select-none pointer-events-none opacity-60"
        >
          {((import.meta as any).env?.VITE_COMMIT_HASH) || "dev"}
        </span>
      </div>
    </div>
  );
}
