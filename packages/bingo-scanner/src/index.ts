/**
 * @repo/bingo-scanner
 *
 * A library to scan bingo cards and detect numbers using OCR.
 *
 * @example
 * Simple usage - get numbers as an array:
 * ```typescript
 * import { scanBingoCard } from '@repo/bingo-scanner';
 *
 * const numbers = await scanBingoCard('./bingo-card.png');
 * console.log(numbers); // [5, 22, 34, null, 61, 12, ...] (null = FREE space)
 * ```
 *
 * @example
 * Detailed results with confidence scores:
 * ```typescript
 * import { scanBingoCardDetailed } from '@repo/bingo-scanner';
 *
 * const result = await scanBingoCardDetailed('./bingo-card.png');
 * console.log(result.numbers);    // Array of numbers
 * console.log(result.grid);       // 2D grid representation
 * console.log(result.confidence); // Overall confidence score
 * ```
 *
 * @example
 * Using the BingoScanner class for multiple scans:
 * ```typescript
 * import { BingoScanner } from '@repo/bingo-scanner';
 *
 * const scanner = new BingoScanner({
 *   language: 'eng',
 *   confidenceThreshold: 70,
 * });
 *
 * await scanner.initialize();
 *
 * const result1 = await scanner.scan('./card1.png');
 * const result2 = await scanner.scan('./card2.png');
 *
 * await scanner.terminate();
 * ```
 */

// Main scanner exports
export { BingoScanner, scanBingoCard, scanBingoCardDetailed } from './scanner';

// Type exports
export type {
  ScannerOptions,
  ScanResult,
  CellResult,
  ImageInput,
} from './types';

// Constants exports
export {
  BINGO_COLUMNS,
  STANDARD_BINGO_RANGES,
  DEFAULT_OPTIONS,
} from './types';

// Parser utilities (for advanced use cases)
export {
  cleanOcrText,
  extractNumber,
  isFreeSpace,
  validateNumberForColumn,
  createCellResult,
  parseGrid,
  cellsToGrid,
  gridToArray,
} from './parser';

// Preprocessing utilities (for advanced use cases)
export {
  preprocessImage,
  extractCell,
  extractAllCells,
  getImageDimensions,
  resizeImage,
} from './preprocessing';
