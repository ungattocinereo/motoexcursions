import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';

const PROJECT_ROOT = resolve(process.cwd());
const UPLOADS_ROOT = resolve(PROJECT_ROOT, 'wp-old-uploads');
const TARGET_ROOT = resolve(PROJECT_ROOT, 'public/images/tours');

const tours = [
  {
    slug: 'napoli',
    url: 'https://motoexcursions.it/excursions/napoli/',
    cover: 'Naples-italia-moto-excursions-hero-1.jpg',
    fallbackGallery: [
      'Naples-italia-moto-excursions-01.jpg',
      'Naples-italia-moto-excursions-02.jpg',
      'Naples-italia-moto-excursions-03.jpg',
      'Naples-italia-moto-excursions-04.jpg',
      'Naples-italia-moto-excursions-05.jpg',
      'Naples-italia-moto-excursions-06.jpg',
      'Naples-italia-moto-excursions-07.jpg',
      'Naples-italia-moto-excursions-08.jpg',
      'Naples-italia-moto-excursions-09.jpg',
      'Naples-italia-moto-excursions-010.jpg',
      'Naples-italia-moto-excursions-011.jpg',
      'Naples-italia-moto-excursions-012.jpg',
    ],
  },
  {
    slug: 'amalfi',
    url: 'https://motoexcursions.it/excursions/amalfi/',
    cover: 'Amalfi-italia-moto-excursions-hero-1.webp',
    fallbackGallery: [
      'Amalfi-italia-moto-excursions-01.jpg',
      'Amalfi-italia-moto-excursions-02.jpg',
      'Amalfi-italia-moto-excursions-03.jpg',
      'Amalfi-italia-moto-excursions-04.jpg',
      'Amalfi-italia-moto-excursions-05.jpg',
      'Amalfi-italia-moto-excursions-06.jpg',
      'Amalfi-italia-moto-excursions-07.jpg',
      'Amalfi-italia-moto-excursions-08.jpg',
      'Amalfi-italia-moto-excursions-09.jpg',
      'Amalfi-italia-moto-excursions-010.jpg',
      'Amalfi-italia-moto-excursions-011.jpg',
      'Amalfi-italia-moto-excursions-012.jpg',
      'Amalfi-italia-moto-excursions-013.jpg',
      'Amalfi-italia-moto-excursions-014.jpg',
      'Amalfi-italia-moto-excursions-015.jpg',
    ],
  },
  {
    slug: 'vesuvius',
    url: 'https://motoexcursions.it/excursions/vesuvius/',
    cover: 'IMG_4900.jpg',
    fallbackGallery: [
      'IMG_3886.jpg',
      'IMG_4360.jpg',
      'IMG_5828.jpg',
      'IMG_5870.jpg',
      'IMG_6376.jpg',
      'IMG_6377.jpg',
      'IMG_6399.jpg',
      'IMG_9646.jpg',
      'IMG_5846.jpg',
    ],
  },
];

const prettyPhotoRegex = /href="https:\/\/motoexcursions\.it\/wp-content\/uploads\/([^"]+)" class="pretty_photo"/g;
const sizeSuffixRegex = /-\d+x\d+(?=\.[a-z0-9]+$)/i;

const isOriginalBasename = (value) => !sizeSuffixRegex.test(value);

const walk = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }
  return files;
};

const toBasenameMap = () => {
  const files = walk(UPLOADS_ROOT);
  const map = new Map();

  for (const file of files) {
    const name = basename(file);
    const current = map.get(name);

    if (!current) {
      map.set(name, file);
      continue;
    }

    const currentIsOriginal = isOriginalBasename(basename(current));
    const nextIsOriginal = isOriginalBasename(name);

    if (!currentIsOriginal && nextIsOriginal) {
      map.set(name, file);
    }
  }

  return map;
};

const extractGallery = (html) => {
  const result = new Set();

  for (const match of html.matchAll(prettyPhotoRegex)) {
    const pathInUploads = match[1];
    const name = basename(pathInUploads).replace(sizeSuffixRegex, '');
    if (extname(name)) {
      result.add(name);
    }
  }

  return [...result];
};

if (!existsSync(UPLOADS_ROOT)) {
  throw new Error(`Missing uploads directory: ${UPLOADS_ROOT}`);
}

mkdirSync(TARGET_ROOT, { recursive: true });
const sourceByBasename = toBasenameMap();

const manifest = {};

for (const tour of tours) {
  let gallery = [...tour.fallbackGallery];

  try {
    const response = await fetch(tour.url);
    if (response.ok) {
      const html = await response.text();
      const extracted = extractGallery(html);
      if (extracted.length > 0) {
        gallery = extracted;
      }
    }
  } catch {
    // Keep fallback gallery when network is unavailable in the current environment.
  }

  const images = [...new Set([tour.cover, ...gallery])];

  const destinationDir = join(TARGET_ROOT, tour.slug);
  rmSync(destinationDir, { recursive: true, force: true });
  mkdirSync(destinationDir, { recursive: true });

  const copied = [];
  const missing = [];

  for (const image of images) {
    const sourcePath = sourceByBasename.get(image);
    if (!sourcePath) {
      missing.push(image);
      continue;
    }

    const destinationPath = join(destinationDir, image);
    cpSync(sourcePath, destinationPath);
    copied.push(image);
  }

  manifest[tour.slug] = {
    page: tour.url,
    cover: tour.cover,
    gallery,
    copied,
    missing,
  };

  console.log(`tour=${tour.slug} copied=${copied.length} missing=${missing.length}`);

  if (missing.length > 0) {
    console.log(`  missing: ${missing.join(', ')}`);
  }
}

const manifestPath = resolve(PROJECT_ROOT, 'scripts', 'tour-images.manifest.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`manifest: ${relative(PROJECT_ROOT, manifestPath)}`);
