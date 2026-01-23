/**
 * Web Frontend Strategies
 *
 * Exports all web/frontend generation strategies.
 */

export {
  ReactStrategy,
  VueStrategy,
  SvelteStrategy,
  SolidStrategy,
  AngularStrategy,
  NextJSStrategy,
  NuxtStrategy,
  SvelteKitStrategy,
  QwikStrategy,
} from './vite.js';

import {
  ReactStrategy,
  VueStrategy,
  SvelteStrategy,
  SolidStrategy,
  AngularStrategy,
  NextJSStrategy,
  NuxtStrategy,
  SvelteKitStrategy,
  QwikStrategy,
} from './vite.js';
import type { GenerationStrategy } from '../../types.js';

/**
 * All web strategies combined
 */
export const WebStrategies: GenerationStrategy[] = [
  ReactStrategy,
  VueStrategy,
  SvelteStrategy,
  SolidStrategy,
  AngularStrategy,
  NextJSStrategy,
  NuxtStrategy,
  SvelteKitStrategy,
  QwikStrategy,
];
