#!/usr/bin/env node
/**
 * Rasterise brand SVGs to PNG for Next.js, Expo, and marketing.
 * Source of truth is public/brand/*.svg
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const brand = path.join(root, "public", "brand");

async function png(svgFile, dest, size, extra = {}) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(path.join(brand, svgFile), { density: 384 })
    .resize(size, size, {
      fit: "contain",
      background: extra.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(dest);
  console.log(path.relative(root, dest));
}

async function pngWide(svgFile, dest, width) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(path.join(brand, svgFile), { density: 384 }).resize({ width }).png().toFile(dest);
  console.log(path.relative(root, dest));
}

async function solid(dest, size, colour) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: colour,
    },
  })
    .png()
    .toFile(dest);
  console.log(path.relative(root, dest));
}

async function main() {
  const mobile = path.join(root, "mobile", "assets");
  const marketing = path.join(root, "marketing");
  fs.mkdirSync(mobile, { recursive: true });
  fs.mkdirSync(marketing, { recursive: true });

  await png("logo-mark.svg", path.join(brand, "logo-mark-1024.png"), 1024);
  await png("logo-mark.svg", path.join(root, "app", "apple-icon.png"), 180);
  await png("logo-mark.svg", path.join(root, "public", "favicon-32.png"), 32);
  await png("logo-mark.svg", path.join(mobile, "icon.png"), 1024);
  await png("logo-mark.svg", path.join(mobile, "splash-icon.png"), 512);
  await png("logo-mark.svg", path.join(mobile, "favicon.png"), 48);
  await png("logo-android-foreground.svg", path.join(mobile, "android-icon-foreground.png"), 1024);
  await png("logo-android-monochrome.svg", path.join(mobile, "android-icon-monochrome.png"), 1024);
  await solid(path.join(mobile, "android-icon-background.png"), 1024, "#1B2A4A");
  await pngWide("logo-lockup.svg", path.join(brand, "logo-lockup.png"), 2080);
  await pngWide("logo-lockup-on-navy.svg", path.join(brand, "logo-lockup-on-navy.png"), 2080);
  await png("logo-mark.svg", path.join(marketing, "logo-mark.png"), 1024);
  await pngWide("logo-lockup.svg", path.join(marketing, "logo-lockup-paper.png"), 2080);
  await pngWide("logo-lockup-on-navy.svg", path.join(marketing, "logo-lockup-navy.png"), 2080);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
