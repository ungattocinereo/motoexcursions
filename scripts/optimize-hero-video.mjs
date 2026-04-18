#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const source = resolve(root, 'video/sito.mp4');
const outDir = resolve(root, 'public/video');

if (!existsSync(source)) {
  console.error(`Source video not found: ${source}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const srcMtime = statSync(source).mtimeMs;
const isStale = (p) => !existsSync(p) || statSync(p).mtimeMs < srcMtime;

const run = (args) => {
  console.log('> ffmpeg', args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' '));
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
};

const tasks = [
  {
    name: 'sito-desktop.mp4',
    args: ['-y', '-i', source,
      '-vf', 'scale=900:1600',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
      '-profile:v', 'main', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-an',
      resolve(outDir, 'sito-desktop.mp4'),
    ],
  },
  {
    name: 'sito-mobile.mp4',
    args: ['-y', '-i', source,
      '-vf', 'scale=540:960',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
      '-profile:v', 'main', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-an',
      resolve(outDir, 'sito-mobile.mp4'),
    ],
  },
  {
    name: 'sito-desktop.webm',
    args: ['-y', '-i', source,
      '-vf', 'scale=900:1600',
      '-c:v', 'libvpx-vp9', '-b:v', '900k',
      '-deadline', 'good', '-cpu-used', '2',
      '-row-mt', '1', '-tile-columns', '2',
      '-an',
      resolve(outDir, 'sito-desktop.webm'),
    ],
  },
  {
    name: 'sito-mobile.webm',
    args: ['-y', '-i', source,
      '-vf', 'scale=540:960',
      '-c:v', 'libvpx-vp9', '-b:v', '450k',
      '-deadline', 'good', '-cpu-used', '2',
      '-row-mt', '1', '-tile-columns', '2',
      '-an',
      resolve(outDir, 'sito-mobile.webm'),
    ],
  },
  {
    name: 'sito-poster.jpg',
    args: ['-y', '-i', source,
      '-ss', '1.5', '-frames:v', '1',
      '-vf', 'scale=720:1280',
      '-q:v', '5', '-update', '1',
      resolve(outDir, 'sito-poster.jpg'),
    ],
  },
];

let skipped = 0;
for (const task of tasks) {
  const outPath = task.args[task.args.length - 1];
  if (!isStale(outPath)) {
    console.log(`[skip] ${task.name} is newer than source`);
    skipped++;
    continue;
  }
  console.log(`[encode] ${task.name}`);
  run(task.args);
}

console.log(`\nDone. ${tasks.length - skipped} encoded, ${skipped} skipped.`);
for (const task of tasks) {
  const outPath = task.args[task.args.length - 1];
  if (existsSync(outPath)) {
    const size = statSync(outPath).size;
    const kb = (size / 1024).toFixed(0);
    const mb = (size / 1024 / 1024).toFixed(2);
    console.log(`  ${task.name.padEnd(22)} ${size >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`}`);
  }
}
