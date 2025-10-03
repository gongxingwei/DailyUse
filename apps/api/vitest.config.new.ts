/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedConfig } from '../../vitest.shared';

/**
 * Vitest Configuration for API application
 *
 * This configuration merges with the shared config and adds project-specific settings.
 * The workspace configuration (vitest.workspace.ts) takes precedence when running tests
 * from the workspace root.
 */
export default mergeConfig(
  createSharedConfig({
    projectRoot: __dirname,
    environment: 'node',
  }),
  defineConfig({
    test: {
      name: 'api',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['node_modules', 'dist', '.git', '.cache', 'src/test/setup.ts', 'prisma/**/*'],
      testTimeout: 30000,
      // API tests use single fork to avoid database conflicts
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      globalSetup: './src/test/globalSetup.ts',
    },
  }),
);
