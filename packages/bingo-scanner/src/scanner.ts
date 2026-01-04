import Tesseract, { createWorker, Worker } from 'tesseract.js';
import type { ImageInput, ScannerOptions, ScanResult, CellResult } from './types';
import { DEFAULT_OPTIONS } from './types';
import { preprocessImage, extractAllCells } from './preprocessing';
import { createCellResult, cellsToGrid, gridToArray } from './parser';

/**
 * BingoScanner class for scanning bingo cards and extracting numbers
 */
export class BingoScanner {
  private options: Required<Omit<ScannerOptions, 'workerPath' | 'corePath' | 'langPath'>> &
    Pick<ScannerOptions, 'workerPath' | 'corePath' | 'langPath'>;
  private worker: Worker | null = null;

  constructor(options: ScannerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  /**
   * Initializes the Tesseract worker
   * Call this before scanning for better performance when scanning multiple cards
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      return;
    }

    const workerOptions: Partial<Tesseract.WorkerOptions> = {};

    if (this.options.workerPath) {
      workerOptions.workerPath = this.options.workerPath;
    }
    if (this.options.corePath) {
      workerOptions.corePath = this.options.corePath;
    }
    if (this.options.langPath) {
      workerOptions.langPath = this.options.langPath;
    }

    this.worker = await createWorker(this.options.language, undefined, workerOptions);

    // Configure Tesseract for number recognition
    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });
  }

  /**
   * Terminates the Tesseract worker
   * Call this when done scanning to free resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Scans a bingo card image and extracts all numbers
   * @param input - Image file path, URL, Buffer, or Uint8Array
   * @returns ScanResult containing extracted numbers and metadata
   */
  async scan(input: ImageInput): Promise<ScanResult> {
    const startTime = Date.now();
    const shouldTerminate = !this.worker;

    try {
      // Initialize worker if not already done
      await this.initialize();

      // Preprocess the image if enabled
      let processedImage: ImageInput = input;
      if (this.options.preprocess) {
        processedImage = await preprocessImage(input);
      }

      // Extract all cells from the image
      const cells = await extractAllCells(processedImage, this.options.gridSize);

      // Process each cell with OCR
      const cellResults: CellResult[] = [];
      let totalConfidence = 0;
      let unreadableCells = 0;

      for (const cell of cells) {
        const ocrResult = await this.worker!.recognize(cell.buffer);
        const text = ocrResult.data.text;
        const confidence = ocrResult.data.confidence;

        const cellResult = createCellResult(text, confidence, cell.row, cell.col, {
          numberRange: this.options.numberRange,
          hasFreeSpace: this.options.hasFreeSpace,
          gridSize: this.options.gridSize,
        });

        cellResults.push(cellResult);
        totalConfidence += confidence;

        if (cellResult.number === null && !cellResult.isFreeSpace) {
          unreadableCells++;
        }
      }

      // Build the result
      const grid = cellsToGrid(cellResults, this.options.gridSize);
      const numbers = gridToArray(grid);
      const avgConfidence = cellResults.length > 0 ? totalConfidence / cellResults.length : 0;

      return {
        numbers,
        grid,
        cells: cellResults,
        confidence: avgConfidence,
        isComplete: unreadableCells === 0,
        unreadableCells,
        processingTime: Date.now() - startTime,
      };
    } finally {
      // Terminate worker if it was created for this scan only
      if (shouldTerminate) {
        await this.terminate();
      }
    }
  }

  /**
   * Scans multiple bingo cards efficiently
   * Uses a single worker instance for all cards
   * @param inputs - Array of image inputs
   * @returns Array of ScanResults
   */
  async scanMultiple(inputs: ImageInput[]): Promise<ScanResult[]> {
    try {
      await this.initialize();
      const results: ScanResult[] = [];

      for (const input of inputs) {
        const result = await this.scan(input);
        results.push(result);
      }

      return results;
    } finally {
      await this.terminate();
    }
  }
}

/**
 * Scans a bingo card image and returns an array of detected numbers
 * This is a convenience function for simple use cases
 *
 * @param input - Image file path, URL, Buffer, or Uint8Array
 * @param options - Optional scanner configuration
 * @returns Array of numbers (null for FREE spaces or unreadable cells)
 *
 * @example
 * ```typescript
 * import { scanBingoCard } from '@repo/bingo-scanner';
 *
 * const numbers = await scanBingoCard('./bingo-card.png');
 * console.log(numbers); // [5, 22, 34, 48, 61, 12, ...]
 * ```
 */
export async function scanBingoCard(
  input: ImageInput,
  options: ScannerOptions = {}
): Promise<(number | null)[]> {
  const scanner = new BingoScanner(options);
  const result = await scanner.scan(input);
  return result.numbers;
}

/**
 * Scans a bingo card image and returns detailed results
 *
 * @param input - Image file path, URL, Buffer, or Uint8Array
 * @param options - Optional scanner configuration
 * @returns Detailed scan result with numbers, grid, confidence, etc.
 *
 * @example
 * ```typescript
 * import { scanBingoCardDetailed } from '@repo/bingo-scanner';
 *
 * const result = await scanBingoCardDetailed('./bingo-card.png');
 * console.log(result.numbers); // [5, 22, 34, 48, 61, ...]
 * console.log(result.grid);    // [[5, 22, 34, 48, 61], [...], ...]
 * console.log(result.confidence); // 87.5
 * ```
 */
export async function scanBingoCardDetailed(
  input: ImageInput,
  options: ScannerOptions = {}
): Promise<ScanResult> {
  const scanner = new BingoScanner(options);
  return scanner.scan(input);
}
