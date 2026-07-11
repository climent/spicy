/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Info,
  Plus,
  X,
  Palette,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  SlideElement,
  MIN_FONT_SIZE,
  GridItem,
  ElementType,
  SlideTheme,
} from "../types";

const getDefaultFontSize = (type: ElementType): number => {
  switch (type) {
    case "title":
      return 32;
    case "subtitle":
    case "quote":
      return 22;
    case "paragraph":
    case "bulletList":
    case "stat":
    case "grid":
    default:
      return 20;
  }
};

interface ElementEditorProps {
  element: SlideElement | null;
  activeTheme?: SlideTheme;
  onUpdateElement: (updated: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onMoveElement: (id: string, direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
  isArchived: boolean;
}

const COLOR_PRESETS = [
  { name: "Dark Slate", value: "#111827" },
  { name: "Pure White", value: "#ffffff" },
  { name: "Royal Blue", value: "#2563eb" },
  { name: "Emerald", value: "#10b981" },
  { name: "Vibrant Amber", value: "#f59e0b" },
  { name: "Sunset Orange", value: "#f97316" },
  { name: "Rose Red", value: "#f43f5e" },
  { name: "Deep Indigo", value: "#4f46e5" },
];

export default function ElementEditor({
  element,
  activeTheme,
  onUpdateElement,
  onDeleteElement,
  onMoveElement,
  isFirst,
  isLast,
  isArchived,
}: ElementEditorProps) {
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isHeadingColorOpen, setIsHeadingColorOpen] = useState(false);

  if (!element) {
    return (
      <div
        id="no-element-selected-panel"
        className="w-80 border-l border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center select-none h-full shrink-0"
      >
        <div className="p-3 bg-slate-50 text-slate-400 rounded-xl mb-3 shadow-inner">
          <Info className="w-6 h-6 text-indigo-500" />
        </div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Canvas Inspector
        </h4>
        <p className="text-[11px] text-slate-500 max-w-[180px] leading-relaxed">
          Click any text, stat, list item, or block on the active slide canvas
          to customize its fields and styling here.
        </p>
      </div>
    );
  }

  const handleFontSizeChange = (size: number) => {
    // Strictly enforce minimum font size of 20 points
    const enforcedSize = Math.max(MIN_FONT_SIZE, size);
    onUpdateElement({ fontSize: enforcedSize });
  };

  const handleUpdateListItem = (idx: number, val: string) => {
    const list = [...(element.listItems || [])];
    list[idx] = val;
    onUpdateElement({ listItems: list });
  };

  const handleAddListItem = () => {
    const list = [...(element.listItems || []), "New bullet point item"];
    onUpdateElement({ listItems: list });
  };

  const handleRemoveListItem = (idx: number) => {
    const list = (element.listItems || []).filter((_, i) => i !== idx);
    onUpdateElement({ listItems: list });
  };

  const handleUpdateGridItem = (gridId: string, fields: Partial<GridItem>) => {
    const items = (element.gridItems || []).map((item) => {
      if (item.id === gridId) {
        return { ...item, ...fields };
      }
      return item;
    });
    onUpdateElement({ gridItems: items });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateElement({ imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const defaultTextColor = activeTheme
    ? element.type === "subtitle"
      ? activeTheme.accent
      : activeTheme.text
    : "#000000";

  const defaultHeadingColor = activeTheme ? activeTheme.accent : "#000000";

  return (
    <div
      id={`element-editor-panel-${element.id}`}
      className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 select-none shadow-sm z-10"
    >
      {/* Inspector Title */}
      <div
        id="inspector-header"
        className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
      >
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Element Inspector
          </h4>
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">
            {element.type} block
          </span>
        </div>
        <button
          id={`delete-element-btn-${element.id}`}
          disabled={isArchived}
          onClick={() => onDeleteElement(element.id)}
          className="p-1.5 border rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Delete Element"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div
        id="inspector-scroll-area"
        className="flex-1 overflow-y-auto p-4 space-y-5"
      >
        {isArchived && (
          <div
            id="inspector-lock-alert"
            className="bg-amber-50 border border-amber-200 text-[11px] text-amber-800 p-3 rounded-xl leading-normal flex items-start gap-1.5"
          >
            <X className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
            <span>
              Editing is locked because this presentation has archived. Adjust
              expiry in the <b>Expiry / Meta</b> tab to unlock.
            </span>
          </div>
        )}

        {/* Content Customization Fields */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">
            Content Editor
          </span>

          {/* Dynamic Inputs based on type */}
          {(element.type === "title" ||
            element.type === "subtitle" ||
            element.type === "paragraph" ||
            element.type === "quote") && (
            <div>
              <label
                id="label-text-field"
                className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
              >
                Text Content
              </label>
              {element.type === "paragraph" || element.type === "quote" ? (
                <textarea
                  id={`input-text-${element.id}`}
                  disabled={isArchived}
                  value={element.content || ""}
                  onChange={(e) => onUpdateElement({ content: e.target.value })}
                  rows={4}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none transition-all"
                  placeholder="Enter content description..."
                />
              ) : (
                <input
                  id={`input-text-${element.id}`}
                  disabled={isArchived}
                  type="text"
                  value={element.content || ""}
                  onChange={(e) => onUpdateElement({ content: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter text..."
                />
              )}
            </div>
          )}

          {element.type === "image" && (
            <div className="space-y-4">
              {/* Image Source Input */}
              <div>
                <label
                  id="label-image-src"
                  className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                >
                  Image URL
                </label>
                <input
                  id={`input-image-url-${element.id}`}
                  disabled={isArchived}
                  type="text"
                  value={element.imageUrl || ""}
                  onChange={(e) =>
                    onUpdateElement({ imageUrl: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="Paste external image URL (https://...)"
                />
              </div>

              {/* Upload Local Image */}
              <div>
                <label
                  id="label-image-upload"
                  className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                >
                  Upload Local Image
                </label>
                <div className="flex items-center gap-2">
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl text-[10px] font-bold text-slate-600 hover:text-indigo-700 transition-all cursor-pointer ${
                      isArchived
                        ? "opacity-40 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File...</span>
                    <input
                      id={`file-upload-image-${element.id}`}
                      type="file"
                      accept="image/*"
                      disabled={isArchived}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Accessibility Description */}
              <div>
                <label
                  id="label-image-alt"
                  className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                >
                  Alt Text (Accessibility)
                </label>
                <textarea
                  id={`input-image-alt-${element.id}`}
                  disabled={isArchived}
                  value={element.imageAlt || ""}
                  onChange={(e) =>
                    onUpdateElement({ imageAlt: e.target.value })
                  }
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none transition-all font-medium leading-normal"
                  placeholder="Describe what's in the image..."
                />
                <span className="text-[9px] text-slate-400 mt-1 block leading-normal">
                  <b>Accessibility rule:</b> Provide a clear, succinct
                  explanation of this image for visually impaired readers using
                  assistive technology.
                </span>
              </div>
            </div>
          )}

          {element.type === "stat" && (
            <div className="space-y-3">
              <div>
                <label
                  id="label-stat-number"
                  className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                >
                  Hero Numeric Value
                </label>
                <input
                  id={`input-stat-num-${element.id}`}
                  disabled={isArchived}
                  type="text"
                  value={element.statNumber || ""}
                  onChange={(e) =>
                    onUpdateElement({ statNumber: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. 98.4% or 12x"
                />
              </div>
              <div>
                <label
                  id="label-stat-label"
                  className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                >
                  Supporting Description Label
                </label>
                <input
                  id={`input-stat-lbl-${element.id}`}
                  disabled={isArchived}
                  type="text"
                  value={element.statLabel || ""}
                  onChange={(e) =>
                    onUpdateElement({ statLabel: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Annual Growth Index"
                />
              </div>
            </div>
          )}

          {element.type === "bulletList" && (
            <div className="space-y-2">
              <label
                id="label-bullets-title"
                className="block text-[10px] font-bold text-slate-500 uppercase"
              >
                List Bullets
              </label>
              <div
                id={`bullets-list-${element.id}`}
                className="space-y-2 max-h-48 overflow-y-auto pr-1"
              >
                {(element.listItems || []).map((bullet, idx) => (
                  <div
                    id={`bullet-item-row-${idx}`}
                    key={idx}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-[11px] font-bold text-slate-400 select-none">
                      {idx + 1}.
                    </span>
                    <input
                      id={`input-bullet-item-${idx}`}
                      disabled={isArchived}
                      type="text"
                      value={bullet}
                      onChange={(e) =>
                        handleUpdateListItem(idx, e.target.value)
                      }
                      className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      id={`delete-bullet-btn-${idx}`}
                      disabled={
                        isArchived || (element.listItems?.length || 0) <= 1
                      }
                      onClick={() => handleRemoveListItem(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                id={`add-bullet-btn-${element.id}`}
                disabled={isArchived}
                onClick={handleAddListItem}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl text-[10px] font-bold text-slate-600 hover:text-indigo-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bullet Item
              </button>
            </div>
          )}

          {element.type === "grid" && (
            <div className="space-y-3">
              {(element.gridItems || []).map((item, index) => (
                <div
                  id={`grid-item-editor-${item.id}`}
                  key={item.id}
                  className="p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-2"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Column {index + 1}
                  </span>
                  <div>
                    <input
                      id={`input-grid-title-${item.id}`}
                      disabled={isArchived}
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        handleUpdateGridItem(item.id, { title: e.target.value })
                      }
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      placeholder="Column Heading"
                    />
                  </div>
                  <div>
                    <textarea
                      id={`input-grid-desc-${item.id}`}
                      disabled={isArchived}
                      value={item.desc}
                      onChange={(e) =>
                        handleUpdateGridItem(item.id, { desc: e.target.value })
                      }
                      rows={2}
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                      placeholder="Column details..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accessibility & Font Controls / Image Scaling */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {element.type === "image" ? (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                Image Dimensions
              </span>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <label id="label-image-width">Image Scale (Width)</label>
                <span
                  id="image-width-value-badge"
                  className="font-bold text-indigo-600"
                >
                  {element.imageWidth || 60}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id={`slider-image-width-${element.id}`}
                  disabled={isArchived}
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={element.imageWidth || 60}
                  onChange={(e) =>
                    onUpdateElement({ imageWidth: parseInt(e.target.value) })
                  }
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-xl cursor-pointer"
                />
                <span className="w-10 text-right text-xs font-bold text-slate-700">
                  {element.imageWidth || 60}%
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 leading-normal">
                Adjust width scale to fit elements side-by-side or fill
                presentation space.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                  Font Options
                </span>
                <span id="font-size-locked-badge" className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 shadow-sm">
                  ≥ 20pt Locked
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <label id="label-font-size">Font Size (pt)</label>
                </div>
                {(() => {
                  const defaultVal = getDefaultFontSize(element.type);

                  return (
                    <div className="flex items-center gap-3">
                      <input
                        id={`slider-font-size-${element.id}`}
                        disabled={isArchived}
                        type="range"
                        min="20"
                        max="72"
                        value={element.fontSize}
                        onChange={(e) =>
                          handleFontSizeChange(parseInt(e.target.value))
                        }
                        onDoubleClick={() => handleFontSizeChange(defaultVal)}
                        title="Double click to reset to default size"
                        className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-xl cursor-pointer"
                      />
                      <input
                        id={`number-font-size-${element.id}`}
                        disabled={isArchived}
                        type="number"
                        min="20"
                        max="120"
                        value={element.fontSize}
                        onChange={(e) =>
                          handleFontSizeChange(
                            parseInt(e.target.value) || MIN_FONT_SIZE,
                          )
                        }
                        className={`w-14 text-center text-xs p-1.5 border rounded-xl font-bold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          element.fontSize === defaultVal
                            ? "bg-indigo-50 border-indigo-300 text-indigo-600 ring-1 ring-indigo-300"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  );
                })()}
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  <b>Accessibility Mandate:</b> Display slides must enforce size
                  20pt+ to be readable on presentation screens.
                </p>
              </div>
            </>
          )}

          {/* Alignment Selector */}
          <div>
            <label
              id="label-text-align"
              className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5"
            >
              {element.type === "image" ? "Image Alignment" : "Text Alignment"}
            </label>
            <div id="align-btns-group" className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              <button
                id="align-left-btn"
                disabled={isArchived}
                onClick={() => onUpdateElement({ align: "left" })}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg transition-all border ${
                  element.align === "left"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                id="align-center-btn"
                disabled={isArchived}
                onClick={() => onUpdateElement({ align: "center" })}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg transition-all border ${
                  element.align === "center"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                id="align-right-btn"
                disabled={isArchived}
                onClick={() => onUpdateElement({ align: "right" })}
                className={`flex-1 flex items-center justify-center py-1 rounded-lg transition-all border ${
                  element.align === "right"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Text Color Selector */}
          {element.type !== "image" && (
            <div className="space-y-5">
              {/* Text Color Override */}
              <div className="border-t border-slate-100 pt-3">
                <div
                  className="flex items-center justify-between cursor-pointer mb-1.5"
                  onClick={() => setIsTextColorOpen(!isTextColorOpen)}
                >
                  <h3
                    id="heading-text-color"
                    className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Palette className="w-3.5 h-3.5 text-indigo-500" /> Text
                    Color Override
                  </h3>
                  {isTextColorOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {isTextColorOpen && (
                  <div
                    id="color-presets-grid"
                    className="grid grid-cols-4 gap-1.5 mt-2"
                  >
                    {COLOR_PRESETS.map((color) => (
                      <button
                        id={`color-preset-btn-${color.name}`}
                        key={color.name}
                        disabled={isArchived}
                        onClick={() => onUpdateElement({ color: color.value })}
                        style={{ backgroundColor: color.value }}
                        className={`w-full h-6 rounded-md border transition-all cursor-pointer shrink-0 ${
                          element.color === color.value
                            ? "ring-2 ring-indigo-500 ring-offset-1 border-transparent shadow-sm"
                            : "border-slate-300 hover:border-slate-400"
                        }`}
                        title={color.name}
                      />
                    ))}
                    <div className="col-span-4 flex items-center justify-between mt-1 h-7">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          id={`custom-color-input-${element.id}`}
                          disabled={isArchived}
                          type="color"
                          value={element.color || defaultTextColor}
                          onChange={(e) =>
                            onUpdateElement({ color: e.target.value })
                          }
                          className="w-8 h-5 border border-slate-200 rounded p-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-500">
                          {element.color || "Default"}
                        </span>
                      </div>
                      <button
                        onClick={() => onUpdateElement({ color: undefined })}
                        disabled={isArchived}
                        className={`p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors ${
                          element.color
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
                        title="Reset to default color"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Heading Color Override */}
              {(element.type === "grid" || element.type === "stat") && (
                <div className="border-t border-slate-100 pt-3">
                  <div
                    className="flex items-center justify-between cursor-pointer mb-1.5"
                    onClick={() => setIsHeadingColorOpen(!isHeadingColorOpen)}
                  >
                    <h3
                      id="heading-heading-color"
                      className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />{" "}
                      Heading Color Override
                    </h3>
                    {isHeadingColorOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {isHeadingColorOpen && (
                    <div
                      id="heading-color-presets-grid"
                      className="grid grid-cols-4 gap-1.5 mt-2"
                    >
                      {COLOR_PRESETS.map((color) => (
                        <button
                          id={`heading-color-preset-btn-${color.name}`}
                          key={`heading-${color.name}`}
                          disabled={isArchived}
                          onClick={() =>
                            onUpdateElement({ headingColor: color.value })
                          }
                          style={{ backgroundColor: color.value }}
                          className={`w-full h-6 rounded-md border transition-all cursor-pointer shrink-0 ${
                            element.headingColor === color.value
                              ? "ring-2 ring-indigo-500 ring-offset-1 border-transparent shadow-sm"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                          title={color.name}
                        />
                      ))}
                      <div className="col-span-4 flex items-center justify-between mt-1 h-7">
                        <div className="flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            id={`custom-heading-color-input-${element.id}`}
                            disabled={isArchived}
                            type="color"
                            value={element.headingColor || defaultHeadingColor}
                            onChange={(e) =>
                              onUpdateElement({ headingColor: e.target.value })
                            }
                            className="w-8 h-5 border border-slate-200 rounded p-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-500">
                            {element.headingColor || "Default"}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onUpdateElement({ headingColor: undefined })
                          }
                          disabled={isArchived}
                          className={`p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors ${
                            element.headingColor
                              ? "opacity-100"
                              : "opacity-0 pointer-events-none"
                          }`}
                          title="Reset to default heading color"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Layout Order / Element Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <span className="text-[10px] font-bold text-black uppercase tracking-wider block">
            Arrange Element
          </span>
          <div id="arrange-btns-group" className="grid grid-cols-2 gap-2">
            <button
              id="move-element-up-btn"
              disabled={isFirst || isArchived}
              onClick={() => onMoveElement(element.id, "up")}
              className="flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> Move Up
            </button>
            <button
              id="move-element-down-btn"
              disabled={isLast || isArchived}
              onClick={() => onMoveElement(element.id, "down")}
              className="flex items-center justify-center gap-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ArrowDown className="w-3.5 h-3.5 text-indigo-500" /> Move Down
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
