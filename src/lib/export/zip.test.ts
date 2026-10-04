// The ZIP writer (stories/E11-2): the archive read back from its central directory with Node's
// own inflate gives every entry byte for byte, names in UTF-8 included, and each CRC-32 matches.
// (unzip -t on the file found no error when this was written; the test does not depend on it.)
import { crc32, inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { zip } from "./zip";

function unzip(file: Buffer): Map<string, Buffer> {
  const end = file.length - 22;
  expect(file.readUInt32LE(end)).toBe(0x06054b50);
  const count = file.readUInt16LE(end + 10);
  let at = file.readUInt32LE(end + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    expect(file.readUInt32LE(at)).toBe(0x02014b50);
    const crc = file.readUInt32LE(at + 16);
    const size = file.readUInt32LE(at + 20);
    const nameLength = file.readUInt16LE(at + 28);
    const offset = file.readUInt32LE(at + 42);
    const name = file.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    expect(file.readUInt32LE(offset)).toBe(0x04034b50);
    const start = offset + 30 + file.readUInt16LE(offset + 26) + file.readUInt16LE(offset + 28);
    const data = inflateRawSync(file.subarray(start, start + size));
    expect(crc32(data) >>> 0).toBe(crc);
    out.set(name, data);
    at += 46 + nameLength;
  }
  return out;
}

describe("zip", () => {
  it("writes an archive that reads back entry by entry", () => {
    const big = Buffer.from("Ana, Ioana, Știrbei; ".repeat(5000));
    const files = unzip(zip([{ name: "workspace.json", data: Buffer.from('{"name":"Marlow"}') }, { name: "projects/Expense tool ș.json", data: big }, { name: "empty.txt", data: Buffer.alloc(0) }], new Date("2026-10-04T12:00:00Z")));
    expect([...files.keys()]).toEqual(["workspace.json", "projects/Expense tool ș.json", "empty.txt"]);
    expect(files.get("projects/Expense tool ș.json")!.equals(big)).toBe(true);
    expect(files.get("workspace.json")!.toString()).toBe('{"name":"Marlow"}');
    expect(files.get("empty.txt")!.length).toBe(0);
  });
});
