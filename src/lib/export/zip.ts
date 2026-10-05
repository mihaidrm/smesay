// A ZIP file from named byte buffers (stories/E11-2: Export everything). Written to the PKWARE
// APPNOTE (pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT, sections 4.3.7 local file
// header, 4.3.12 central directory header, 4.3.16 end of central directory record): each entry
// deflated with Node's zlib (deflateRawSync, method 8) and its CRC-32 from zlib.crc32
// (nodejs.org/api/zlib.html#zlibcrc32data-value, Node 22.2), names in UTF-8 (general purpose
// bit 11). No ZIP64: the whole archive must stay under 4 GB and 65,535 entries, far above a
// workspace's export, and zip() refuses beyond it. No database import.
import { crc32, deflateRawSync } from "node:zlib";

export type ZipEntry = { name: string; data: Buffer; modified?: Date };

const LIMIT = 0xffffffff;

// MS-DOS time and date (APPNOTE 4.4.6): two-second steps, years from 1980.
function dos(d: Date): { time: number; date: number } {
  const y = Math.min(2107, Math.max(1980, d.getUTCFullYear()));
  return {
    time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2),
    date: ((y - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
  };
}

export function zip(entries: ZipEntry[], now = new Date()): Buffer {
  if (entries.length > 0xffff) throw new Error("zip: too many entries");
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, "utf8");
    const packed = deflateRawSync(e.data);
    const crc = crc32(e.data) >>> 0;
    const { time, date } = dos(e.modified ?? now);
    if (e.data.length > LIMIT || packed.length > LIMIT || offset > LIMIT) throw new Error("zip: over 4 GB");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed: 2.0 (deflate)
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // made by: 2.0
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(e.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, packed);
    centrals.push(central, name);
    offset += local.length + name.length + packed.length;
  }
  const directory = Buffer.concat(centrals);
  if (offset > LIMIT || directory.length > LIMIT || offset + directory.length > LIMIT) throw new Error("zip: over 4 GB");
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
