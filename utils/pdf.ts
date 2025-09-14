import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import imageSize from "image-size";

// Convert the combined Markdown file into a PDF with consistent page height.
// Each logical page in the Markdown (separated by <!-- page: N -->) is rendered
// into a fixed-height PDF page. Any unused space remains blank to mirror the
// original layout spacing.
export async function convertMarkdownToPdf(args: {
	markdownPath: string;
	outputPdfPath: string;
	firstImagePath?: string;
	target_language_code: string;
}) {
	const { markdownPath, outputPdfPath, firstImagePath, target_language_code } =
		args;
	const mdExists = await fs.promises
		.access(markdownPath, fs.constants.R_OK)
		.then(() => true)
		.catch(() => false);
	if (!mdExists) return;

	const rawMd = await fs.promises.readFile(markdownPath, "utf8");
	if (!rawMd.trim()) return;

	// Determine page aspect ratio from the first scanned page if available
	let pageWidthIn = 7.0; // slightly smaller page to improve perceived font size
	let pageHeightIn = 11; // default letter height
	if (firstImagePath) {
		try {
			const buf = await fs.promises.readFile(firstImagePath);
			const dim = imageSize(buf) as { width?: number; height?: number };
			if (dim?.width && dim?.height && dim.width > 0) {
				const aspect = dim.height / dim.width;
				pageHeightIn = Math.round(pageWidthIn * aspect * 100) / 100;
			}
		} catch {}
	}

	// Split the Markdown into logical pages using the page markers
	const markerRegex = /<!--\s*page:\s*(\d+)\s*-->/g;
	const matches = [...rawMd.matchAll(markerRegex)];
	if (!matches.length) return;

	const pages: { number: number; content: string }[] = [];
	for (let i = 0; i < matches.length; i++) {
		const m = matches[i];
		const n = parseInt(m[1], 10);
		const start = (m.index ?? 0) + m[0].length;
		const end =
			i + 1 < matches.length
				? matches[i + 1].index ?? rawMd.length
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

	const md = new MarkdownIt({ html: true, linkify: true, breaks: false });
	const baseDir = path.dirname(markdownPath);
	const renderedPages = await Promise.all(
		pages.map(async (p) => {
			const rendered = md.render(p.content);
			return await inlineLocalImagesAsDataUris(rendered, baseDir);
		})
	);

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
			.map(
				(p, i) =>
					`<section class="page"><div class="page-content">${renderedPages[i]}</div><div class="page-footer">${p.number}</div></section>`
			)
			.join("\n")}
	</body>
	</html>`;

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--allow-file-access-from-files"],
	});
	try {
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: "networkidle0" });
		await page.pdf({
			path: outputPdfPath,
			printBackground: true,
			width: `${pageWidthIn}in`,
			height: `${pageHeightIn}in`,
			margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
		});
	} finally {
		await browser.close();
	}
}

// Replace local <img src> paths with data URIs so the HTML is self-contained
async function inlineLocalImagesAsDataUris(
	html: string,
	baseDir: string
): Promise<string> {
	const srcRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
	let match: RegExpExecArray | null;
	let result = html;
	const processed = new Set<string>();
	while ((match = srcRegex.exec(html)) !== null) {
		const src = match[1];
		if (/^(?:https?:|data:|file:)/i.test(src)) continue;
		if (processed.has(src)) continue;
		processed.add(src);
		try {
			const abs = path.resolve(baseDir, src);
			const buf = await fs.promises.readFile(abs);
			const ext = path.extname(abs).toLowerCase();
			const mime =
				ext === ".png"
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
		} catch {}
	}
	return result;
}
