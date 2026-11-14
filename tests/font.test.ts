import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the shipped DM Sans file really exposes weight/optical variation axes, rather than a static Black face", () => {
  const font = readFileSync("public/fonts/dm-sans-variable.ttf");
  const tables = font.readUInt16BE(4);
  let variation = 0;
  for (let index = 0; index < tables; index++) {
    const entry = 12 + index * 16;
    if (font.toString("ascii", entry, entry + 4) === "fvar") variation = font.readUInt32BE(entry + 8);
  }
  assert.ok(variation > 0, "Expected a real fvar table; CSS weight declarations cannot make a static font variable");
  const start = variation + font.readUInt16BE(variation + 4);
  const count = font.readUInt16BE(variation + 8);
  const size = font.readUInt16BE(variation + 10);
  const axes = new Map<string, { min: number; max: number }>();
  for (let index = 0; index < count; index++) {
    const axis = start + index * size;
    axes.set(font.toString("ascii", axis, axis + 4), { min: font.readInt32BE(axis + 4) / 65536, max: font.readInt32BE(axis + 12) / 65536 });
  }
  assert.ok(axes.has("opsz"));
  const weight = axes.get("wght");
  assert.ok(weight && weight.min <= 100 && weight.max >= 900);
});
