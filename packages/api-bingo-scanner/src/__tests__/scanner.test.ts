import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sharp from 'sharp';
import { BingoScanner } from '../scanner';

// Create a simple test image buffer
async function createTestImage(width = 250, height = 250): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
}

// Mock tesseract.js
vi.mock('tesseract.js', () => {
  const mockWorker = {
    recognize: vi.fn().mockResolvedValue({
      data: {
        text: '42',
        confidence: 90,
      },
    }),
    setParameters: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      PSM: {
        SINGLE_BLOCK: 6,
      },
    },
    createWorker: vi.fn().mockResolvedValue(mockWorker),
    PSM: {
      SINGLE_BLOCK: 6,
    },
  };
});

describe('BingoScanner', () => {
  let scanner: BingoScanner;

  beforeEach(() => {
    scanner = new BingoScanner();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await scanner.terminate();
  });

  describe('constructor', () => {
    it('should create scanner with default options', () => {
      const defaultScanner = new BingoScanner();
      expect(defaultScanner).toBeInstanceOf(BingoScanner);
    });

    it('should accept custom options', () => {
      const customScanner = new BingoScanner({
        language: 'spa',
        confidenceThreshold: 80,
        gridSize: { rows: 3, cols: 3 },
      });
      expect(customScanner).toBeInstanceOf(BingoScanner);
    });
  });

  describe('initialize', () => {
    it('should initialize the worker', async () => {
      await scanner.initialize();
      const { createWorker } = await import('tesseract.js');
      expect(createWorker).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', async () => {
      await scanner.initialize();
      await scanner.initialize();
      const { createWorker } = await import('tesseract.js');
      expect(createWorker).toHaveBeenCalledTimes(1);
    });
  });

  describe('terminate', () => {
    it('should terminate the worker', async () => {
      await scanner.initialize();
      await scanner.terminate();
      // Should be able to reinitialize after termination
      await scanner.initialize();
      const { createWorker } = await import('tesseract.js');
      expect(createWorker).toHaveBeenCalledTimes(2);
    });

    it('should handle terminate when not initialized', async () => {
      await expect(scanner.terminate()).resolves.not.toThrow();
    });
  });

  describe('scan', () => {
    it('should scan an image and return results', async () => {
      const testImage = await createTestImage();
      const result = await scanner.scan(testImage);

      expect(result).toHaveProperty('numbers');
      expect(result).toHaveProperty('grid');
      expect(result).toHaveProperty('cells');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isComplete');
      expect(result).toHaveProperty('unreadableCells');
      expect(result).toHaveProperty('processingTime');
    });

    it('should return numbers as an array', async () => {
      const testImage = await createTestImage();
      const result = await scanner.scan(testImage);

      expect(Array.isArray(result.numbers)).toBe(true);
      expect(result.numbers.length).toBe(25); // 5x5 grid
    });

    it('should return a 2D grid', async () => {
      const testImage = await createTestImage();
      const result = await scanner.scan(testImage);

      expect(Array.isArray(result.grid)).toBe(true);
      expect(result.grid.length).toBe(5); // 5 rows
      expect(result.grid[0]?.length).toBe(5); // 5 columns
    });

    it('should include cell details', async () => {
      const testImage = await createTestImage();
      const result = await scanner.scan(testImage);

      expect(result.cells.length).toBe(25);
      result.cells.forEach((cell) => {
        expect(cell).toHaveProperty('number');
        expect(cell).toHaveProperty('isFreeSpace');
        expect(cell).toHaveProperty('confidence');
        expect(cell).toHaveProperty('rawText');
        expect(cell).toHaveProperty('position');
      });
    });

    it('should track processing time', async () => {
      const testImage = await createTestImage();
      const result = await scanner.scan(testImage);

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should auto-terminate worker for single scans', async () => {
      const freshScanner = new BingoScanner();
      const testImage = await createTestImage();

      await freshScanner.scan(testImage);
      // Worker should be terminated after scan
      // Next scan should create a new worker
      await freshScanner.scan(testImage);

      const { createWorker } = await import('tesseract.js');
      expect(createWorker).toHaveBeenCalledTimes(2);
    });
  });

  describe('scanMultiple', () => {
    it('should scan multiple images', async () => {
      const images = await Promise.all([createTestImage(), createTestImage(), createTestImage()]);

      const results = await scanner.scanMultiple(images);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('numbers');
        expect(result).toHaveProperty('grid');
      });
    });

    it('should use single worker for all scans', async () => {
      const images = await Promise.all([createTestImage(), createTestImage()]);

      await scanner.scanMultiple(images);

      const { createWorker } = await import('tesseract.js');
      // Should only create one worker for multiple scans
      expect(createWorker).toHaveBeenCalledTimes(1);
    });
  });

  describe('with custom grid size', () => {
    it('should handle 3x3 grid', async () => {
      const customScanner = new BingoScanner({
        gridSize: { rows: 3, cols: 3 },
        hasFreeSpace: false,
      });

      const testImage = await createTestImage(150, 150);
      const result = await customScanner.scan(testImage);

      expect(result.numbers.length).toBe(9);
      expect(result.grid.length).toBe(3);
      expect(result.grid[0]?.length).toBe(3);

      await customScanner.terminate();
    });

    it('should handle non-square grid', async () => {
      const customScanner = new BingoScanner({
        gridSize: { rows: 4, cols: 6 },
        hasFreeSpace: false,
      });

      const testImage = await createTestImage(300, 200);
      const result = await customScanner.scan(testImage);

      expect(result.numbers.length).toBe(24);
      expect(result.grid.length).toBe(4);
      expect(result.grid[0]?.length).toBe(6);

      await customScanner.terminate();
    });
  });
});

describe('BingoScanner - FREE space handling', () => {
  it('should mark center cell as FREE in 5x5 grid', async () => {
    const scanner = new BingoScanner({
      hasFreeSpace: true,
      gridSize: { rows: 5, cols: 5 },
    });

    const testImage = await createTestImage();
    const result = await scanner.scan(testImage);

    // Center cell is at position (2, 2)
    const centerCell = result.cells.find((c) => c.position.row === 2 && c.position.col === 2);
    expect(centerCell?.isFreeSpace).toBe(true);
    expect(centerCell?.number).toBeNull();

    await scanner.terminate();
  });

  it('should not mark center as FREE when hasFreeSpace is false', async () => {
    const scanner = new BingoScanner({
      hasFreeSpace: false,
      gridSize: { rows: 5, cols: 5 },
    });

    const testImage = await createTestImage();
    const result = await scanner.scan(testImage);

    const centerCell = result.cells.find((c) => c.position.row === 2 && c.position.col === 2);
    expect(centerCell?.isFreeSpace).toBe(false);

    await scanner.terminate();
  });
});
