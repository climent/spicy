import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {execSync} from 'child_process';

export default defineConfig(() => {
  let commitHash = 'dev';
  try {
    commitHash = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
  } catch (e) {
    if (process.env.K_REVISION) {
      const parts = process.env.K_REVISION.split('-');
      commitHash = parts[parts.length - 1] || 'dev';
    }
  }

  const hash = process.env.VITE_COMMIT_HASH || commitHash;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(hash),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
