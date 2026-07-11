/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

export async function exportPresentationToPDFBlob(
  slideIds: string[],
  onProgress?: (current: number, total: number) => void,
  onBeforeCapture?: (index: number) => Promise<void>,
  exportWidth: number = 1440,
): Promise<Blob> {
  const totalSlides = slideIds.length;
  if (totalSlides === 0) {
    throw new Error("No slides to export");
  }

  // Proportional height for widescreen (16:9) presentation PDF
  const exportHeight = Math.round((exportWidth * 9) / 16);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [exportWidth, exportHeight],
    compress: true,
  });

  for (let i = 0; i < totalSlides; i++) {
    if (onBeforeCapture) {
      await onBeforeCapture(i);
    }

    const slideId = slideIds[i];
    const element = document.getElementById(`slide-render-${slideId}`);

    if (!element) {
      console.warn(`Slide element with ID slide-render-${slideId} not found`);
      continue;
    }

    if (onProgress) {
      onProgress(i + 1, totalSlides);
    }

    // Save original styles to restore afterwards
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalPosition = element.style.position;
    const originalTop = element.style.top;
    const originalLeft = element.style.left;
    const originalZIndex = element.style.zIndex;
    const originalTransform = element.style.transform;
    const originalMaxWidth = element.style.maxWidth;
    const originalMaxHeight = element.style.maxHeight;

    // Apply exact target export dimensions off-screen for perfect rendering
    element.style.width = `${exportWidth}px`;
    element.style.height = `${exportHeight}px`;
    element.style.position = "fixed";
    element.style.top = "0px";
    element.style.left = "0px";
    element.style.zIndex = "-9999";
    element.style.transform = "none";
    element.style.maxWidth = "none";
    element.style.maxHeight = "none";

    // Capture slide as high-DPI image
    const canvas = await html2canvas(element, {
      scale: 1.5, // 1.5x of the native export size gives pristine print quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null,
    });

    // Restore original styles immediately
    element.style.width = originalWidth;
    element.style.height = originalHeight;
    element.style.position = originalPosition;
    element.style.top = originalTop;
    element.style.left = originalLeft;
    element.style.zIndex = originalZIndex;
    element.style.transform = originalTransform;
    element.style.maxWidth = originalMaxWidth;
    element.style.maxHeight = originalMaxHeight;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (i > 0) {
      pdf.addPage([exportWidth, exportHeight], "landscape");
    }

    pdf.addImage(imgData, "JPEG", 0, 0, exportWidth, exportHeight);
  }

  return pdf.output("blob");
}

export async function exportPresentationToPDF(
  presentationTitle: string,
  slideIds: string[],
  onProgress?: (current: number, total: number) => void,
  onBeforeCapture?: (index: number) => Promise<void>,
  exportWidth: number = 1440,
): Promise<void> {
  const blob = await exportPresentationToPDFBlob(
    slideIds,
    onProgress,
    onBeforeCapture,
    exportWidth,
  );
  const fileName = `${presentationTitle.trim().replace(/[^a-z0-9_-]/gi, "_") || "presentation"}.pdf`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = URL.createObjectURL(blob);
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
