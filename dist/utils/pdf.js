"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMarkdownToPdf = convertMarkdownToPdf;
const markdown_it_1 = __importDefault(require("markdown-it"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const image_size_1 = __importDefault(require("image-size"));
// Convert the combined Markdown file into a PDF with consistent page height.
// Each logical page in the Markdown (separated by <!-- page: N -->) is rendered
// into a fixed-height PDF page. Any unused space remains blank to mirror the
// original layout spacing.
function convertMarkdownToPdf(args) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { markdownPath, outputPdfPath, firstImagePath, target_language_code } = args;
        const mdExists = yield fs_1.default.promises
            .access(markdownPath, fs_1.default.constants.R_OK)
            .then(() => true)
            .catch(() => false);
        if (!mdExists)
            return;
        const rawMd = yield fs_1.default.promises.readFile(markdownPath, "utf8");
        if (!rawMd.trim())
            return;
        // Determine page aspect ratio from the first scanned page if available
        let pageWidthIn = 7.0; // slightly smaller page to improve perceived font size
        let pageHeightIn = 11; // default letter height
        if (firstImagePath) {
            try {
                const buf = yield fs_1.default.promises.readFile(firstImagePath);
                const dim = (0, image_size_1.default)(buf);
                if ((dim === null || dim === void 0 ? void 0 : dim.width) && (dim === null || dim === void 0 ? void 0 : dim.height) && dim.width > 0) {
                    const aspect = dim.height / dim.width;
                    pageHeightIn = Math.round(pageWidthIn * aspect * 100) / 100;
                }
            }
            catch (_c) { }
        }
        // Split the Markdown into logical pages using the page markers
        const markerRegex = /<!--\s*page:\s*(\d+)\s*-->/g;
        const matches = [...rawMd.matchAll(markerRegex)];
        if (!matches.length)
            return;
        const pages = [];
        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            const n = parseInt(m[1], 10);
            const start = ((_a = m.index) !== null && _a !== void 0 ? _a : 0) + m[0].length;
            const end = i + 1 < matches.length
                ? (_b = matches[i + 1].index) !== null && _b !== void 0 ? _b : rawMd.length
                : rawMd.length;
            let slice = rawMd.slice(start, end).trim();
            // Remove any leading top headers like "### Pagina X"
            slice = slice.replace(/^#+\s*Pagina\s+\d+\s*\n+/i, "");
            // Normalize any pre-existing centered page number variants to avoid duplicates
            slice = slice
                .replace(/<p\s+align=\"center\"\s*>\s*\d+\s*<\/p>\s*$/i, "")
                .replace(/<div\s+align=\"center\"\s*>[\s\S]*?<\/div>\s*$/i, "")
                .replace(/<center>\s*(?:\*\*)?\s*\d+\s*(?:\*\*)?\s*<\/center>\s*$/i, "")
                .replace(/\*\*\s*\d+\s*\*\*\s*$/i, "")
                .replace(/\n+\s*\d+\s*$/i, "");
            pages.push({ number: n, content: slice });
        }
        const md = new markdown_it_1.default({ html: true, linkify: true, breaks: false });
        const baseDir = path_1.default.dirname(markdownPath);
        const renderedPages = yield Promise.all(pages.map((p) => __awaiter(this, void 0, void 0, function* () {
            const rendered = md.render(p.content);
            return yield inlineLocalImagesAsDataUris(rendered, baseDir);
        })));
        const html = `<!DOCTYPE html>
	<html lang="${target_language_code}">
	<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<style>
	  @page { size: ${pageWidthIn}in ${pageHeightIn}in; margin: 0; }
	  html, body { margin: 0; padding: 0; }
	  body { background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14pt; line-height: 1.35; }
	  .page { position: relative; width: ${pageWidthIn}in; height: ${pageHeightIn}in; box-sizing: border-box; padding: 0.6in 0.6in 0.9in 0.6in; display: flex; flex-direction: column; justify-content: flex-start; page-break-after: always; }
	  .page-footer { position: absolute; bottom: 0.4in; left: 0; right: 0; text-align: center; font-size: 12pt; }
	  .page:last-child { page-break-after: auto; }
	</style>
	</head>
	<body>
	  ${pages
            .map((p, i) => `<section class="page"><div class="page-content">${renderedPages[i]}</div><div class="page-footer">${p.number}</div></section>`)
            .join("\n")}
	</body>
	</html>`;
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--allow-file-access-from-files"],
        });
        try {
            const page = yield browser.newPage();
            yield page.setContent(html, { waitUntil: "networkidle0" });
            yield page.pdf({
                path: outputPdfPath,
                printBackground: true,
                width: `${pageWidthIn}in`,
                height: `${pageHeightIn}in`,
                margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
            });
        }
        finally {
            yield browser.close();
        }
    });
}
// Replace local <img src> paths with data URIs so the HTML is self-contained
function inlineLocalImagesAsDataUris(html, baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const srcRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
        let match;
        let result = html;
        const processed = new Set();
        while ((match = srcRegex.exec(html)) !== null) {
            const src = match[1];
            if (/^(?:https?:|data:|file:)/i.test(src))
                continue;
            if (processed.has(src))
                continue;
            processed.add(src);
            try {
                const abs = path_1.default.resolve(baseDir, src);
                const buf = yield fs_1.default.promises.readFile(abs);
                const ext = path_1.default.extname(abs).toLowerCase();
                const mime = ext === ".png"
                    ? "image/png"
                    : ext === ".jpg" || ext === ".jpeg"
                        ? "image/jpeg"
                        : ext === ".gif"
                            ? "image/gif"
                            : ext === ".webp"
                                ? "image/webp"
                                : ext === ".svg"
                                    ? "image/svg+xml"
                                    : "application/octet-stream";
                const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
                const safeSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const re = new RegExp(`src=["']${safeSrc}["']`, "g");
                result = result.replace(re, `src=\"${dataUrl}\"`);
            }
            catch (_a) { }
        }
        return result;
    });
}
//# sourceMappingURL=pdf.js.map