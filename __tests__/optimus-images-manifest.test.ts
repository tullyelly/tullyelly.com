/** @jest-environment node */
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve("scripts/gen-optimus-images-manifest.mjs");

describe("Optimus image manifest generation", () => {
  let tempDir: string;
  let imageDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "optimus-manifest-"));
    imageDir = path.join(tempDir, "public/images/optimus");
    manifestPath = path.join(
      tempDir,
      "lib/images/optimus-images-manifest.json",
    );
    await mkdir(imageDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const generate = () =>
    execFileAsync(process.execPath, [scriptPath], { cwd: tempDir });

  const createImage = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: "white" } });

  it("retains sorted URLs and produces deterministic intrinsic metadata", async () => {
    await mkdir(path.join(imageDir, "nested"));
    await createImage(45, 60).webp().toFile(path.join(imageDir, "z.webp"));
    await createImage(30, 20).png().toFile(path.join(imageDir, "nested/a.PNG"));
    await createImage(25, 35).jpeg().toFile(path.join(imageDir, "b.jpg"));
    await writeFile(path.join(imageDir, "ignored.txt"), "not an image");

    await generate();

    const firstOutput = await readFile(manifestPath, "utf8");
    expect(JSON.parse(firstOutput)).toEqual({
      urls: [
        "/images/optimus/b.jpg",
        "/images/optimus/nested/a.PNG",
        "/images/optimus/z.webp",
      ],
      images: [
        { src: "/images/optimus/b.jpg", width: 25, height: 35 },
        { src: "/images/optimus/nested/a.PNG", width: 30, height: 20 },
        { src: "/images/optimus/z.webp", width: 45, height: 60 },
      ],
    });

    // The optimizer calls the exported function rather than the CLI entrypoint.
    await execFileAsync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `import { writeManifest } from ${JSON.stringify(pathToFileURL(scriptPath).href)}; await writeManifest();`,
      ],
      { cwd: tempDir },
    );
    expect(await readFile(manifestPath, "utf8")).toBe(firstOutput);
  });

  it("adds, refreshes, and removes only changed image metadata", async () => {
    const firstPath = path.join(imageDir, "first.png");
    const removedPath = path.join(imageDir, "removed.png");
    await createImage(10, 20).png().toFile(firstPath);
    await createImage(30, 40).png().toFile(removedPath);

    await generate();

    const addedPath = path.join(imageDir, "added.png");
    await createImage(50, 60).png().toFile(addedPath);
    await createImage(70, 80).png().toFile(firstPath);
    await rm(removedPath);

    await generate();
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual({
      urls: ["/images/optimus/added.png", "/images/optimus/first.png"],
      images: [
        { src: "/images/optimus/added.png", width: 50, height: 60 },
        { src: "/images/optimus/first.png", width: 70, height: 80 },
      ],
    });
  });

  it("reuses cached dimensions when the filesystem fingerprint is unchanged", async () => {
    const imagePath = path.join(imageDir, "cached.png");
    const timestamp = new Date("2026-01-01T00:00:00.000Z");
    await createImage(22, 33).png().toFile(imagePath);
    await utimes(imagePath, timestamp, timestamp);
    await generate();

    const original = await readFile(imagePath);
    await writeFile(imagePath, Buffer.alloc(original.length));
    await utimes(imagePath, timestamp, timestamp);

    await expect(generate()).resolves.toBeDefined();
    expect(JSON.parse(await readFile(manifestPath, "utf8")).images).toEqual([
      { src: "/images/optimus/cached.png", width: 22, height: 33 },
    ]);
  });

  it("uses display dimensions for every EXIF orientation", async () => {
    for (let orientation = 1; orientation <= 8; orientation++) {
      await createImage(40, 20)
        .withMetadata({ orientation })
        .jpeg()
        .toFile(path.join(imageDir, `${orientation}.jpeg`));
    }

    await generate();

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.images).toEqual(
      Array.from({ length: 8 }, (_, index) => ({
        src: `/images/optimus/${index + 1}.jpeg`,
        width: index < 4 ? 40 : 20,
        height: index < 4 ? 20 : 40,
      })),
    );
  });

  it("uses one frame's dimensions for GIF and oriented animated WebP", async () => {
    const width = 18;
    const frameHeight = 12;
    const data = Buffer.concat([
      Buffer.alloc(width * frameHeight * 3, 0),
      Buffer.alloc(width * frameHeight * 3, 255),
    ]);
    const animation = () =>
      sharp(data, {
        raw: {
          width,
          height: frameHeight * 2,
          channels: 3,
          pageHeight: frameHeight,
        },
      });
    const gifPath = path.join(imageDir, "animation.gif");
    const webpPath = path.join(imageDir, "animation.webp");
    await animation()
      .gif({ delay: [100, 100] })
      .toFile(gifPath);
    await animation()
      .withMetadata({ orientation: 6 })
      .webp({ delay: [100, 100] })
      .toFile(webpPath);
    expect((await sharp(gifPath).metadata()).pages).toBe(2);
    expect((await sharp(webpPath).metadata()).pages).toBe(2);

    await generate();

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.images).toEqual([
      { src: "/images/optimus/animation.gif", width: 18, height: 12 },
      { src: "/images/optimus/animation.webp", width: 12, height: 18 },
    ]);
  });

  it("reports an unreadable image and preserves the previous manifest", async () => {
    await createImage(20, 30).png().toFile(path.join(imageDir, "valid.png"));
    await generate();
    const previousManifest = await readFile(manifestPath, "utf8");
    await writeFile(path.join(imageDir, "broken.webp"), "invalid image data");

    await expect(generate()).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "Unable to read image dimensions: /images/optimus/broken.webp",
      ),
    });
    expect(await readFile(manifestPath, "utf8")).toBe(previousManifest);
  });

  it("retains the empty-manifest behavior when the image directory is absent", async () => {
    await rm(imageDir, { recursive: true });

    await generate();

    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual({
      urls: [],
      images: [],
    });
  });
});
