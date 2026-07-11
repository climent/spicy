/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElementType =
  | "title"
  | "subtitle"
  | "paragraph"
  | "bulletList"
  | "quote"
  | "stat"
  | "grid"
  | "image";

export interface GridItem {
  id: string;
  title: string;
  desc: string;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  title?: string; // Used for titles or block headings
  content?: string; // Used for paragraphs or quote text
  listItems?: string[]; // Used for bullet points
  statNumber?: string; // Used for big stat callouts
  statLabel?: string; // Used for stat description
  gridItems?: GridItem[]; // Used for grid/columns
  fontSize: number; // Enforced strict minimum of 20
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  align: "left" | "center" | "right";
  color?: string; // Custom override text color
  headingColor?: string; // Custom override heading color
  imageUrl?: string; // Base64 Data URL or external image URL
  imageAlt?: string; // Alt text for accessibility
  imageWidth?: number; // Sized in percentage (e.g. 10 to 100)
}

export interface SlideTheme {
  background: string;
  text: string;
  accent: string;
  fontFamily: "Inter" | "Space Grotesk" | "JetBrains Mono" | "Playfair Display";
  cardStyle: "flat" | "bordered" | "shadow";
}

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  theme: SlideTheme;
  contentAlign?: "top" | "middle" | "bottom";
}

export interface PresentationMetadata {
  title: string;
  creator: string;
  department: string;
  referenceNumber: string;
  createdAt: string;
  expiresAt: string | null; // ISO string or null for never
  isArchived: boolean;
}

export interface Presentation {
  id: string;
  metadata: PresentationMetadata;
  slides: Slide[];
}

export const DEFAULT_THEMES: SlideTheme[] = [
  {
    background: "#ffffff",
    text: "#111827",
    accent: "#3b82f6",
    fontFamily: "Inter",
    cardStyle: "bordered",
  },
  {
    background: "#0f172a",
    text: "#f8fafc",
    accent: "#38bdf8",
    fontFamily: "Space Grotesk",
    cardStyle: "flat",
  },
  {
    background: "#fefcbf",
    text: "#1a202c",
    accent: "#d69e2e",
    fontFamily: "Playfair Display",
    cardStyle: "shadow",
  },
  {
    background: "#f3f4f6",
    text: "#1f2937",
    accent: "#10b981",
    fontFamily: "JetBrains Mono",
    cardStyle: "bordered",
  },
];

export const MIN_FONT_SIZE = 20; // Strictly enforced
