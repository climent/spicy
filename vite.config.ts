import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {execSync} from 'child_process';
import fs from 'fs';

export default defineConfig(() => {
  let commitHash = '';

  // 1. Try to get commit hash from environment variables
  if (process.env.VITE_COMMIT_HASH) {
    commitHash = process.env.VITE_COMMIT_HASH.trim();
  } else if (process.env.COMMIT_SHA) {
    commitHash = process.env.COMMIT_SHA.trim().substring(0, 7);
  } else if (process.env.GITHUB_SHA) {
    commitHash = process.env.GITHUB_SHA.trim().substring(0, 7);
  }

  // 2. Try to get commit hash from Git if still empty
  if (!commitHash) {
    try {
      commitHash = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    } catch (e) {
      // Ignore Git failures
    }
  }

  // 3. Fallback to existing permanent text files
  if (!commitHash) {
    const possibleFiles = ['commit.txt', 'version.txt', 'public/version.txt'];
    for (const file of possibleFiles) {
      try {
        const filePath = path.resolve(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8').trim();
          if (content) {
            commitHash = content;
            break;
          }
        }
      } catch (e) {
        // Ignore file reading errors
      }
    }
  }

  // 4. Fallback to Cloud Run revision
  if (!commitHash && process.env.K_REVISION) {
    const parts = process.env.K_REVISION.split('-');
    commitHash = parts[parts.length - 1] || 'dev';
  }

  // Final fallback to default
  if (!commitHash) {
    commitHash = 'dev';
  }

  // Dynamically generate the version/commit files on disk so they are bundled permanently
  try {
    const publicDir = path.resolve(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    // Write to public/version.txt (accessible in built dist/) and version.txt (root fallback)
    fs.writeFileSync(path.join(publicDir, 'version.txt'), commitHash, 'utf-8');
    fs.writeFileSync(path.resolve(__dirname, 'version.txt'), commitHash, 'utf-8');
  } catch (err) {
    // Ignore file writing errors
  }

  const hash = commitHash;

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
