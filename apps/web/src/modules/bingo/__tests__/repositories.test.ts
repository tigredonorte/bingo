/**
 * Unit tests for bingo repositories
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCardsRepository } from '../repositories/cards.repository';
import { PrismaCellsRepository } from '../repositories/cells.repository';
import { PrismaSessionsRepository } from '../repositories/sessions.repository';
import type { BingoCard, BingoCell, BingoSession, BingoSessionPlayer } from '../types';

// Mock data factories
const createMockCard = (overrides?: Partial<BingoCard>): BingoCard => ({
  id: 'card-123',
  userId: 'user-456',
  sessionPlayerId: null,
  source: 'GENERATED',
  format: '5x5',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createMockCell = (overrides?: Partial<BingoCell>): BingoCell => ({
  id: 'cell-123',
  cardId: 'card-123',
  index: 0,
  value: 5,
  type: 'NUMBER',
  marked: false,
  ...overrides,
});

const createMockSession = (overrides?: Partial<BingoSession>): BingoSession => ({
  id: 'session-123',
  name: 'Test Session',
  format: '5x5',
  status: 'ACTIVE',
  calledNumbers: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createMockSessionPlayer = (overrides?: Partial<BingoSessionPlayer>): BingoSessionPlayer => ({
  id: 'player-123',
  userId: 'user-456',
  sessionId: 'session-123',
  joinedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('PrismaCardsRepository', () => {
  const mockPrisma = {
    bingoCard: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let repository: PrismaCardsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCardsRepository(mockPrisma);
  });

  describe('findById', () => {
    it('should return card with cells and sessionPlayer when found', async () => {
      const mockCard = { ...createMockCard(), cells: [createMockCell()], sessionPlayer: null };
      mockPrisma.bingoCard.findUnique.mockResolvedValue(mockCard);

      const result = await repository.findById('card-123');

      expect(result).toEqual(mockCard);
      expect(mockPrisma.bingoCard.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        include: { cells: true, sessionPlayer: true },
      });
    });

    it('should return null when card not found', async () => {
      mockPrisma.bingoCard.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return cards for user with cells and sessionPlayer', async () => {
      const mockCards = [{ ...createMockCard(), cells: [createMockCell()], sessionPlayer: null }];
      mockPrisma.bingoCard.findMany.mockResolvedValue(mockCards);

      const result = await repository.findByUserId('user-456');

      expect(result).toEqual(mockCards);
      expect(mockPrisma.bingoCard.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        include: { cells: true, sessionPlayer: true },
      });
    });
  });

  describe('findBySessionPlayerId', () => {
    it('should return cards for session player with cells and sessionPlayer', async () => {
      const mockCards = [{ ...createMockCard({ sessionPlayerId: 'player-123' }), cells: [], sessionPlayer: createMockSessionPlayer() }];
      mockPrisma.bingoCard.findMany.mockResolvedValue(mockCards);

      const result = await repository.findBySessionPlayerId('player-123');

      expect(result).toEqual(mockCards);
      expect(mockPrisma.bingoCard.findMany).toHaveBeenCalledWith({
        where: { sessionPlayerId: 'player-123' },
        include: { cells: true, sessionPlayer: true },
      });
    });
  });

  describe('findStandaloneByUserId', () => {
    it('should return standalone scanned cards for user', async () => {
      const mockCards = [{ ...createMockCard({ source: 'SCANNED', sessionPlayerId: null }), cells: [], sessionPlayer: null }];
      mockPrisma.bingoCard.findMany.mockResolvedValue(mockCards);

      const result = await repository.findStandaloneByUserId('user-456');

      expect(result).toEqual(mockCards);
      expect(mockPrisma.bingoCard.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-456',
          sessionPlayerId: null,
          source: 'SCANNED',
        },
        include: { cells: true, sessionPlayer: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const cardData = {
        userId: 'user-456',
        sessionPlayerId: null,
        source: 'GENERATED' as const,
        format: '5x5',
      };
      const createdCard = createMockCard(cardData);
      mockPrisma.bingoCard.create.mockResolvedValue(createdCard);

      const result = await repository.create(cardData);

      expect(result).toEqual(createdCard);
      expect(mockPrisma.bingoCard.create).toHaveBeenCalledWith({ data: cardData });
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const updatedCard = createMockCard({ format: '3x9' });
      mockPrisma.bingoCard.update.mockResolvedValue(updatedCard);

      const result = await repository.update('card-123', { format: '3x9' });

      expect(result).toEqual(updatedCard);
      expect(mockPrisma.bingoCard.update).toHaveBeenCalledWith({
        where: { id: 'card-123' },
        data: { format: '3x9' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a card', async () => {
      mockPrisma.bingoCard.delete.mockResolvedValue(createMockCard());

      await repository.delete('card-123');

      expect(mockPrisma.bingoCard.delete).toHaveBeenCalledWith({
        where: { id: 'card-123' },
      });
    });
  });
});

describe('PrismaCellsRepository', () => {
  const mockPrisma = {
    bingoCell: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  let repository: PrismaCellsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCellsRepository(mockPrisma);
  });

  describe('findByCardId', () => {
    it('should return cells ordered by index ascending', async () => {
      const mockCells = [
        createMockCell({ index: 0 }),
        createMockCell({ index: 1 }),
        createMockCell({ index: 2 }),
      ];
      mockPrisma.bingoCell.findMany.mockResolvedValue(mockCells);

      const result = await repository.findByCardId('card-123');

      expect(result).toEqual(mockCells);
      expect(mockPrisma.bingoCell.findMany).toHaveBeenCalledWith({
        where: { cardId: 'card-123' },
        orderBy: { index: 'asc' },
      });
    });
  });

  describe('findByCardIdAndIndex', () => {
    it('should return cell when found', async () => {
      const mockCell = createMockCell({ index: 5 });
      mockPrisma.bingoCell.findUnique.mockResolvedValue(mockCell);

      const result = await repository.findByCardIdAndIndex('card-123', 5);

      expect(result).toEqual(mockCell);
      expect(mockPrisma.bingoCell.findUnique).toHaveBeenCalledWith({
        where: {
          cardId_index: { cardId: 'card-123', index: 5 },
        },
      });
    });

    it('should return null when cell not found', async () => {
      mockPrisma.bingoCell.findUnique.mockResolvedValue(null);

      const result = await repository.findByCardIdAndIndex('card-123', 99);

      expect(result).toBeNull();
    });
  });

  describe('updateMarkedStatus', () => {
    it('should update cell marked status', async () => {
      const updatedCell = createMockCell({ marked: true });
      mockPrisma.bingoCell.update.mockResolvedValue(updatedCell);

      const result = await repository.updateMarkedStatus('card-123', 0, true);

      expect(result).toEqual(updatedCell);
      expect(mockPrisma.bingoCell.update).toHaveBeenCalledWith({
        where: {
          cardId_index: { cardId: 'card-123', index: 0 },
        },
        data: { marked: true },
      });
    });
  });

  describe('bulkUpdateMarkedStatus', () => {
    it('should update multiple cells in parallel within a transaction', async () => {
      const updates = [
        { index: 0, marked: true },
        { index: 1, marked: false },
        { index: 2, marked: true },
      ];

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const txMock = {
          bingoCell: {
            update: vi.fn().mockImplementation(({ where }) => {
              const update = updates.find((u) => u.index === where.cardId_index.index);
              return Promise.resolve(createMockCell({ index: where.cardId_index.index, marked: update?.marked }));
            }),
          },
        };
        return fn(txMock);
      });

      const result = await repository.bulkUpdateMarkedStatus('card-123', updates);

      expect(result).toHaveLength(3);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('createMany', () => {
    it('should create multiple cells', async () => {
      const cellsData = [
        { cardId: 'card-123', index: 0, value: 5, type: 'NUMBER' as const, marked: false },
        { cardId: 'card-123', index: 1, value: 10, type: 'NUMBER' as const, marked: false },
      ];
      mockPrisma.bingoCell.createMany.mockResolvedValue({ count: 2 });

      const result = await repository.createMany(cellsData);

      expect(result).toEqual({ count: 2 });
      expect(mockPrisma.bingoCell.createMany).toHaveBeenCalledWith({ data: cellsData });
    });
  });
});

describe('PrismaSessionsRepository', () => {
  const mockPrisma = {
    bingoSession: {
      findUnique: vi.fn(),
    },
    bingoSessionPlayer: {
      findUnique: vi.fn(),
    },
  };

  let repository: PrismaSessionsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaSessionsRepository(mockPrisma);
  });

  describe('findById', () => {
    it('should return session when found', async () => {
      const mockSession = createMockSession();
      mockPrisma.bingoSession.findUnique.mockResolvedValue(mockSession);

      const result = await repository.findById('session-123');

      expect(result).toEqual(mockSession);
      expect(mockPrisma.bingoSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });

    it('should return null when session not found', async () => {
      mockPrisma.bingoSession.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findPlayerByUserAndSession', () => {
    it('should return session player when found', async () => {
      const mockPlayer = createMockSessionPlayer();
      mockPrisma.bingoSessionPlayer.findUnique.mockResolvedValue(mockPlayer);

      const result = await repository.findPlayerByUserAndSession('user-456', 'session-123');

      expect(result).toEqual(mockPlayer);
      expect(mockPrisma.bingoSessionPlayer.findUnique).toHaveBeenCalledWith({
        where: {
          userId_sessionId: { userId: 'user-456', sessionId: 'session-123' },
        },
      });
    });

    it('should return null when player not found', async () => {
      mockPrisma.bingoSessionPlayer.findUnique.mockResolvedValue(null);

      const result = await repository.findPlayerByUserAndSession('user-456', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getSessionFormat', () => {
    it('should return format using select for efficiency', async () => {
      mockPrisma.bingoSession.findUnique.mockResolvedValue({ format: '5x5' });

      const result = await repository.getSessionFormat('session-123');

      expect(result).toBe('5x5');
      expect(mockPrisma.bingoSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        select: { format: true },
      });
    });

    it('should return null when session not found', async () => {
      mockPrisma.bingoSession.findUnique.mockResolvedValue(null);

      const result = await repository.getSessionFormat('non-existent');

      expect(result).toBeNull();
    });
  });
});
