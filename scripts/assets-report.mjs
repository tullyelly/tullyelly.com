#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const MIB = 1024 * 1024;
const TOP_FILE_LIMIT = 20;
const FINDING_LIMIT = 20;

const scanRoots = [
  {
    label: "Optimized images",
    kind: "optimized",
    relativePath: "public/images/optimus",
  },
  {
    label: "Source images",
    kind: "source",
    relativePath: "public/images/source",
  },
  {
    label: "Media",
    kind: "media",
    relativePath: "public/videos",
  },
];

const mediaExtensions = new Set([
  ".avi",
  ".gif",
  ".m4v",
  ".mkv",
  ".mov",
  ".mp4",
  ".webm",
]);

const rawSourceExtensions = new Set([
  ".3fr",
  ".arw",
  ".cr2",
  ".cr3",
  ".dng",
  ".erf",
  ".heic",
  ".heif",
  ".kdc",
  ".mrw",
  ".nef",
  ".nrw",
  ".orf",
  ".raf",
  ".raw",
  ".rw2",
  ".srw",
  ".x3f",
]);

const designOrArchiveExtensions = new Set([
  ".7z",
  ".ai",
  ".bmp",
  ".fig",
  ".gz",
  ".psb",
  ".psd",
  ".rar",
  ".sketch",
  ".tar",
  ".tif",
  ".tiff",
  ".xcf",
  ".xd",
  ".zip",
]);

const optimizedTreeSourceExtensions = new Set([
  ...rawSourceExtensions,
  ...designOrArchiveExtensions,
  ".jpeg",
  ".jpg",
  ".png",
]);

const defaultThresholdsMb = {
  total: 750,
  optimized: 650,
  source: 25,
  media: 100,
  file: 15,
  animatedWebp: 8,
  mediaFile: 25,
};

const envThresholds = [
  ["total", "ASSETS_MAX_TOTAL_MB"],
  ["optimized", "ASSETS_MAX_OPTIMUS_MB"],
  ["source", "ASSETS_MAX_SOURCE_MB"],
  ["media", "ASSETS_MAX_MEDIA_MB"],
  ["file", "ASSETS_MAX_FILE_MB"],
  ["animatedWebp", "ASSETS_MAX_ANIMATED_WEBP_MB"],
  ["mediaFile", "ASSETS_MAX_MEDIA_FILE_MB"],
];

const flagThresholds = {
  animatedWebpBytes: 2 * MIB,
  mediaFileBytes: 5 * MIB,
  sourceFileBytes: 10 * MIB,
};

const args = process.argv.slice(2);
const helpRequested = args.includes("-h") || args.includes("--help");
const checkMode = args.includes("--check");
const unknownArgs = args.filter(
  (arg) => !["-h", "--help", "--check"].includes(arg),
);

function usage() {
  console.log("Usage: npm run assets:report");
  console.log("       npm run assets:check");
  console.log("");
  console.log("Options:");
  console.log("  --check  Fail when asset thresholds are exceeded.");
  console.log("  --help   Show this help.");
}

if (helpRequested) {
  usage();
  process.exit(0);
}

if (unknownArgs.length > 0) {
  console.error(`Unknown argument: ${unknownArgs.join(", ")}`);
  usage();
  process.exit(1);
}

function bytesFromMbEnv(envName, fallbackMb) {
  const rawValue = process.env[envName];

  if (rawValue === undefined || rawValue === "") {
    return fallbackMb * MIB;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${envName} must be a non-negative number of MiB.`);
  }

  return parsed * MIB;
}

function loadThresholds() {
  return Object.fromEntries(
    envThresholds.map(([key, envName]) => [
      `${key}Bytes`,
      bytesFromMbEnv(envName, defaultThresholdsMb[key]),
    ]),
  );
}

function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) return `${bytes} B`;

  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function pad(value, width, align = "left") {
  const text = String(value);
  return align === "right" ? text.padStart(width) : text.padEnd(width);
}

function renderTable(columns, rows) {
  const widths = columns.map((column) =>
    Math.max(
      column.label.length,
      ...rows.map((row) => String(row[column.key] ?? "").length),
    ),
  );

  const header = columns
    .map((column, index) => pad(column.label, widths[index], column.align))
    .join("  ");
  const divider = widths.map((width) => "-".repeat(width)).join("  ");
  const body = rows.map((row) =>
    columns
      .map((column, index) =>
        pad(row[column.key] ?? "", widths[index], column.align),
      )
      .join("  "),
  );

  return [header, divider, ...body].join("\n");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walk(entryPath);
      continue;
    }

    if (entry.isFile()) {
      yield entryPath;
    }
  }
}

async function isAnimatedWebp(filePath) {
  const handle = await fs.open(filePath, "r");

  try {
    const { size } = await handle.stat();
    const bytesToRead = Math.min(size, 512 * 1024);
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, 0);
    const data = buffer.subarray(0, bytesRead);

    if (
      data.length < 20 ||
      data.toString("ascii", 0, 4) !== "RIFF" ||
      data.toString("ascii", 8, 12) !== "WEBP"
    ) {
      return false;
    }

    let offset = 12;

    while (offset + 8 <= data.length) {
      const chunkType = data.toString("ascii", offset, offset + 4);
      const chunkSize = data.readUInt32LE(offset + 4);
      const chunkDataOffset = offset + 8;

      if (chunkType === "ANIM" || chunkType === "ANMF") {
        return true;
      }

      if (chunkType === "VP8X" && chunkDataOffset < data.length) {
        const flags = data[chunkDataOffset];
        if ((flags & 0x02) === 0x02) {
          return true;
        }
      }

      const nextOffset = chunkDataOffset + chunkSize + (chunkSize % 2);
      if (nextOffset <= offset) break;
      offset = nextOffset;
    }

    return false;
  } finally {
    await handle.close();
  }
}

function buildSuspicion(asset) {
  const reasons = [];
  const hard = [];

  if (asset.root.kind === "source") {
    reasons.push("source asset remains in public/images/source");

    if (asset.size >= flagThresholds.sourceFileBytes) {
      reasons.push("large source asset");
    }
  }

  if (rawSourceExtensions.has(asset.extension)) {
    reasons.push("camera or phone raw source format");
    hard.push("raw source format");
  }

  if (designOrArchiveExtensions.has(asset.extension)) {
    reasons.push("design, archive, or unoptimized source format");
    hard.push("design or archive format");
  }

  if (
    asset.root.kind === "optimized" &&
    optimizedTreeSourceExtensions.has(asset.extension)
  ) {
    reasons.push("source-like file in optimized images tree");
    hard.push("source-like file in optimized tree");
  }

  if (asset.basename.endsWith(":Zone.Identifier")) {
    reasons.push("Windows download sidecar");
    hard.push("download sidecar");
  }

  return {
    reasons,
    hard,
  };
}

async function collectReport(thresholds) {
  const rootSummaries = [];
  const files = [];
  const inspectAnimatedWebpMin = Math.min(
    flagThresholds.animatedWebpBytes,
    thresholds.animatedWebpBytes,
  );

  for (const root of scanRoots) {
    const absolutePath = path.resolve(root.relativePath);
    const exists = await pathExists(absolutePath);
    const summary = {
      ...root,
      absolutePath,
      exists,
      files: 0,
      size: 0,
    };

    if (exists) {
      for await (const filePath of walk(absolutePath)) {
        const stats = await fs.stat(filePath);
        const relativePath = toPosixPath(
          path.relative(process.cwd(), filePath),
        );
        const extension = path.extname(filePath).toLowerCase();
        const asset = {
          absolutePath: filePath,
          basename: path.basename(filePath),
          extension,
          relativePath,
          root,
          size: stats.size,
          isAnimatedWebp: false,
        };

        if (extension === ".webp" && stats.size >= inspectAnimatedWebpMin) {
          asset.isAnimatedWebp = await isAnimatedWebp(filePath);
        }

        files.push(asset);
        summary.files += 1;
        summary.size += stats.size;
      }
    }

    rootSummaries.push(summary);
  }

  const totalSize = rootSummaries.reduce((sum, root) => sum + root.size, 0);
  const totalFiles = rootSummaries.reduce((sum, root) => sum + root.files, 0);
  const sizeByKind = Object.fromEntries(
    scanRoots.map((root) => [
      root.kind,
      rootSummaries
        .filter((summary) => summary.kind === root.kind)
        .reduce((sum, summary) => sum + summary.size, 0),
    ]),
  );

  const suspiciousFiles = files
    .map((asset) => ({
      ...asset,
      suspicion: buildSuspicion(asset),
    }))
    .filter((asset) => asset.suspicion.reasons.length > 0)
    .sort((a, b) => b.size - a.size);

  const largeMediaFiles = files
    .map((asset) => {
      const reasons = [];

      if (
        asset.isAnimatedWebp &&
        asset.size >= flagThresholds.animatedWebpBytes
      ) {
        reasons.push("animated WebP");
      }

      if (
        mediaExtensions.has(asset.extension) &&
        asset.size >= flagThresholds.mediaFileBytes
      ) {
        reasons.push("media file");
      }

      return {
        ...asset,
        mediaReasons: reasons,
      };
    })
    .filter((asset) => asset.mediaReasons.length > 0)
    .sort((a, b) => b.size - a.size);

  return {
    files,
    largeMediaFiles,
    rootSummaries,
    sizeByKind,
    suspiciousFiles,
    totalFiles,
    totalSize,
  };
}

function thresholdRows(report, thresholds) {
  const largestFileSize = Math.max(
    0,
    ...report.files.map((asset) => asset.size),
  );
  const largestAnimatedWebp = report.files
    .filter((asset) => asset.isAnimatedWebp)
    .sort((a, b) => b.size - a.size)[0];
  const largestMediaFile = report.files
    .filter((asset) => mediaExtensions.has(asset.extension))
    .sort((a, b) => b.size - a.size)[0];

  return [
    {
      label: "Total scanned assets",
      actual: report.totalSize,
      limit: thresholds.totalBytes,
    },
    {
      label: "Optimized images",
      actual: report.sizeByKind.optimized ?? 0,
      limit: thresholds.optimizedBytes,
    },
    {
      label: "Source images",
      actual: report.sizeByKind.source ?? 0,
      limit: thresholds.sourceBytes,
    },
    {
      label: "Media",
      actual: report.sizeByKind.media ?? 0,
      limit: thresholds.mediaBytes,
    },
    {
      label: "Largest file",
      actual: largestFileSize,
      limit: thresholds.fileBytes,
    },
    {
      label: "Largest animated WebP",
      actual: largestAnimatedWebp?.size ?? 0,
      limit: thresholds.animatedWebpBytes,
    },
    {
      label: "Largest media file",
      actual: largestMediaFile?.size ?? 0,
      limit: thresholds.mediaFileBytes,
    },
  ];
}

function checkFailures(report, thresholds) {
  const failures = thresholdRows(report, thresholds)
    .filter((row) => row.actual > row.limit)
    .map(
      (row) =>
        `${row.label} is ${formatBytes(row.actual)}; limit is ${formatBytes(
          row.limit,
        )}`,
    );

  for (const asset of report.suspiciousFiles) {
    if (asset.suspicion.hard.length === 0) continue;

    failures.push(
      `${asset.relativePath} is suspicious: ${asset.suspicion.hard.join(", ")}`,
    );
  }

  return failures;
}

function printLimitedRows(title, rows, columns, emptyMessage) {
  console.log(`\n${title}`);

  if (rows.length === 0) {
    console.log(emptyMessage);
    return;
  }

  const visibleRows = rows.slice(0, FINDING_LIMIT);
  console.log(renderTable(columns, visibleRows));

  if (rows.length > FINDING_LIMIT) {
    console.log(`...and ${rows.length - FINDING_LIMIT} more.`);
  }
}

function printReport(report, thresholds) {
  const sortedFiles = [...report.files].sort((a, b) => b.size - a.size);
  const rootsRows = report.rootSummaries.map((summary) => ({
    folder: summary.relativePath,
    label: summary.label,
    files: summary.exists ? String(summary.files) : "missing",
    size: summary.exists ? formatBytes(summary.size) : "missing",
  }));

  rootsRows.push({
    folder: "Total",
    label: "",
    files: String(report.totalFiles),
    size: formatBytes(report.totalSize),
  });

  console.log("Asset Size Report");
  console.log(`Scanned folders: ${scanRoots.length}`);

  console.log("\nTotals by folder");
  console.log(
    renderTable(
      [
        { key: "folder", label: "Folder" },
        { key: "label", label: "Bucket" },
        { key: "files", label: "Files", align: "right" },
        { key: "size", label: "Size", align: "right" },
      ],
      rootsRows,
    ),
  );

  console.log(`\nLargest ${TOP_FILE_LIMIT} files`);
  console.log(
    renderTable(
      [
        { key: "size", label: "Size", align: "right" },
        { key: "path", label: "Path" },
      ],
      sortedFiles.slice(0, TOP_FILE_LIMIT).map((asset) => ({
        size: formatBytes(asset.size),
        path: asset.relativePath,
      })),
    ),
  );

  printLimitedRows(
    "Suspicious raw or source files",
    report.suspiciousFiles.map((asset) => ({
      size: formatBytes(asset.size),
      path: asset.relativePath,
      reason: asset.suspicion.reasons.join("; "),
    })),
    [
      { key: "size", label: "Size", align: "right" },
      { key: "path", label: "Path" },
      { key: "reason", label: "Reason" },
    ],
    "None found.",
  );

  printLimitedRows(
    "Large animated WebP or media files",
    report.largeMediaFiles.map((asset) => ({
      size: formatBytes(asset.size),
      path: asset.relativePath,
      reason: asset.mediaReasons.join("; "),
    })),
    [
      { key: "size", label: "Size", align: "right" },
      { key: "path", label: "Path" },
      { key: "reason", label: "Reason" },
    ],
    "None found.",
  );

  if (checkMode) {
    console.log("\nCheck thresholds");
    console.log(
      renderTable(
        [
          { key: "name", label: "Threshold" },
          { key: "actual", label: "Actual", align: "right" },
          { key: "limit", label: "Limit", align: "right" },
          { key: "status", label: "Status" },
        ],
        thresholdRows(report, thresholds).map((row) => ({
          name: row.label,
          actual: formatBytes(row.actual),
          limit: formatBytes(row.limit),
          status: row.actual > row.limit ? "fail" : "ok",
        })),
      ),
    );
  }
}

try {
  const thresholds = loadThresholds();
  const report = await collectReport(thresholds);
  printReport(report, thresholds);

  if (checkMode) {
    const failures = checkFailures(report, thresholds);

    if (failures.length > 0) {
      console.error("\nAsset size check failed:");
      for (const failure of failures) {
        console.error(` - ${failure}`);
      }
      process.exit(1);
    }

    console.log("\nAsset size check passed.");
  }
} catch (error) {
  console.error(error?.message ?? "Asset report failed.");
  process.exit(1);
}
