/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExportConfig {
  /**
   * Default export width in pixels (16:9 ratio).
   * Default: 1440
   */
  defaultWidth: number;

  /**
   * Force a specific width for all PDF exports, bypassing any user selections.
   * If set to a number (e.g. 1440, 1920), the export width is locked to this value,
   * and the UI controls in the sidebar are disabled/locked in a read-only state.
   * If set to null, the user is free to select or configure the width.
   */
  forceWidth: number | null;

  /**
   * The preset widths available in the UI.
   */
  presets: number[];

  /**
   * Whether to allow the user to type in a custom numeric width.
   * If false, they are limited to selecting the provided presets.
   * Only applicable when forceWidth is null.
   */
  allowUserCustomInput: boolean;

  /**
   * Default prefix for generated PDF files.
   */
  defaultFilenamePrefix: string;
}

/**
 * Slide PDF Creator configuration.
 * Change `forceWidth` to a pixel number (e.g. 1440) to lock it for users.
 */
export const EXPORT_CONFIG: ExportConfig = {
  defaultWidth: 1440,
  forceWidth: null, // Set to a number (e.g. 1440) to force a specific size and disable modification
  presets: [1024, 1280, 1440, 1920],
  allowUserCustomInput: true,
  defaultFilenamePrefix: "slide-pdf-creator-export",
};
