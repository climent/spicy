/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Presentation,
  Slide,
  SlideElement,
  DEFAULT_THEMES,
  PresentationMetadata,
  ElementType,
  MIN_FONT_SIZE,
  GridItem,
} from "./types";
import Sidebar from "./components/Sidebar";
import SlideCanvas from "./components/SlideCanvas";
import ElementEditor from "./components/ElementEditor";
import {
  exportPresentationToPDF,
  exportPresentationToPDFBlob,
} from "./utils/pdfGenerator";
import { formatPublishedDate } from "./utils/dateFormatter";
import { Clock, Info, ShieldCheck, HelpCircle } from "lucide-react";
import JSZip from "jszip";
import { EXPORT_CONFIG } from "./config";

const LOCAL_STORAGE_KEY = "accessible-slide-pdf-builder-decks";

// Initial Mock / Pre-built Presentation
const INITIAL_DECK: Presentation = {
  id: "deck-demo-a11y",
  metadata: {
    title: "Black Rock Rangers info slides",
    creator: "", // empty to use auto-generated published date placeholder
    department: "Black Rock Rangers",
    referenceNumber: "Ranger Colapinto", // Creator Name
    createdAt: new Date().toISOString(),
    expiresAt: null, // default to no expiration for the demo deck initially
    isArchived: false,
  },
  slides: [
    {
      id: "slide-welcome",
      title: "Welcome Slide",
      theme: DEFAULT_THEMES[0], // Inter, Light Theme, Bordered
      elements: [
        {
          id: "welcome-title",
          type: "title",
          content: "Display Presentation",
          fontSize: 34,
          align: "center",
          fontWeight: "bold",
          color: "#4f46e5",
        },
        {
          id: "welcome-sub",
          type: "subtitle",
          content: "LOCKED TO >= 20PT FOR PUBLIC DISPLAY COMPLIANCE",
          fontSize: 22,
          align: "center",
          fontWeight: "semibold",
        },
      ],
    },
    {
      id: "slide-stats",
      title: "Display Showcase",
      theme: DEFAULT_THEMES[1], // Space Grotesk, Slate Theme, Flat
      elements: [
        {
          id: "stats-title",
          type: "title",
          content: "Visual Slide Presentation",
          fontSize: 26,
          align: "left",
          fontWeight: "bold",
          color: "#38bdf8",
        },
        {
          id: "stats-data",
          type: "stat",
          statNumber: "100%",
          statLabel: "Of text elements satisfy WCAG high-contrast standards",
          fontSize: 22,
          align: "left",
        },
        {
          id: "stats-desc",
          type: "paragraph",
          content:
            "When content is displayed on overhead auditorium projectors or kiosk displays, standard 12-14pt body text is completely unreadable. Enforcing 20pt+ font size guarantees general legibility.",
          fontSize: 20,
          align: "left",
        },
      ],
    },
    {
      id: "slide-bullets",
      title: "Core Principles",
      theme: DEFAULT_THEMES[3], // JetBrains Mono, Gray Theme, Bordered
      elements: [
        {
          id: "bullets-title",
          type: "title",
          content: "Interactive Builder Features",
          fontSize: 28,
          align: "center",
          fontWeight: "bold",
          color: "#10b981",
        },
        {
          id: "bullets-list",
          type: "bulletList",
          listItems: [
            "Interactive Drag & Drop components and visual templates",
            "Enforced 20pt font size minimum (Sliders & Inputs clamped automatically)",
            "Dynamic metadata tracking with automated document archiving",
            "One-click high-fidelity landscape PDF compiler",
          ],
          fontSize: 20,
          align: "left",
        },
      ],
    },
  ],
};

export default function App() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [pastPresentations, setPastPresentations] = useState<
    Presentation[] | null
  >(null);
  const [pastSelectedElementId, setPastSelectedElementId] = useState<
    string | null
  >(null);
  const [activePresentationId, setActivePresentationId] = useState<string>("");
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("slide_pdf_theme") === "dark";
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("slide_pdf_theme", next ? "dark" : "light");
      return next;
    });
  };

  const [exportWidth, setExportWidth] = useState<number>(() => {
    if (EXPORT_CONFIG.forceWidth !== null) {
      return EXPORT_CONFIG.forceWidth;
    }
    const saved = localStorage.getItem("slide_pdf_export_width");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return EXPORT_CONFIG.defaultWidth;
  });

  const activePresentation =
    presentations.find((p) => p.id === activePresentationId) ||
    presentations[0];

  // Expiration check helper
  const isArchived = activePresentation?.metadata?.expiresAt
    ? new Date(activePresentation.metadata.expiresAt).getTime() <=
      currentTime.getTime()
    : false;

  const updatePresentationsWithHistory = (
    updater: Presentation[] | ((prev: Presentation[]) => Presentation[]),
  ) => {
    setPresentations((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setPastPresentations(prev);
      setPastSelectedElementId(selectedElementId);
      return next;
    });
  };

  const handleUndo = () => {
    const activePres =
      presentations.find((p) => p.id === activePresentationId) ||
      presentations[0];
    const archived = activePres?.metadata?.expiresAt
      ? new Date(activePres.metadata.expiresAt).getTime() <=
        currentTime.getTime()
      : false;
    if (archived) return;
    if (pastPresentations) {
      setPresentations(pastPresentations);
      setSelectedElementId(pastSelectedElementId);
      setPastPresentations(null);
      setPastSelectedElementId(null);
    }
  };

  // Initialize from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setPresentations(parsed);
          setActivePresentationId(parsed[0].id);
        } else {
          setPresentations([INITIAL_DECK]);
          setActivePresentationId(INITIAL_DECK.id);
        }
      } catch (e) {
        console.error("Failed parsing saved presentation decks", e);
        setPresentations([INITIAL_DECK]);
        setActivePresentationId(INITIAL_DECK.id);
      }
    } else {
      setPresentations([INITIAL_DECK]);
      setActivePresentationId(INITIAL_DECK.id);
    }
  }, []);

  // Sync to LocalStorage on modifications
  useEffect(() => {
    if (presentations.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presentations));
    }
  }, [presentations]);

  // Keep track of ticks for dynamic file archiving
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check for expirations and set archiving state dynamically
      setPresentations((prevDecks) => {
        let modified = false;
        const updated = prevDecks.map((deck) => {
          if (deck.metadata.expiresAt) {
            const expiryTime = new Date(deck.metadata.expiresAt).getTime();
            const pastExpiry = now.getTime() >= expiryTime;

            if (pastExpiry && !deck.metadata.isArchived) {
              modified = true;
              return {
                ...deck,
                metadata: {
                  ...deck.metadata,
                  isArchived: true,
                },
              };
            } else if (!pastExpiry && deck.metadata.isArchived) {
              modified = true;
              return {
                ...deck,
                metadata: {
                  ...deck.metadata,
                  isArchived: false,
                },
              };
            }
          }
          return deck;
        });

        return modified ? updated : prevDecks;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcut Listeners (Backspace/Delete to delete element, Cmd+Z/Ctrl+Z to Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      // If user is typing in an input, ignore element level keybinds
      if (isInput) {
        return;
      }

      // Check for Backspace or Delete to remove selected element
      if (selectedElementId && (e.key === "Backspace" || e.key === "Delete")) {
        if (!isArchived) {
          e.preventDefault();
          handleDeleteElement(selectedElementId);
        }
      }

      // Check for Cmd+Z or Ctrl+Z to Undo
      const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
      const isUndo =
        (isMac ? e.metaKey : e.ctrlKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey;

      if (isUndo) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedElementId,
    isArchived,
    presentations,
    activePresentationId,
    activeSlideIndex,
    pastPresentations,
    pastSelectedElementId,
  ]);

  const handleSelectPresentation = (id: string) => {
    setActivePresentationId(id);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
  };

  const handleNewPresentation = () => {
    const newId = `deck-${Date.now()}`;
    const newDeck: Presentation = {
      id: newId,
      metadata: {
        title: "New Information Slide Deck",
        creator: "", // empty to use auto-generated published date placeholder
        department: "Operations",
        referenceNumber: "Public User", // Creator Name
        createdAt: new Date().toISOString(),
        expiresAt: null,
        isArchived: false,
      },
      slides: [
        {
          id: `slide-${Date.now()}-1`,
          title: "Slide 1",
          theme: DEFAULT_THEMES[0],
          elements: [
            {
              id: `el-${Date.now()}-t`,
              type: "title",
              content: "Double-Click Element to Edit",
              fontSize: 32,
              align: "center",
              fontWeight: "bold",
            },
            {
              id: `el-${Date.now()}-p`,
              type: "paragraph",
              content:
                "Modify this paragraph text. Enforces strict visual accessibility standards.",
              fontSize: 22,
              align: "center",
            },
          ],
        },
      ],
    };

    updatePresentationsWithHistory((prev) => [newDeck, ...prev]);
    setActivePresentationId(newId);
    setActiveSlideIndex(0);
    setSelectedElementId(null);
  };

  const handleDeletePresentation = (id: string) => {
    if (presentations.length <= 1) return;
    const remains = presentations.filter((p) => p.id !== id);
    updatePresentationsWithHistory(remains);
    if (activePresentationId === id) {
      setActivePresentationId(remains[0].id);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
    }
  };

  const handleUpdateMetadata = (updates: Partial<PresentationMetadata>) => {
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          return {
            ...p,
            metadata: {
              ...p.metadata,
              ...updates,
            },
          };
        }
        return p;
      }),
    );
  };

  const handleApplyTheme = (themeIndex: number) => {
    if (isArchived) return;
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          slides[activeSlideIndex] = {
            ...slides[activeSlideIndex],
            theme: DEFAULT_THEMES[themeIndex],
          };
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  // Add Dynamic Slide
  const handleAddSlide = () => {
    if (isArchived) return;
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const newSlide: Slide = {
            id: `slide-${Date.now()}`,
            title: `Slide ${p.slides.length + 1}`,
            theme: p.slides[activeSlideIndex]?.theme || DEFAULT_THEMES[0],
            elements: [
              {
                id: `el-${Date.now()}-t`,
                type: "title",
                content: "Enter Slide Topic",
                fontSize: 28,
                align: "left",
                fontWeight: "bold",
              },
            ],
          };
          const slides = [...p.slides, newSlide];
          setActiveSlideIndex(slides.length - 1);
          setSelectedElementId(null);
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  const handleDuplicateSlide = (index: number) => {
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const origin = p.slides[index];
          const copy: Slide = {
            ...origin,
            id: `slide-copy-${Date.now()}`,
            title: `${origin.title} (Copy)`,
            elements: origin.elements.map((el) => ({
              ...el,
              id: `el-copy-${Math.random().toString(36).substr(2, 9)}`,
            })),
          };
          const slides = [...p.slides];
          slides.splice(index + 1, 0, copy);
          setActiveSlideIndex(index + 1);
          setSelectedElementId(null);
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  const handleDeleteSlide = (index: number) => {
    if (activePresentation.slides.length <= 1) return;
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = p.slides.filter((_, i) => i !== index);
          const newActiveIndex = Math.max(0, index - 1);
          setActiveSlideIndex(newActiveIndex);
          setSelectedElementId(null);
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  const handleMoveSlide = (index: number, direction: "left" | "right") => {
    const slides = [...activePresentation.slides];
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;

    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          return { ...p, slides };
        }
        return p;
      }),
    );
    setActiveSlideIndex(targetIdx);
    setSelectedElementId(null);
  };

  // Add block elements
  const handleAddElementToActiveSlide = (type: ElementType) => {
    if (isArchived) return;

    let defaultEl: SlideElement;
    const elId = `el-${Date.now()}`;

    switch (type) {
      case "title":
        defaultEl = {
          id: elId,
          type: "title",
          content: "Main Slide Title Heading",
          fontSize: 32,
          align: "left",
          fontWeight: "bold",
        };
        break;
      case "subtitle":
        defaultEl = {
          id: elId,
          type: "subtitle",
          content: "Supporting Subtitle Text Banner",
          fontSize: 22,
          align: "left",
          fontWeight: "semibold",
        };
        break;
      case "paragraph":
        defaultEl = {
          id: elId,
          type: "paragraph",
          content:
            "Add structured narrative details here. Content is optimized for readable font display.",
          fontSize: 20,
          align: "left",
        };
        break;
      case "bulletList":
        defaultEl = {
          id: elId,
          type: "bulletList",
          listItems: [
            "Core observation of public slide systems",
            "Accessibility features enforce 20pt minimum sizes",
          ],
          fontSize: 20,
          align: "left",
        };
        break;
      case "quote":
        defaultEl = {
          id: elId,
          type: "quote",
          content:
            "Inclusive design means considering the full range of human diversity.",
          fontSize: 22,
          align: "left",
        };
        break;
      case "stat":
        defaultEl = {
          id: elId,
          type: "stat",
          statNumber: "92%",
          statLabel: "Public Display Legibility Index",
          fontSize: 20,
          align: "center",
        };
        break;
      case "grid":
        defaultEl = {
          id: elId,
          type: "grid",
          gridItems: [
            {
              id: "1",
              title: "Feature Alpha",
              desc: "Detail specifications locked to 20pt.",
            },
            {
              id: "2",
              title: "Feature Beta",
              desc: "Second column details aligned.",
            },
          ],
          fontSize: 20,
          align: "left",
        };
        break;
      case "image":
        defaultEl = {
          id: elId,
          type: "image",
          imageUrl:
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          imageAlt: "Decorative abstract graphic showing colorful fluid art",
          imageWidth: 60,
          fontSize: 20, // dummy, since it extends slide element
          align: "center",
        };
        break;
    }

    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          const slide = slides[activeSlideIndex];
          slides[activeSlideIndex] = {
            ...slide,
            elements: [...slide.elements, defaultEl],
          };
          return { ...p, slides };
        }
        return p;
      }),
    );

    setSelectedElementId(elId);
  };

  // Drag and Drop Predefined layouts
  const handleApplyTemplateToActiveSlide = (templateType: string) => {
    if (isArchived) return;

    let elements: SlideElement[] = [];

    switch (templateType) {
      case "welcome":
        elements = [
          {
            id: `wel-t-${Date.now()}`,
            type: "title",
            content: "Interactive Slide Presentation",
            fontSize: 34,
            align: "center",
            fontWeight: "bold",
            color: "#4f46e5",
          },
          {
            id: `wel-s-${Date.now()}`,
            type: "subtitle",
            content: "WIDESCREEN ACCESSIBLE LAYOUT ARCHITECTURE",
            fontSize: 22,
            align: "center",
            fontWeight: "semibold",
          },
        ];
        break;
      case "bullets":
        elements = [
          {
            id: `bul-t-${Date.now()}`,
            type: "title",
            content: "Key Features & Insights",
            fontSize: 28,
            align: "left",
            fontWeight: "bold",
            color: "#10b981",
          },
          {
            id: `bul-l-${Date.now()}`,
            type: "bulletList",
            listItems: [
              "Enforced >= 20pt display rules for public audiences",
              "Real-time WYSIWYG editor highlighting compliance",
              "One-click automated landscape widescreen PDF downloads",
            ],
            fontSize: 20,
            align: "left",
          },
        ];
        break;
      case "stats":
        elements = [
          {
            id: `st-t-${Date.now()}`,
            type: "title",
            content: "Performance Highlight",
            fontSize: 24,
            align: "left",
            fontWeight: "bold",
            color: "#f59e0b",
          },
          {
            id: `st-n-${Date.now()}`,
            type: "stat",
            statNumber: "10x",
            statLabel: "Increased distant audience focus retention",
            fontSize: 20,
            align: "left",
          },
          {
            id: `st-p-${Date.now()}`,
            type: "paragraph",
            content:
              "Our system enforces standard sizing constraints to eliminate low-contrast micro-copy entirely from executive presentations.",
            fontSize: 20,
            align: "left",
          },
        ];
        break;
      case "quote":
        elements = [
          {
            id: `qt-s-${Date.now()}`,
            type: "subtitle",
            content: "INCLUSION STANDARD MANDATE",
            fontSize: 20,
            align: "center",
            fontWeight: "semibold",
            color: "#f97316",
          },
          {
            id: `qt-q-${Date.now()}`,
            type: "quote",
            content:
              "Accessibility is not an afterthought; it is the absolute foundation of professional slide design.",
            fontSize: 24,
            align: "center",
          },
        ];
        break;
      case "comparison":
        elements = [
          {
            id: `cp-t-${Date.now()}`,
            type: "title",
            content: "Standard Feature Compares",
            fontSize: 26,
            align: "center",
            fontWeight: "bold",
          },
          {
            id: `cp-g-${Date.now()}`,
            type: "grid",
            gridItems: [
              {
                id: "1",
                title: "Display Mode",
                desc: "Enforces readable 16:9 sizing patterns to minimize squished pages.",
              },
              {
                id: "2",
                title: "Export Engine",
                desc: "Direct compilation to high-DPI landscape printable PDFs.",
              },
            ],
            fontSize: 20,
            align: "left",
          },
        ];
        break;
    }

    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          slides[activeSlideIndex] = {
            ...slides[activeSlideIndex],
            elements,
          };
          return { ...p, slides };
        }
        return p;
      }),
    );

    setSelectedElementId(null);
  };

  const handleUpdateElement = (updatedFields: Partial<SlideElement>) => {
    if (isArchived || !selectedElementId) return;

    // Enforce 20pt minimum font size constraint
    if (updatedFields.fontSize !== undefined) {
      updatedFields.fontSize = Math.max(MIN_FONT_SIZE, updatedFields.fontSize);
    }

    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          const slide = slides[activeSlideIndex];
          const elements = slide.elements.map((el) => {
            if (el.id === selectedElementId) {
              return {
                ...el,
                ...updatedFields,
              };
            }
            return el;
          });
          slides[activeSlideIndex] = { ...slide, elements };
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  const handleDeleteElement = (elementId: string) => {
    if (isArchived) return;
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          const slide = slides[activeSlideIndex];
          slides[activeSlideIndex] = {
            ...slide,
            elements: slide.elements.filter((el) => el.id !== elementId),
          };
          return { ...p, slides };
        }
        return p;
      }),
    );
    setSelectedElementId(null);
  };

  const handleMoveElement = (elementId: string, direction: "up" | "down") => {
    if (isArchived) return;
    const slide = activePresentation.slides[activeSlideIndex];
    const elements = [...slide.elements];
    const index = elements.findIndex((el) => el.id === elementId);
    if (index === -1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= elements.length) return;

    const temp = elements[index];
    elements[index] = elements[targetIdx];
    elements[targetIdx] = temp;

    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          slides[activeSlideIndex] = {
            ...slides[activeSlideIndex],
            elements,
          };
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  // Export entire deck to PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    setSelectedElementId(null); // Clear borders before snapshotting

    // Remember initial slide index to restore it afterwards
    const initialSlideIdx = activeSlideIndex;

    // Tiny delay to ensure borders fade and state propagates before starting render
    await new Promise((r) => setTimeout(r, 200));

    try {
      const slideIds = activePresentation.slides.map((s) => s.id);

      // Also download companion metadata file containing document expiration
      const metadataToSave = {
        title: activePresentation.metadata.title,
        department: activePresentation.metadata.department,
        referenceNumber: activePresentation.metadata.referenceNumber,
        creator: activePresentation.metadata.creator,
        expiresAt: activePresentation.metadata.expiresAt,
        isArchived: activePresentation.metadata.expiresAt
          ? new Date(activePresentation.metadata.expiresAt).getTime() <=
            Date.now()
          : false,
        exportedAt: new Date().toISOString(),
      };
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(metadataToSave, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      const metadataFileName = `${activePresentation.metadata.title.trim().replace(/[^a-z0-9_-]/gi, "_") || "presentation"}-metadata.json`;
      downloadAnchor.setAttribute("download", metadataFileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      await exportPresentationToPDF(
        activePresentation.metadata.title,
        slideIds,
        (current, total) => setExportProgress({ current, total }),
        async (index) => {
          setActiveSlideIndex(index);
          // Wait for React state update and layout rendering
          await new Promise((r) => setTimeout(r, 200));
        },
        exportWidth,
      );
    } catch (e) {
      console.error("PDF compiling failed", e);
      alert(
        "Failed to compile your slides into a PDF file. Please verify elements are configured properly.",
      );
    } finally {
      // Restore initial slide selection
      setActiveSlideIndex(initialSlideIdx);
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export entire deck to ZIP
  const handleExportZip = async () => {
    setIsExporting(true);
    setSelectedElementId(null); // Clear borders before snapshotting

    // Remember initial slide index to restore it afterwards
    const initialSlideIdx = activeSlideIndex;

    // Tiny delay to ensure borders fade and state propagates before starting render
    await new Promise((r) => setTimeout(r, 200));

    try {
      const slideIds = activePresentation.slides.map((s) => s.id);

      // Also download companion metadata file containing document expiration
      const metadataToSave = {
        title: activePresentation.metadata.title,
        department: activePresentation.metadata.department,
        referenceNumber: activePresentation.metadata.referenceNumber,
        creator: activePresentation.metadata.creator,
        expiresAt: activePresentation.metadata.expiresAt,
        isArchived: activePresentation.metadata.expiresAt
          ? new Date(activePresentation.metadata.expiresAt).getTime() <=
            Date.now()
          : false,
        exportedAt: new Date().toISOString(),
      };

      const pdfBlob = await exportPresentationToPDFBlob(
        slideIds,
        (current, total) => setExportProgress({ current, total }),
        async (index) => {
          setActiveSlideIndex(index);
          // Wait for React state update and layout rendering
          await new Promise((r) => setTimeout(r, 200));
        },
        exportWidth,
      );

      const zip = new JSZip();
      const baseName =
        activePresentation.metadata.title
          .trim()
          .replace(/[^a-z0-9_-]/gi, "_") || "presentation";
      zip.file(`${baseName}.pdf`, pdfBlob);
      zip.file(
        `${baseName}-metadata.json`,
        JSON.stringify(metadataToSave, null, 2),
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = URL.createObjectURL(zipBlob);
      downloadAnchor.download = `${baseName}.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("ZIP compiling failed", e);
      alert(
        "Failed to compile your slides into a ZIP file. Please verify elements are configured properly.",
      );
    } finally {
      // Restore initial slide selection
      setActiveSlideIndex(initialSlideIdx);
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleImportPresentations = (importedDecks: Presentation[]) => {
    if (!importedDecks || importedDecks.length === 0) return;
    setPresentations((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = importedDecks.filter(
        (p) => p && p.id && !existingIds.has(p.id),
      );

      // If all imported decks are already existing, just notify or overwrite.
      // Let's merge them! If there are duplicates, we can generate a new id for the imported ones.
      const sanitized = importedDecks
        .map((p) => {
          if (!p || !p.id) return null;
          if (existingIds.has(p.id)) {
            return {
              ...p,
              id: `deck-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              metadata: {
                ...p.metadata,
                title: `${p.metadata.title || "Untitled"} (Imported Copy)`,
              },
            };
          }
          return p;
        })
        .filter(Boolean) as Presentation[];

      const updated = [...prev, ...sanitized];
      if (sanitized.length > 0) {
        setActivePresentationId(sanitized[0].id);
      }
      return updated;
    });
  };

  if (presentations.length === 0) {
    return (
      <div
        id="loading-spinner-app"
        className="flex items-center justify-center h-screen bg-slate-50 text-sm font-semibold text-slate-500 font-sans"
      >
        Preparing Accessible Presentation Decks...
      </div>
    );
  }

  const activeSlide =
    activePresentation.slides[activeSlideIndex] || activePresentation.slides[0];
  const activeElements = activeSlide?.elements || [];
  const selectedElement =
    activeElements.find((el) => el.id === selectedElementId) || null;

  const isFirstElement =
    activeElements.indexOf(selectedElement as SlideElement) === 0;
  const isLastElement =
    activeElements.indexOf(selectedElement as SlideElement) ===
    activeElements.length - 1;

  const handleUpdateSlideAlignment = (
    alignment: "top" | "middle" | "bottom",
  ) => {
    if (isArchived) return;
    updatePresentationsWithHistory((prev) =>
      prev.map((p) => {
        if (p.id === activePresentationId) {
          const slides = [...p.slides];
          slides[activeSlideIndex] = {
            ...slides[activeSlideIndex],
            contentAlign: alignment,
          };
          return { ...p, slides };
        }
        return p;
      }),
    );
  };

  const activeSlideAlignment = activeSlide?.contentAlign || "middle";

  return (
    <div
      id="app-root-layout"
      className={`flex h-screen w-screen bg-white font-sans text-slate-800 overflow-hidden ${isDarkMode ? "dark bg-slate-950 text-slate-100" : ""}`}
    >
      {/* Sidebar (Left) */}
      <Sidebar
        presentations={presentations}
        activeId={activePresentationId}
        onSelectPresentation={handleSelectPresentation}
        onNewPresentation={handleNewPresentation}
        onDeletePresentation={handleDeletePresentation}
        onUpdateMetadata={handleUpdateMetadata}
        onApplyTheme={handleApplyTheme}
        onUpdateSlideAlignment={handleUpdateSlideAlignment}
        activeSlideAlignment={activeSlideAlignment}
        onExportPDF={handleExportPDF}
        onExportZip={handleExportZip}
        isExporting={isExporting}
        onAddElement={handleAddElementToActiveSlide}
        onImportPresentations={handleImportPresentations}
        exportWidth={exportWidth}
        onUpdateExportWidth={(width) => {
          if (EXPORT_CONFIG.forceWidth !== null) return;
          setExportWidth(width);
          localStorage.setItem("slide_pdf_export_width", width.toString());
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Canvas Workspace Area */}
      <div
        id="canvas-wrapper-pane"
        className="flex-1 flex flex-col h-full relative"
        onClick={() => setSelectedElementId(null)}
      >
        {/* Top Notification banner for archived items */}
        {isArchived && (
          <div
            id="archive-locked-notice-strip"
            className="w-full bg-amber-500 text-white font-bold py-2.5 px-4 flex items-center justify-center gap-2 text-xs shadow-md shrink-0 select-none z-20"
          >
            <Clock className="w-4 h-4 text-white animate-spin" />
            <span>
              🔒 DOCUMENT ARCHIVED: THIS DECK HAS EXPIRED & BECOME READ-ONLY. TO
              RESUME EDITING, EXTEND EXPIRES AT SETTINGS.
            </span>
          </div>
        )}

        {/* Live Presentation Canvas Rendering */}
        <SlideCanvas
          slides={activePresentation.slides}
          activeSlideIndex={activeSlideIndex}
          selectedElementId={selectedElementId}
          onSelectSlide={(idx) => setActiveSlideIndex(idx)}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
          onSelectElement={setSelectedElementId}
          onAddElementToActiveSlide={handleAddElementToActiveSlide}
          onApplyTemplateToActiveSlide={handleApplyTemplateToActiveSlide}
          metaTitle={activePresentation.metadata.title}
          metaCreator={activePresentation.metadata.creator}
          metaDept={activePresentation.metadata.department}
          metaRef={activePresentation.metadata.referenceNumber}
          isExporting={isExporting}
          isArchived={isArchived}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Element Properties Inspector (Right) */}
      <ElementEditor
        element={selectedElement}
        activeTheme={activeSlide?.theme}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onMoveElement={handleMoveElement}
        isFirst={isFirstElement}
        isLast={isLastElement}
        isArchived={isArchived}
      />

      {/* Progress modal while downloading PDF */}
      {isExporting && exportProgress && (
        <div
          id="export-progress-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full animate-bounce">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                Compiling Accessible Slide PDF
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Rendering vector shapes, layouts, custom styles, and high-DPI
                text blocks...
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                }}
              />
            </div>

            <span className="text-xs font-extrabold text-indigo-600">
              Rendering page {exportProgress.current} of {exportProgress.total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
