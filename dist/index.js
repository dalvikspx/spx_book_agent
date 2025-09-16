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
const agents_1 = require("@openai/agents");
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const image_size_1 = __importDefault(require("image-size"));
const sharp_1 = __importDefault(require("sharp"));
// import { convertMarkdownToPdf } from "./utils/pdf";
dotenv_1.default.config();
// Configuration constants
const book_pages_directory = "./book_pages";
// Dynamic path for translations - will be set after language configuration
let final_markdown_file;
const PLACEHOLDER_BASE_URL = "https://placehold.co";
const LINK_PLACEHOLDER_URL = "https://example.com/placeholder";
// Language configuration - can be customized via environment variables
// Set TARGET_LANGUAGE to the full language name (e.g., "Italian", "Spanish", "French")
// Set TARGET_LANGUAGE_CODE to the ISO language code (e.g., "it", "es", "fr")
const TARGET_LANGUAGE = process.env.TARGET_LANGUAGE || "Italian";
const TARGET_LANGUAGE_CODE = process.env.TARGET_LANGUAGE_CODE || "it";
// Initialize translations directory and final markdown file path
function initializeTranslationPaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const translationsDir = path_1.default.resolve("./translations", TARGET_LANGUAGE_CODE);
        // Create translations directory if it doesn't exist
        try {
            yield fs_1.default.promises.mkdir(translationsDir, { recursive: true });
        }
        catch (error) {
            console.error("Failed to create translations directory:", error);
            throw error;
        }
        // Set the final markdown file path
        final_markdown_file = path_1.default.join(translationsDir, "final_book.md");
        console.log(`Translation will be saved to: ${final_markdown_file}`);
        return translationsDir;
    });
}
// Helper function to get language-specific translation examples
function getTranslationExample(language) {
    const examples = {
        Italian: '"working hard" should be translated as "lavorare duro" not "lavorare caldo"',
        Spanish: '"working hard" should be translated as "trabajar duro" not "trabajar caliente"',
        French: '"working hard" should be translated as "travailler dur" not "travailler chaud"',
        German: '"working hard" should be translated as "hart arbeiten" not "heiß arbeiten"',
        Portuguese: '"working hard" should be translated as "trabalhar duro" not "trabalhar quente"',
        "Mandarin Chinese": '"working hard" should be translated as "努力工作" (nǔlì gōngzuò) not "热工作" (literal translation)',
        Hindi: '"working hard" should be translated as "कड़ी मेहनत करना" (kadee mehanat karna) not "गर्म काम" (literal translation)',
    };
    return (examples[language] ||
        '"working hard" should be translated idiomatically, not literally');
}
const openai = new openai_1.default();
function toThreeDigitString(inputNumber) {
    const absoluteNumber = Math.max(0, Math.floor(inputNumber));
    return absoluteNumber.toString().padStart(3, "0");
}
function readImageAsDataUrl(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileBuffer = yield fs_1.default.promises.readFile(imagePath);
        const base64Content = fileBuffer.toString("base64");
        const extension = path_1.default.extname(imagePath).toLowerCase();
        const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
        return `data:${mimeType};base64,${base64Content}`;
    });
}
function checkExistingImages(assetsDir, page_number) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if the directory exists
            yield fs_1.default.promises.access(assetsDir, fs_1.default.constants.R_OK);
            // Read directory contents
            const files = yield fs_1.default.promises.readdir(assetsDir);
            // Filter for image files and sort them
            const imageFiles = files
                .filter((file) => file.toLowerCase().match(/\.(png|jpg|jpeg)$/))
                .sort(); // Sort to ensure consistent order
            if (imageFiles.length === 0) {
                return [];
            }
            const existingImages = [];
            for (const file of imageFiles) {
                const fullPath = path_1.default.resolve(assetsDir, file);
                try {
                    // Get image dimensions
                    const imageBuffer = yield fs_1.default.promises.readFile(fullPath);
                    const sizeInfo = (0, image_size_1.default)(imageBuffer);
                    if (sizeInfo.width && sizeInfo.height) {
                        const relFromMd = path_1.default.relative(path_1.default.dirname(path_1.default.resolve(final_markdown_file)), fullPath);
                        existingImages.push({
                            relPath: relFromMd.split(path_1.default.sep).join("/"),
                            width: sizeInfo.width,
                            height: sizeInfo.height,
                            alt: "Immagine",
                        });
                    }
                }
                catch (err) {
                    console.warn(`[checkExistingImages] Failed to process ${file}:`, err);
                }
            }
            return existingImages;
        }
        catch (_a) {
            // Directory doesn't exist or can't be accessed
            return [];
        }
    });
}
const readPageContent = (0, agents_1.tool)({
    name: "read_page_content",
    description: "Read the content of a given page (image file) and return rich Markdown preserving layout, with image placeholders sized to detected regions and placeholder links.",
    parameters: zod_1.z.object({ page_number: zod_1.z.number() }),
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page_number }) {
            var _b, _c, _d, _e;
            if (!Number.isFinite(page_number) || page_number < 1) {
                throw new Error("page_number must be a positive integer starting from 1");
            }
            const fileName = `-${toThreeDigitString(page_number)}.png`;
            const imagePath = path_1.default.resolve(book_pages_directory, fileName);
            const imageExists = yield fs_1.default.promises
                .access(imagePath, fs_1.default.constants.R_OK)
                .then(() => true)
                .catch(() => false);
            if (!imageExists) {
                throw new Error(`Image not found or not readable: ${imagePath}`);
            }
            const dataUrl = yield readImageAsDataUrl(imagePath);
            const imageBuffer = yield fs_1.default.promises.readFile(imagePath);
            const sizeInfo = (0, image_size_1.default)(imageBuffer);
            const pageWidth = typeof (sizeInfo === null || sizeInfo === void 0 ? void 0 : sizeInfo.width) === "number" ? sizeInfo.width : undefined;
            const pageHeight = typeof (sizeInfo === null || sizeInfo === void 0 ? void 0 : sizeInfo.height) === "number" ? sizeInfo.height : undefined;
            const completion = yield openai.chat.completions.create({
                model: "gpt-4.1-2025-04-14",
                messages: [
                    {
                        role: "system",
                        content: "You are an OCR + layout engine. Return Markdown that preserves the page's reading order and formatting. Map larger font sizes to Markdown heading levels (#, ##, ###) without inventing new headings. Preserve bold and italics. Detect figures/images/charts/logos present on the page and insert Markdown image placeholders sized to the detected regions, using the provided placeholder service base URL. Preserve lists, tables, and line breaks. Detect visible hyperlinks or link-like texts and output them as Markdown links using the provided link placeholder URL. IMPORTANT: Do not include standalone page numbers (like '3', '4', '5' etc.) in the output as they will be added automatically by the system. Skip isolated page numbers that appear at the bottom or margins of pages. Output Markdown only, with no additional comments.",
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: (() => {
                                    let header = "Task: Produce rich Markdown from this scanned page.\n";
                                    header += "Requirements:\n";
                                    header +=
                                        "- Use Markdown headings to reflect font size hierarchy (do not invent headings).\n";
                                    header +=
                                        "- Preserve bold/strong as **bold** and italics as *italics*.\n";
                                    header +=
                                        "- Preserve lists, tables, code blocks, and line breaks.\n";
                                    header +=
                                        "- Detect every inline image/figure/chart/logo. For each detected image region, estimate its pixel width and height relative to the page, round to the nearest 8px, and insert: ![Descrizione immagine](" +
                                            PLACEHOLDER_BASE_URL +
                                            "/{WIDTH}x{HEIGHT}).\n";
                                    header +=
                                        "- Do not include the entire page as one image; include only images that appear within the content.\n";
                                    header +=
                                        "- Detect visible hyperlinks or link-like text. Output them as Markdown links: [testo del link](" +
                                            LINK_PLACEHOLDER_URL +
                                            "). Do not invent real URLs.\n";
                                    header +=
                                        "- IMPORTANT: Skip standalone page numbers (like '3', '4', '5') that appear at the bottom or margins - these will be added automatically.\n";
                                    header += "- Keep reading order accurate.\n";
                                    if (pageWidth && pageHeight)
                                        header += `Context: The source page is ${pageWidth}x${pageHeight} pixels. Use this to estimate image region sizes.\n`;
                                    header += `Placeholder base: ${PLACEHOLDER_BASE_URL} (format: ${PLACEHOLDER_BASE_URL}/WIDTHxHEIGHT).\n`;
                                    header += `Link placeholder: ${LINK_PLACEHOLDER_URL}.\n`;
                                    header += "Output: Return Markdown only.";
                                    return header;
                                })(),
                            },
                            { type: "image_url", image_url: { url: dataUrl } },
                        ],
                    },
                ],
            });
            const extracted = (_e = (_d = (_c = (_b = completion.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : "";
            return { page_number, content: extracted };
        });
    },
});
const insertRealImages = (0, agents_1.tool)({
    name: "insert_real_images",
    description: "Detect image regions on the page, crop them, and replace placeholder images in the provided Markdown with the actual cropped images (preserving sizes via HTML img width/height).",
    parameters: zod_1.z.object({
        page_content: zod_1.z.object({
            page_number: zod_1.z.number(),
            content: zod_1.z.string(),
        }),
    }),
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page_content }) {
            var _b, _c, _d, _e;
            const { page_number, content } = page_content;
            if (!content || !content.trim()) {
                return { page_number, content: "" };
            }
            const fileName = `-${toThreeDigitString(page_number)}.png`;
            const imagePath = path_1.default.resolve(book_pages_directory, fileName);
            const imageExists = yield fs_1.default.promises
                .access(imagePath, fs_1.default.constants.R_OK)
                .then(() => true)
                .catch(() => false);
            if (!imageExists) {
                return { page_number, content };
            }
            const imageBuffer = yield fs_1.default.promises.readFile(imagePath);
            const sizeInfo = (0, image_size_1.default)(imageBuffer);
            const pageWidth = typeof (sizeInfo === null || sizeInfo === void 0 ? void 0 : sizeInfo.width) === "number" ? sizeInfo.width : undefined;
            const pageHeight = typeof (sizeInfo === null || sizeInfo === void 0 ? void 0 : sizeInfo.height) === "number" ? sizeInfo.height : undefined;
            const dataUrl = yield readImageAsDataUrl(imagePath);
            // Ask the vision model for image regions as strict JSON
            const detection = yield openai.chat.completions.create({
                model: "gpt-4.1-2025-04-14",
                messages: [
                    {
                        role: "system",
                        content: "You detect embedded images/figures/logos in a page image and return their bounding boxes as strict JSON. Output JSON only with no prose.",
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: (pageWidth && pageHeight
                                    ? `Page size: ${pageWidth}x${pageHeight} pixels.\n`
                                    : "") +
                                    "Return an array of objects with keys: left, top, width, height, alt.\n" +
                                    "The coordinates are in pixels with origin at top-left of the page image.\n" +
                                    "Round all values to integers. Clamp boxes to page bounds.\n" +
                                    "Pay attention to identify only clear images (logo, screenshots, infographics) without inluding text and misinpreting it as an image" +
                                    "Output strictly the JSON array with no markdown, no comments.",
                            },
                            { type: "image_url", image_url: { url: dataUrl } },
                        ],
                    },
                ],
            });
            let regions = [];
            const raw = (_e = (_d = (_c = (_b = detection.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : "";
            try {
                // Try to parse the whole content as JSON
                regions = JSON.parse(raw);
                if (!Array.isArray(regions))
                    regions = [];
            }
            catch (_f) {
                // Fallback: attempt to extract JSON array substring
                const start = raw.indexOf("[");
                const end = raw.lastIndexOf("]");
                if (start !== -1 && end !== -1 && end > start) {
                    try {
                        regions = JSON.parse(raw.slice(start, end + 1));
                        if (!Array.isArray(regions))
                            regions = [];
                    }
                    catch (_g) { }
                }
            }
            if (!regions.length) {
                console.warn("[insert_real_images] No image regions detected");
                return { page_number, content };
            }
            // Prepare output directory per page
            const assetsDir = path_1.default.resolve("./extracted_images", `page-${toThreeDigitString(page_number)}`);
            // Check if images already exist for this page
            const existingImages = yield checkExistingImages(assetsDir, page_number);
            if (existingImages.length > 0) {
                console.log(`[insert_real_images] Found ${existingImages.length} existing images for page ${page_number}, reusing them.`);
                // Replace placeholders with existing images
                const placeholderRegex = /!\[([^\]]*)\]\(https?:\/\/placehold\.co\/\d+x\d+\)/g;
                let fileIndex = 0;
                const replaced = content.replace(placeholderRegex, (_m, altFromMd) => {
                    const file = existingImages[fileIndex++];
                    if (!file)
                        return _m;
                    const altText = (file.alt && String(file.alt).trim()) ||
                        (altFromMd && String(altFromMd).trim()) ||
                        "Immagine";
                    return `<img src="${file.relPath}" alt="${altText}" width="${file.width}" height="${file.height}" />`;
                });
                // If there are more existing files than placeholders, append them at the end
                let finalContent = replaced;
                if (fileIndex < existingImages.length) {
                    const extras = existingImages
                        .slice(fileIndex)
                        .map((f) => `<img src="${f.relPath}" alt="Immagine" width="${f.width}" height="${f.height}" />`)
                        .join("\n\n");
                    finalContent += `\n\n${extras}`;
                }
                return { page_number, content: finalContent };
            }
            yield fs_1.default.promises.mkdir(assetsDir, { recursive: true });
            // Load full image buffer once (Sharp crops from buffer)
            const fullImageBuffer = yield fs_1.default.promises.readFile(imagePath);
            // Crop and write images
            const savedFiles = [];
            for (let i = 0; i < regions.length; i++) {
                let { left, top, width, height, alt } = regions[i];
                if (!Number.isFinite(left) ||
                    !Number.isFinite(top) ||
                    !Number.isFinite(width) ||
                    !Number.isFinite(height)) {
                    continue;
                }
                left = Math.max(0, Math.floor(left));
                top = Math.max(0, Math.floor(top));
                width = Math.max(1, Math.floor(width));
                height = Math.max(1, Math.floor(height));
                if (pageWidth && pageHeight) {
                    width = Math.min(width, pageWidth - left);
                    height = Math.min(height, pageHeight - top);
                }
                if (width <= 0 || height <= 0)
                    continue;
                const outName = `page-${toThreeDigitString(page_number)}-img-${String(i + 1).padStart(2, "0")}.png`;
                const outPath = path_1.default.resolve(assetsDir, outName);
                try {
                    const cropped = yield (0, sharp_1.default)(fullImageBuffer)
                        .extract({ left, top, width, height })
                        .png()
                        .toBuffer();
                    yield fs_1.default.promises.writeFile(outPath, cropped);
                }
                catch (cropErr) {
                    console.error(`[insert_real_images] Crop/write failed for region ${i}`, cropErr);
                    continue;
                }
                const relFromMd = path_1.default.relative(path_1.default.dirname(path_1.default.resolve(final_markdown_file)), outPath);
                savedFiles.push({
                    relPath: relFromMd.split(path_1.default.sep).join("/"),
                    width,
                    height,
                    alt,
                });
            }
            if (!savedFiles.length) {
                return { page_number, content };
            }
            // Replace placeholders with real images in order
            const placeholderRegex = /!\[([^\]]*)\]\(https?:\/\/placehold\.co\/\d+x\d+\)/g;
            let fileIndex = 0;
            const replaced = content.replace(placeholderRegex, (_m, altFromMd) => {
                const file = savedFiles[fileIndex++];
                if (!file)
                    return _m;
                const altText = (file.alt && String(file.alt).trim()) ||
                    (altFromMd && String(altFromMd).trim()) ||
                    "Immagine";
                return `<img src="${file.relPath}" alt="${altText}" width="${file.width}" height="${file.height}" />`;
            });
            // If there are more saved files than placeholders, append them at the end
            let finalContent = replaced;
            if (fileIndex < savedFiles.length) {
                const extras = savedFiles
                    .slice(fileIndex)
                    .map((f) => `<img src="${f.relPath}" alt="Immagine" width="${f.width}" height="${f.height}" />`)
                    .join("\n\n");
                finalContent += `\n\n${extras}`;
            }
            return { page_number, content: finalContent };
        });
    },
});
const translatePageContent = (0, agents_1.tool)({
    name: "translate_page_content",
    description: `Translate the content of a given page from English to ${TARGET_LANGUAGE} while preserving Markdown and keeping image/link placeholders intact.`,
    parameters: zod_1.z.object({
        page_content: zod_1.z.object({
            page_number: zod_1.z.number(),
            content: zod_1.z.string(),
        }),
    }),
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page_content }) {
            var _b, _c, _d, _e;
            const { page_number, content } = page_content;
            if (!content || !content.trim()) {
                return { page_number, content: "" };
            }
            const completion = yield openai.chat.completions.create({
                model: "gpt-4.1-2025-04-14",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert ${TARGET_LANGUAGE} translator who produces natural, idiomatic ${TARGET_LANGUAGE} text that sounds like it was written by a native speaker. Input is Markdown/HTML that may include image placeholders (e.g., ![alt](https://placehold.co/WxH)) or real <img> tags and placeholder links. 
					
					Translate from English to ${TARGET_LANGUAGE} with these guidelines: 
					1) Use natural ${TARGET_LANGUAGE} expressions and idioms rather than literal translations (e.g., ${getTranslationExample(TARGET_LANGUAGE)}). 
					2) Maintain the tone and style appropriate for ${TARGET_LANGUAGE} readers. 
					3) Preserve all formatting: heading levels, bold/italics, lists, tables, code blocks, line breaks, and <img> tag attributes (src, width, height). 
					4) Translate alt text and link text naturally, but keep all URLs unchanged. 
					5) Do not modify placeholder URLs or WxH dimensions. 
					6) SPECIAL SPX6900 TERMS - Do NOT translate these specific terms and slogans. Keep them in English and add explanatory translations in parentheses:
					   - SPX6900 slogans: "believe in something", "persist forever", "flip the stock market", "stop trading and believe in something", "there is no chart" - keep in English and add ${TARGET_LANGUAGE} explanation in parentheses
					   - SPX6900 technical terms: "Aeon", "Cognisphere", "Pure Belief Asset (PBA)" - keep in English and add ${TARGET_LANGUAGE} explanation in parentheses when first mentioned
					7) Output only the translated content without notes or explanations.`,
                    },
                    {
                        role: "user",
                        content: `Translate the following Markdown to ${TARGET_LANGUAGE}, preserving structure and placeholders.\n\n---\n${content}`,
                    },
                ],
            });
            const translated = (_e = (_d = (_c = (_b = completion.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : "";
            return { page_number, content: translated.trim() };
        });
    },
});
const savePageContent = (0, agents_1.tool)({
    name: "save_page_content",
    description: "Save the content of a given translated page to the final markdown file.",
    parameters: zod_1.z.object({
        page_content: zod_1.z.object({
            page_number: zod_1.z.number(),
            content: zod_1.z.string(),
        }),
    }),
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page_content }) {
            const { page_number, content } = page_content;
            const marker = `<!-- page: ${page_number} -->`;
            const sectionHeader = `\n\n${marker}\n\n`;
            const absoluteOutputPath = path_1.default.resolve(final_markdown_file);
            const bottomPageNumber = `\n\n<div align="center">\n\n${page_number}\n\n</div>\n`;
            yield fs_1.default.promises.appendFile(absoluteOutputPath, sectionHeader + content + bottomPageNumber);
            return { saved: true, path: absoluteOutputPath };
        });
    },
});
const getNextPageToTranslate = (0, agents_1.tool)({
    name: "get_next_page_to_translate",
    description: "Get the next page to translate.",
    parameters: zod_1.z.object({}),
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const absoluteDir = path_1.default.resolve(book_pages_directory);
            const entries = yield fs_1.default.promises.readdir(absoluteDir);
            const pageNumbers = entries
                .map((fileName) => {
                const match = fileName.match(/-(\d{3})\.png$/i);
                return match ? parseInt(match[1], 10) : null;
            })
                .filter((v) => v !== null)
                .sort((a, b) => a - b);
            if (pageNumbers.length === 0) {
                return { page_number: null };
            }
            const absoluteOutputPath = path_1.default.resolve(final_markdown_file);
            let completedPages = new Set();
            const outputExists = yield fs_1.default.promises
                .access(absoluteOutputPath, fs_1.default.constants.R_OK)
                .then(() => true)
                .catch(() => false);
            if (outputExists) {
                const outputContent = yield fs_1.default.promises.readFile(absoluteOutputPath, "utf8");
                const regex = /<!--\s*page:\s*(\d+)\s*-->/g;
                let match;
                while ((match = regex.exec(outputContent)) !== null) {
                    const page = parseInt(match[1], 10);
                    if (Number.isFinite(page))
                        completedPages.add(page);
                }
            }
            for (const num of pageNumbers) {
                if (!completedPages.has(num)) {
                    return { page_number: num };
                }
            }
            return { page_number: null };
        });
    },
});
const agent = new agents_1.Agent({
    name: "Book translator",
    instructions: `You are a professional book translator specializing in natural, idiomatic ${TARGET_LANGUAGE} translations. 
		
		For each page image, first produce rich Markdown that preserves layout and formatting: map larger font sizes to appropriate Markdown headings, keep **bold** and *italics*, lists, tables, and line breaks. 
		
		Detect embedded images (figures/charts/logos) and insert image placeholders using the service 'https://placehold.co' in the format /WIDTHxHEIGHT sized to the detected regions (do not include the entire page as one image). 
		
		Detect visible hyperlinks and output them as Markdown links pointing to a placeholder URL only. 
		
		Next, replace the image placeholders with the actual cropped images by using the tool that inserts real images, preserving width/height. IMPORTANT: The system will automatically check if images for this page already exist in the 'extracted_images' directory. If existing images are found, they will be reused instead of extracting new ones, which improves efficiency and consistency. Multiple images per page are supported.
		
		Finally, translate the Markdown to ${TARGET_LANGUAGE} using natural, fluent ${TARGET_LANGUAGE} that sounds like it was written by a native ${TARGET_LANGUAGE} speaker. Avoid literal translations - instead use idiomatic expressions and natural ${TARGET_LANGUAGE} phrasing. For example, ${getTranslationExample(TARGET_LANGUAGE)}. Keep all Markdown structure and placeholder URLs/dimensions intact. Save the translated Markdown to the final book file.`,
    model: "gpt-5-2025-08-07",
    tools: [
        readPageContent,
        insertRealImages,
        translatePageContent,
        savePageContent,
        getNextPageToTranslate,
    ],
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    // Initialize translation paths before starting
    yield initializeTranslationPaths();
    const result = yield (0, agents_1.run)(agent, `translate the book in ${TARGET_LANGUAGE}`, {
        maxTurns: 1000,
    });
    console.log(result.finalOutput);
    // After generating the Markdown, convert it to a fixed-height paginated PDF
    // try {
    // 	const pdfPath = path.join(path.dirname(final_markdown_file), "final_book.pdf");
    // 	await convertMarkdownToPdf({
    // 		markdownPath: path.resolve(final_markdown_file),
    // 		outputPdfPath: path.resolve(pdfPath),
    // 		firstImagePath: path.resolve(book_pages_directory, "-001.png"),
    // 		target_language_code: TARGET_LANGUAGE_CODE,
    // 	});
    // 	console.log("PDF generated at:", path.resolve(pdfPath));
    // } catch (err) {
    // 	console.error("Failed to generate PDF:", err);
    // }
});
main();
//# sourceMappingURL=index.js.map