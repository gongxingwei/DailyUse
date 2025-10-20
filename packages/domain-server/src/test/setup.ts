/**
 * Domain Server Test Setup
 * @description Basic test environment setup for domain-server package
 */

import { beforeEach, afterEach } from 'vitest';

beforeEach(async () => {
  // Set timezone to UTC for consistent date handling
  process.env.TZ = 'UTC';
});

afterEach(async () => {
  // Cleanup if needed
});
