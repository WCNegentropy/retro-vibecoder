/**
 * Seeded Random Number Generator
 *
 * Uses a Mulberry32 PRNG for deterministic, reproducible random number generation.
 * Given the same seed, the sequence of random numbers will always be identical.
 */

/**
 * Weighted item for probabilistic selection
 */
export interface WeightedItem<T> {
  value: T;
  weight: number;
}

/**
 * SeededRNG provides deterministic pseudo-random number generation.
 *
 * This is the bedrock of reproducibility in the Universal Procedural Generator.
 * Every project generated from the same seed will be identical.
 *
 * @example
 * ```typescript
 * const rng = new SeededRNG(42);
 *
 * // Same seed always produces same sequence
 * console.log(rng.float()); // 0.6011037519201636
 * console.log(rng.int(1, 10)); // 7
 * console.log(rng.pick(['a', 'b', 'c'])); // 'c'
 * ```
 */
export class SeededRNG {
  private state: number;
  private readonly initialSeed: number;

  /**
   * Creates a new SeededRNG instance.
   *
   * @param seed - The seed value. Same seed = same sequence.
   */
  constructor(seed: number) {
    this.initialSeed = seed;
    this.state = seed >>> 0; // Ensure unsigned 32-bit
  }

  /**
   * Get the original seed used to create this RNG.
   */
  get seed(): number {
    return this.initialSeed;
  }

  /**
   * Reset the RNG to its initial state.
   * Useful for regenerating from the same starting point.
   */
  reset(): void {
    this.state = this.initialSeed >>> 0;
  }

  /**
   * Generate the next raw 32-bit unsigned integer.
   * Uses the Mulberry32 algorithm.
   *
   * @returns A 32-bit unsigned integer
   */
  private next(): number {
    // Mulberry32 algorithm
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Generate a random float in [0, 1).
   *
   * @returns A float between 0 (inclusive) and 1 (exclusive)
   */
  float(): number {
    return this.next() / 4294967296;
  }

  /**
   * Generate a random integer in [min, max] (inclusive).
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns An integer in the specified range
   */
  int(min: number, max: number): number {
    const range = max - min + 1;
    return Math.floor(this.float() * range) + min;
  }

  /**
   * Generate a random boolean.
   *
   * @param probability - Probability of true (default: 0.5)
   * @returns true or false
   */
  bool(probability = 0.5): boolean {
    return this.float() < probability;
  }

  /**
   * Pick a random element from an array.
   *
   * @param items - Array of items to choose from
   * @returns A randomly selected item
   * @throws Error if array is empty
   */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = this.int(0, items.length - 1);
    return items[index];
  }

  /**
   * Pick multiple unique random elements from an array.
   *
   * @param items - Array of items to choose from
   * @param count - Number of items to pick
   * @returns Array of randomly selected unique items
   */
  pickMultiple<T>(items: readonly T[], count: number): T[] {
    if (count > items.length) {
      throw new Error(`Cannot pick ${count} items from array of length ${items.length}`);
    }

    const available = [...items];
    const result: T[] = [];

    for (let i = 0; i < count; i++) {
      const index = this.int(0, available.length - 1);
      result.push(available[index]);
      available.splice(index, 1);
    }

    return result;
  }

  /**
   * Pick a random element with weighted probabilities.
   *
   * @param items - Array of weighted items
   * @returns The selected item's value
   * @throws Error if array is empty or all weights are zero
   *
   * @example
   * ```typescript
   * const rng = new SeededRNG(42);
   * const result = rng.pickWeighted([
   *   { value: 'common', weight: 10 },
   *   { value: 'rare', weight: 1 }
   * ]);
   * // 'common' is 10x more likely than 'rare'
   * ```
   */
  pickWeighted<T>(items: readonly WeightedItem<T>[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) {
      throw new Error('Total weight cannot be zero');
    }

    let threshold = this.float() * totalWeight;

    for (const item of items) {
      threshold -= item.weight;
      if (threshold <= 0) {
        return item.value;
      }
    }

    // Fallback (should not reach here due to floating point)
    return items[items.length - 1].value;
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm.
   *
   * @param items - Array to shuffle (will be modified)
   * @returns The shuffled array (same reference)
   */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  /**
   * Generate a random string of specified length.
   *
   * @param length - Length of the string
   * @param charset - Characters to use (default: alphanumeric)
   * @returns A random string
   */
  string(length: number, charset = 'abcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[this.int(0, charset.length - 1)];
    }
    return result;
  }

  /**
   * Create a new RNG instance derived from the current state.
   * Useful for creating independent sub-sequences.
   *
   * @returns A new SeededRNG with state derived from current state
   */
  fork(): SeededRNG {
    return new SeededRNG(this.next());
  }

  /**
   * Generate a UUID v4-like string (not cryptographically secure).
   *
   * @returns A UUID-like string
   */
  uuid(): string {
    const hex = (n: number, len: number) => n.toString(16).padStart(len, '0');

    return [
      hex(this.int(0, 0xffffffff), 8),
      hex(this.int(0, 0xffff), 4),
      hex((this.int(0, 0xffff) & 0x0fff) | 0x4000, 4), // Version 4
      hex((this.int(0, 0xffff) & 0x3fff) | 0x8000, 4), // Variant 1
      hex(this.int(0, 0xffffffff), 8) + hex(this.int(0, 0xffff), 4),
    ].join('-');
  }
}

/**
 * Create a SeededRNG from various seed sources.
 */
export const RNGFactory = {
  /**
   * Create RNG from a numeric seed.
   */
  fromSeed(seed: number): SeededRNG {
    return new SeededRNG(seed);
  },

  /**
   * Create RNG from a string (hashed to number).
   */
  fromString(str: string): SeededRNG {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return new SeededRNG(Math.abs(hash));
  },

  /**
   * Create RNG from current timestamp.
   * Note: This breaks reproducibility!
   */
  fromTimestamp(): SeededRNG {
    return new SeededRNG(Date.now());
  },
};
