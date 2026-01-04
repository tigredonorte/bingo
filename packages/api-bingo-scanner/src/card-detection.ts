import sharp from 'sharp';
import type { ImageInput, DetectedCard, MultiCardScannerOptions } from './types';
import { DEFAULT_MULTI_CARD_OPTIONS } from './types';

/**
 * Detects and extracts multiple bingo cards from a single image
 * Uses a grid-based approach to split the image into card regions
 */
export async function detectCards(
  input: ImageInput,
  options: Pick<MultiCardScannerOptions, 'cardLayout' | 'expectedCards' | 'minCardAreaPercent' | 'maxCardAreaPercent'> = {}
): Promise<DetectedCard[]> {
  const image = sharp(input as Buffer | string);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions');
  }

  const { width, height } = metadata;
  const imageArea = width * height;
  const minArea = (options.minCardAreaPercent ?? DEFAULT_MULTI_CARD_OPTIONS.minCardAreaPercent) * imageArea;
  const maxArea = (options.maxCardAreaPercent ?? DEFAULT_MULTI_CARD_OPTIONS.maxCardAreaPercent) * imageArea;

  // If layout is specified, use it to split the image
  if (options.cardLayout) {
    return splitByLayout(input, width, height, options.cardLayout, minArea, maxArea);
  }

  // If expected cards count is specified, try to determine optimal layout
  if (options.expectedCards) {
    const layout = calculateOptimalLayout(options.expectedCards, width, height);
    return splitByLayout(input, width, height, layout, minArea, maxArea);
  }

  // Default: treat the entire image as a single card
  const imageBuffer = await sharp(input as Buffer | string).toBuffer();
  return [
    {
      bounds: { x: 0, y: 0, width, height },
      index: 0,
      imageBuffer,
    },
  ];
}

/**
 * Splits an image into cards based on a grid layout
 */
async function splitByLayout(
  input: ImageInput,
  imageWidth: number,
  imageHeight: number,
  layout: { rows: number; cols: number },
  minArea: number,
  maxArea: number
): Promise<DetectedCard[]> {
  const { rows, cols } = layout;
  const cardWidth = Math.floor(imageWidth / cols);
  const cardHeight = Math.floor(imageHeight / rows);
  const cardArea = cardWidth * cardHeight;

  // Validate card size
  if (cardArea < minArea || cardArea > maxArea) {
    throw new Error(
      `Detected card size (${cardWidth}x${cardHeight}) is outside the allowed range. ` +
        `Card area: ${cardArea}, allowed: ${minArea}-${maxArea}`
    );
  }

  const cards: DetectedCard[] = [];
  let index = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cardWidth;
      const y = row * cardHeight;

      // Extract the card region
      const cardBuffer = await sharp(input as Buffer | string)
        .extract({
          left: x,
          top: y,
          width: Math.min(cardWidth, imageWidth - x),
          height: Math.min(cardHeight, imageHeight - y),
        })
        .toBuffer();

      cards.push({
        bounds: {
          x,
          y,
          width: cardWidth,
          height: cardHeight,
        },
        index,
        imageBuffer: cardBuffer,
      });

      index++;
    }
  }

  return cards;
}

/**
 * Calculates the optimal grid layout for a given number of cards
 * Tries to match the aspect ratio of the image
 */
function calculateOptimalLayout(
  cardCount: number,
  imageWidth: number,
  imageHeight: number
): { rows: number; cols: number } {
  const aspectRatio = imageWidth / imageHeight;

  // Find the best row/column combination
  let bestLayout = { rows: 1, cols: cardCount };
  let bestScore = Infinity;

  for (let rows = 1; rows <= cardCount; rows++) {
    if (cardCount % rows === 0) {
      const cols = cardCount / rows;
      const layoutRatio = cols / rows;
      const score = Math.abs(layoutRatio - aspectRatio);

      if (score < bestScore) {
        bestScore = score;
        bestLayout = { rows, cols };
      }
    }
  }

  return bestLayout;
}

/**
 * Detects cards by splitting the image into equal parts
 * @param input - The input image
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns Array of detected cards
 */
export async function splitImage(
  input: ImageInput,
  rows: number,
  cols: number
): Promise<DetectedCard[]> {
  return detectCards(input, { cardLayout: { rows, cols } });
}

/**
 * Extracts a single card region from an image
 */
export async function extractCardRegion(
  input: ImageInput,
  bounds: { x: number; y: number; width: number; height: number }
): Promise<Buffer> {
  return sharp(input as Buffer | string)
    .extract({
      left: bounds.x,
      top: bounds.y,
      width: bounds.width,
      height: bounds.height,
    })
    .toBuffer();
}
