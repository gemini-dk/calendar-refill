const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "@swc",
  "helpers",
  "esm",
  "index.js"
);

const helperSource = path.join(
  process.cwd(),
  "node_modules",
  "@swc",
  "helpers",
  "esm",
  "_apply_decorated_descriptor.js"
);

const exportLine = 'export { _ as applyDecoratedDescriptor } from "./_apply_decorated_descriptor.js";';

if (!fs.existsSync(target)) {
  console.warn(`[patch-swc-helpers] ${target} が存在しません。インストール後に再度実行してください。`);
  process.exit(0);
}

if (!fs.existsSync(helperSource)) {
  console.warn(`[patch-swc-helpers] _apply_decorated_descriptor.js が見つかりません。`);
  process.exit(0);
}

const content = fs.readFileSync(target, "utf8");

if (content.includes(exportLine)) {
  console.log("[patch-swc-helpers] applyDecoratedDescriptor は既にエクスポートされています。");
  process.exit(0);
}

const lines = content.split(/\r?\n/);
const insertIndex = lines.findIndex((line) => line.trim().startsWith("export"));
const before = insertIndex === -1 ? lines : lines.slice(0, insertIndex);
const after = insertIndex === -1 ? [] : lines.slice(insertIndex);
const nextContent = [...before, exportLine, ...after].join("\n");

fs.writeFileSync(target, nextContent, "utf8");
console.log("[patch-swc-helpers] applyDecoratedDescriptor を追加しました。");
