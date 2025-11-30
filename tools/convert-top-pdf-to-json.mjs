#!/usr/bin/env node
/**
 * 將「影像型」TOP 會考單字 PDF 轉為 words.json
 *
 * 需求：
 * - 已安裝 pdftoppm (Poppler)
 * - 已安裝 tesseract (含 chi_tra + eng 語言包)
 *
 * 使用方式：
 *   node tools/convert-top-pdf-to-json.mjs input.pdf output.json 3 20
 *
 * 參數說明：
 *   input.pdf   ：輸入 PDF 路徑
 *   output.json ：輸出 JSON 路徑（預設：./public/data/words.json）
 *   startPage   ：起始頁碼（用來略過封面、目錄）
 *   endPage     ：結束頁碼（可省略，預設轉到最後一頁）
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printUsage() {
  console.log(`
用法：
  node tools/convert-top-pdf-to-json.mjs input.pdf [output.json] [startPage] [endPage]

範例：
  node tools/convert-top-pdf-to-json.mjs "./TOP單字表.pdf" "./public/data/words.json" 3 20

說明：
  - input.pdf   ：輸入 PDF 檔案（必填）
  - output.json ：輸出 JSON 檔案（預設為 ./public/data/words.json）
  - startPage   ：起始頁碼（整數，預設 1）
  - endPage     ：結束頁碼（整數，預設為 PDF 最後一頁，實作上會先嘗試全頁）
`);
}

// 解析參數
const args = process.argv.slice(2);
if (args.length < 1) {
  printUsage();
  process.exit(1);
}

const inputPdf = path.resolve(process.cwd(), args[0]);
const outputJson =
  args[1] ? path.resolve(process.cwd(), args[1]) : path.resolve(process.cwd(), "public/data/words.json");
const startPage = args[2] ? parseInt(args[2], 10) : 1;
const endPage = args[3] ? parseInt(args[3], 10) : null;

// 檢查 PDF 是否存在
if (!fs.existsSync(inputPdf)) {
  console.error(`找不到輸入 PDF 檔案：${inputPdf}`);
  process.exit(1);
}

// 建立暫存目錄
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "top-pdf-ocr-"));
console.log(`暫存資料夾：${tempDir}`);

// 將 PDF 指定頁面轉為 PNG 圖片
function convertPdfToPng(pdfPath, outputDir, start, end) {
  console.log("開始使用 pdftoppm 轉成 PNG...");

  const outputPrefix = path.join(outputDir, "page"); // 會產生 page-1.png, page-2.png...
  const args = [];

  if (start) {
    args.push("-f", String(start));
  }
  if (end) {
    args.push("-l", String(end));
  }

  // -png 表示輸出 PNG
  args.push("-png", pdfPath, outputPrefix);

  try {
    execFileSync("pdftoppm", args, { stdio: "inherit" });
  } catch (err) {
    console.error("執行 pdftoppm 失敗，請確認已安裝 Poppler 並將 pdftoppm 加入 PATH。");
    console.error(err.message);
    cleanup();
    process.exit(1);
  }

  // 收集輸出檔案列表
  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .map((f) => path.join(outputDir, f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    console.error("沒有找到任何輸出的 PNG 檔案，可能是 pdftoppm 失敗或沒有指定正確頁碼。");
    cleanup();
    process.exit(1);
  }

  console.log(`共產生 ${files.length} 張頁面圖片。`);
  return files;
}

// 使用 Tesseract 產生 TSV，取得表格座標
function runTesseractTsv(imagePath, baseName) {
  console.log(`OCR (TSV) 中：${path.basename(imagePath)} ...`);

  const outputBase = path.join(tempDir, baseName);
  const args = [imagePath, outputBase, "-l", "chi_tra+eng", "--psm", "6", "tsv"];

  try {
    execFileSync("tesseract", args, { stdio: "ignore" });
  } catch (err) {
    console.error("執行 tesseract (tsv) 失敗。請確認安裝與 PATH 設定。");
    console.error(err.message);
    return { tokens: [], pageWidth: 0, pageHeight: 0 };
  }

  const tsvPath = `${outputBase}.tsv`;
  if (!fs.existsSync(tsvPath)) {
    console.error(`找不到 TSV 輸出：${tsvPath}`);
    return { tokens: [], pageWidth: 0, pageHeight: 0 };
  }

  const content = fs.readFileSync(tsvPath, "utf8");
  // 清除暫存 TSV
  fs.unlinkSync(tsvPath);

  const lines = content.split(/\r?\n/);
  const header = lines.shift()?.split("\t") ?? [];

  const tokens = [];
  let pageWidth = 0;
  let pageHeight = 0;

  lines.forEach((line) => {
    if (!line.trim()) return;
    const cols = line.split("\t");
    if (cols.length !== header.length) return;

    const entry = {};
    header.forEach((key, idx) => {
      entry[key] = cols[idx];
    });

    entry.level = parseInt(entry.level, 10);
    entry.left = parseInt(entry.left, 10);
    entry.top = parseInt(entry.top, 10);
    entry.width = parseInt(entry.width, 10);
    entry.height = parseInt(entry.height, 10);
    entry.conf = parseFloat(entry.conf);
    entry.text = entry.text ?? "";

    if (entry.level === 1 && pageWidth === 0) {
      pageWidth = entry.width;
      pageHeight = entry.height;
    }

    tokens.push(entry);
  });

  return { tokens, pageWidth, pageHeight };
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function splitPosSegments(text) {
  const normalized = normalizeWhitespace(text).replace(/；/g, ";");
  if (!normalized) return [];

  const segments = normalized
    .split(/(?=\[[^\]]+\])/)
    .map((seg) => seg.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return [{ pos: "", meaningZh: normalized.replace(/;/g, "；") }];
  }

  return segments.map((seg) => {
    const match = seg.match(/^(\[[^\]]+\])\s*(.+)$/);
    if (match) {
      return {
        pos: match[1],
        meaningZh: match[2].replace(/;/g, "；").trim(),
      };
    }
    return { pos: "", meaningZh: seg.replace(/;/g, "；").trim() };
  });
}

function extractFrequencyValues(freqText) {
  if (!freqText) return [];
  const freqPattern = /(105|106|107|108|109|110|111|112|113|114|14|13|12|11|10|09|08|07|06|05|9|8|7|6|5)/g;
  const matches = freqText.match(freqPattern) || [];
  const mapped = matches
    .map((token) => {
      const value = parseInt(token, 10);
      if (Number.isNaN(value)) return null;
      if (value >= 105 && value <= 114) return value;
      if (value >= 5 && value <= 14) return 100 + value;
      return null;
    })
    .filter((v) => v !== null);

  return Array.from(new Set(mapped)).sort((a, b) => a - b);
}

function buildRowsFromTokens(tokens, pageWidth) {
  if (!tokens.length || !pageWidth) return [];

  const defaultWordColumnRight = Math.round(pageWidth * 0.4);

  const wordTokens = tokens
    .filter(
      (t) =>
        t.level === 5 &&
        t.text &&
        /^[A-Za-z][A-Za-z'\-]*$/.test(t.text) &&
        t.left < defaultWordColumnRight &&
        t.conf > 0
    )
    .sort((a, b) => a.top - b.top || a.left - b.left);

  if (wordTokens.length === 0) return [];

  const maxWordRight = Math.max(...wordTokens.map((t) => t.left + t.width));
  const estimatedRight = maxWordRight + 15;
  const minRight = Math.round(pageWidth * 0.18);
  const maxRight = Math.round(pageWidth * 0.3);
  const wordColumnRight = Math.min(Math.max(estimatedRight, minRight), maxRight);

  const freqRegex = /(105|106|107|108|109|110|111|112|113|114|14|13|12|11|10|09|08|07|06|05|9|8|7|6|5)/;
  const freqCandidates = tokens.filter(
    (t) => t.level === 5 && freqRegex.test(t.text) && t.left > wordColumnRight
  );
  let freqColumnLeft = freqCandidates.length
    ? Math.min(...freqCandidates.map((t) => t.left)) - 10
    : Math.round(pageWidth * 0.65);

  if (freqColumnLeft <= wordColumnRight) {
    freqColumnLeft = Math.round(pageWidth * 0.7);
  }

  const rows = wordTokens.map((token, idx) => {
    const nextTop = idx < wordTokens.length - 1 ? wordTokens[idx + 1].top : token.top + 120;
    return {
      wordToken: token,
      word: token.text,
      minTop: token.top - 20,
      maxTop: Math.max(token.top + 30, Math.round((token.top + nextTop) / 2)),
      tokens: [],
      wordColumnRight,
      freqColumnLeft,
    };
  });

  rows[rows.length - 1].maxTop = rows[rows.length - 1].wordToken.top + 120;

  const sortedTokens = tokens
    .filter((t) => t.level === 5 && t.text)
    .sort((a, b) => a.top - b.top || a.left - b.left);

  let rowIndex = 0;
  sortedTokens.forEach((token) => {
    while (rowIndex < rows.length && token.top >= rows[rowIndex].maxTop) {
      rowIndex++;
    }
    if (rowIndex >= rows.length) return;
    const row = rows[rowIndex];
    if (token.top >= row.minTop) {
      row.tokens.push(token);
    }
  });

  return rows;
}

function composeTextFromTokens(tokens) {
  if (!tokens.length) return "";

  let text = tokens
    .map((t) => t.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/([\u3400-\u9FFF])\s+([\u3400-\u9FFF])/g, "$1$2")
    .replace(/([\u3400-\u9FFF])\s+([；;])/g, "$1$2")
    .replace(/([；;])\s+([\u3400-\u9FFF])/g, "$1$2")
    .replace(/([\u3400-\u9FFF])\s+(\[)/g, "$1 $2")
    .replace(/(\])\s+([\u3400-\u9FFF])/g, "$1 $2");

  return text;
}

function buildWordEntryFromRow(row, pageNumber, indexInPage) {
  const word = row.word?.trim();
  if (!word || word.toLowerCase() === "copyright") {
    return null;
  }

  const posTokens = row.tokens.filter(
    (token) => token.left >= row.wordColumnRight && token.left < row.freqColumnLeft && token !== row.wordToken
  );
  const posText = composeTextFromTokens(posTokens);
  const posList = splitPosSegments(posText);

  const freqTokens = row.tokens.filter((token) => token.left >= row.freqColumnLeft);
  const freqText = freqTokens.map((t) => t.text).join(" ");
  const frequencyGroup = extractFrequencyValues(freqText);

  if (!posList.length && !frequencyGroup.length) {
    return null;
  }

  return {
    word,
    posList: posList.length ? posList : [{ pos: "", meaningZh: posText }],
    frequencyGroup,
    page: pageNumber,
  };
}

// 清理暫存資料夾
function cleanup() {
  try {
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach((f) => {
        fs.unlinkSync(path.join(tempDir, f));
      });
      fs.rmdirSync(tempDir);
    }
  } catch (err) {
    // 若刪除失敗，不影響主要流程
  }
}

function main() {
  console.log("=== TOP 會考單字 PDF → JSON 轉換開始 ===");
  console.log(`輸入 PDF：${inputPdf}`);
  console.log(`輸出 JSON：${outputJson}`);
  console.log(`起始頁：${startPage}，結束頁：${endPage ?? "（未指定，pdftoppm 會轉到最後一頁）"}`);

  const pngFiles = convertPdfToPng(inputPdf, tempDir, startPage, endPage);

  const allWords = [];
  const unparsedLines = [];
  let nextId = 1;

  pngFiles.forEach((pngPath, idx) => {
    // 單字表邏輯頁碼（不含封面目錄）：第 1 頁就是單字表第 1 頁
    const logicalPageNumber = idx + 1;

    const pageKey = `tsv-${idx}-${Date.now()}`;
    const { tokens, pageWidth } = runTesseractTsv(pngPath, pageKey);
    const rows = buildRowsFromTokens(tokens, pageWidth);

    rows.forEach((row, rowIndex) => {
      const wordObj = buildWordEntryFromRow(row, logicalPageNumber, rowIndex + 1);
      if (wordObj) {
        wordObj.id = nextId++;
        allWords.push(wordObj);
      } else {
        const rawLine = row.tokens.map((t) => t.text).join(" ").trim();
        if (rawLine) {
          unparsedLines.push({ page: logicalPageNumber, line: rawLine });
        }
      }
    });
  });

  // 輸出 JSON
  const outputDir = path.dirname(outputJson);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputJson, JSON.stringify(allWords, null, 2), "utf8");
  console.log(`已輸出 words.json，共 ${allWords.length} 筆單字：${outputJson}`);

  // 如有無法解析的行，輸出到 log 檔方便你調整 regex
  if (unparsedLines.length > 0) {
    const logPath = path.join(outputDir, "unparsed-lines.log");
    const logContent = unparsedLines
      .map((item) => `第 ${item.page} 頁：${item.line}`)
      .join("\n");
    fs.writeFileSync(logPath, logContent, "utf8");
    console.warn(`有 ${unparsedLines.length} 行無法解析，已輸出至：${logPath}`);
    console.warn("請依照 log 檔內容，調整 parseLineToWord() 內的 regex。");
  }

  cleanup();
  console.log("=== 轉換完成 ===");
}

main();
