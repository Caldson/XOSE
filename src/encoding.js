"use strict";

/*
 * XOSE 0.1.0 — XOS Encoding.
 * Binary format: "XOSE" + version byte 1 + big-endian 16-bit code units.
 * Code points 0x0000-0x013F.
 */

const CONTROL = [
  "NUL", "SPA", "ESC", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "DEL",
  "INS", "PGU", "PGD", "↑", "↓", "←", "→", "CTRL"
];

const SYMBOLS = (() => {
  const chars = Array(39).fill("·");
  const set = (code, char) => { chars[code - 0x56] = char; };
  "+-×÷=/\\^%$¥~Ｎ".split("").forEach((c, i) => set(0x56 + i, c));
  set(0x65, "!");
  set(0x66, "?");
  set(0x67, "¡");
  set(0x68, "¿");
  set(0x69, "！");
  set(0x6a, "？");
  set(0x6b, ":");
  set(0x6c, ";");
  set(0x6d, "：");
  set(0x6e, "；");
  set(0x6f, "°");
  const rest = ["‘", "’", "“", "”", "(", ")", "[", "]", "{", "}", "〈", "〉", "《", "》"];
  rest.forEach((c, i) => set(0x70 + i, c));
  return chars;
})();

const MORE = "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß".slice(0, 29).split("");
const HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっ".split("");
const KATAKANA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォャュョッ".split("");

function fill(base, list, length) {
  const out = Array(length).fill("・");
  list.forEach((char, i) => { if (i < length) out[i] = char; });
  return out;
}

const HIRA = fill(0x9a, HIRAGANA, 0xff - 0x9a + 1);
const KATA = fill(0x100, KATAKANA, 0x137 - 0x100 + 1);
KATA[0x137 - 0x100] = "ー"; // 137: katakana long vowel mark, not 一
HIRA[0xba - 0x9a] = "へ";
HIRA[0xf8 - 0x9a] = "ソ";
KATA[0x116 - 0x100] = "ン";
KATA[0x11d - 0x100] = "ジ";
KATA[0x123 - 0x100] = "ヅ";

const CHINESE = ["一", "二", "三", "十", "百", "千", "万", "億"];

function unitAt(code) {
  if (code <= 0x17) return CONTROL[code];
  if (code >= 0x18 && code <= 0x31) return String.fromCharCode(0x41 + code - 0x18);
  if (code >= 0x32 && code <= 0x4b) return String.fromCharCode(0x61 + code - 0x32);
  if (code >= 0x4c && code <= 0x55) return String.fromCharCode(0x30 + code - 0x4c);
  if (code >= 0x56 && code <= 0x7c) return SYMBOLS[code - 0x56];
  if (code >= 0x7d && code <= 0x99) return MORE[code - 0x7d] || "·";
  if (code >= 0x9a && code <= 0xff) return HIRA[code - 0x9a];
  if (code >= 0x100 && code <= 0x137) return KATA[code - 0x100];
  if (code >= 0x138 && code <= 0x13f) return CHINESE[code - 0x138] || "·";
  return "�";
}

const REVERSE = new Map();
for (let code = 0; code <= 0x13f; code++) {
  const char = unitAt(code);
  if (!REVERSE.has(char)) REVERSE.set(char, code);
}
for (const [char, code] of Object.entries({ "へ": 0xba, "ジ": 0x11d, "ヅ": 0x123, "ン": 0x116, "ソ": 0xf8, "ー": 0x137 })) {
  REVERSE.set(char, code);
}

function encode(text) {
  const out = [0x58, 0x4f, 0x53, 0x45, 1]; // "XOSE", version 1
  for (const char of String(text == null ? "" : text)) {
    const code = REVERSE.get(char) ?? 0x3f;
    out.push((code >> 8) & 0xff, code & 0xff);
  }
  return Uint8Array.from(out);
}

function decode(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (data.length < 6 || data[0] !== 0x58 || data[1] !== 0x4f || data[2] !== 0x53 || data[3] !== 0x45) {
    return Array.from(data, (byte) => unitAt(byte)).join("");
  }
  let out = "";
  for (let i = 5; i + 1 < data.length; i += 2) out += unitAt((data[i] << 8) | data[i + 1]);
  return out;
}

function isXose(bytes) {
  return bytes && bytes.length >= 5 && bytes[0] === 0x58 && bytes[1] === 0x4f && bytes[2] === 0x53 && bytes[3] === 0x45;
}

module.exports = { encode, decode, isXose, unitAt, REVERSE, CONTROL, SYMBOLS, MORE, HIRA, KATA, CHINESE };
