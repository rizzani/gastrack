/**
 * Unit tests for applyMovement (pure logic).
 */

import { applyMovement, MovementError } from '../movements';

describe('applyMovement', () => {
  describe('swap', () => {
    it('decrements full and increments empty', () => {
      const r = applyMovement({ type: 'swap', quantity: 2, full: 10, empty: 3, owed: 0 });
      expect(r).toEqual({ full: 8, empty: 5, owedDelta: 0 });
    });
    it('throws when full < quantity', () => {
      expect(() =>
        applyMovement({ type: 'swap', quantity: 5, full: 3, empty: 0, owed: 0 })
      ).toThrow(MovementError);
      try {
        applyMovement({ type: 'swap', quantity: 5, full: 3, empty: 0, owed: 0 });
      } catch (e) {
        expect((e as MovementError).code).toBe('INSUFFICIENT_FULL');
      }
    });
  });

  describe('loan', () => {
    it('decrements full and increases owed delta', () => {
      const r = applyMovement({ type: 'loan', quantity: 1, full: 5, empty: 2, owed: 0 });
      expect(r).toEqual({ full: 4, empty: 2, owedDelta: 1 });
    });
    it('throws when full < quantity', () => {
      expect(() =>
        applyMovement({ type: 'loan', quantity: 10, full: 4, empty: 0, owed: 0 })
      ).toThrow(MovementError);
      try {
        applyMovement({ type: 'loan', quantity: 10, full: 4, empty: 0, owed: 0 });
      } catch (e) {
        expect((e as MovementError).code).toBe('INSUFFICIENT_FULL');
      }
    });
  });

  describe('return', () => {
    it('increments empty and decreases owed delta', () => {
      const r = applyMovement({ type: 'return', quantity: 2, full: 5, empty: 1, owed: 3 });
      expect(r).toEqual({ full: 5, empty: 3, owedDelta: -2 });
    });
    it('throws when owed < quantity', () => {
      expect(() =>
        applyMovement({ type: 'return', quantity: 5, full: 10, empty: 2, owed: 2 })
      ).toThrow(MovementError);
      try {
        applyMovement({ type: 'return', quantity: 5, full: 10, empty: 2, owed: 2 });
      } catch (e) {
        expect((e as MovementError).code).toBe('INSUFFICIENT_OWED');
      }
    });
  });

  describe('restock', () => {
    it('increments full and decrements empty', () => {
      const r = applyMovement({ type: 'restock', quantity: 4, full: 2, empty: 10, owed: 0 });
      expect(r).toEqual({ full: 6, empty: 6, owedDelta: 0 });
    });
    it('throws when empty < quantity', () => {
      expect(() =>
        applyMovement({ type: 'restock', quantity: 8, full: 5, empty: 3, owed: 0 })
      ).toThrow(MovementError);
      try {
        applyMovement({ type: 'restock', quantity: 8, full: 5, empty: 3, owed: 0 });
      } catch (e) {
        expect((e as MovementError).code).toBe('INSUFFICIENT_EMPTY');
      }
    });
    it('allows override when restockAdjustmentNote contains "adjustment" (empty → 0)', () => {
      const r = applyMovement({
        type: 'restock',
        quantity: 8,
        full: 5,
        empty: 3,
        owed: 0,
        restockAdjustmentNote: 'adjustment: received from plant',
      });
      expect(r).toEqual({ full: 13, empty: 0, owedDelta: 0 });
    });
    it('still throws when empty < quantity and note lacks "adjustment"', () => {
      expect(() =>
        applyMovement({
          type: 'restock',
          quantity: 8,
          full: 5,
          empty: 3,
          owed: 0,
          restockAdjustmentNote: 'received from plant',
        })
      ).toThrow(MovementError);
    });
  });

  describe('invalid quantity', () => {
    it('throws for zero', () => {
      expect(() =>
        applyMovement({ type: 'swap', quantity: 0, full: 5, empty: 0, owed: 0 })
      ).toThrow(MovementError);
      try {
        applyMovement({ type: 'swap', quantity: 0, full: 5, empty: 0, owed: 0 });
      } catch (e) {
        expect((e as MovementError).code).toBe('INVALID_QUANTITY');
      }
    });
    it('throws for negative', () => {
      expect(() =>
        applyMovement({ type: 'swap', quantity: -1, full: 5, empty: 0, owed: 0 })
      ).toThrow(MovementError);
    });
  });
});
