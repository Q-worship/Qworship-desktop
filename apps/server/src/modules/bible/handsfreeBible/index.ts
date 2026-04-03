export * from './types.js';
export * from './aliasNormalizer.js';
export * from './fuzzyBibleMatcher.js';

import { initializeAliasNormalizer } from './aliasNormalizer.js';
import { initializeFuzzyMatcher } from './fuzzyBibleMatcher.js';

let initialized = false;

export function initializeHandsfreeBibleModule(): void {
  if (initialized) {
    console.log('Hands-free Bible module already initialized');
    return;
  }
  
  console.log('🔧 Initializing Hands-free Bible module...');
  const startTime = performance.now();
  
  initializeAliasNormalizer();
  initializeFuzzyMatcher();
  
  const duration = performance.now() - startTime;
  console.log(`✅ Hands-free Bible module initialized in ${duration.toFixed(2)}ms`);
  
  initialized = true;
}

export function isModuleInitialized(): boolean {
  return initialized;
}
