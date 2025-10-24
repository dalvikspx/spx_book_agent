"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createDocxFromMarkdown = createDocxFromMarkdown;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline/promises"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const docx_1 = require("docx");
const sharp_1 = __importDefault(require("sharp"));
// Configurazione markdown-it
const md = new markdown_it_1.default();
// Funzione per dividere il markdown in pagine
function splitIntoPages(markdownContent) {
    const pages = [];
    const sections = markdownContent.split(/<!-- page:\s*(\d+)\s*-->/);
    for (let i = 1; i < sections.length; i += 2) {
        if (sections[i]) {
            const pageNumber = parseInt(sections[i]);
            const content = sections[i + 1] || "";
            // Estrai i percorsi delle immagini dal contenuto
            const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
            const images = [];
            let match;
            while ((match = imageRegex.exec(content)) !== null) {
                images.push(match[1]);
            }
            pages.push({
                pageNumber,
                content: content.trim(),
                images,
            });
        }
    }
    return pages;
}
// Funzione per processare le immagini
function processImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Risolvi il percorso relativo rispetto al file markdown
            const fullPath = path.resolve("translations/it", imagePath);
            if (!fs.existsSync(fullPath)) {
                console.warn(`Immagine non trovata: ${fullPath}`);
                throw new Error(`Immagine non trovata: ${fullPath}`);
            }
            // Usa sharp per convertire l'immagine in buffer e ottenere le dimensioni
            const image = (0, sharp_1.default)(fullPath);
            const metadata = yield image.metadata();
            const imageBuffer = yield image.png().toBuffer();
            return {
                buffer: imageBuffer,
                metadata: {
                    width: metadata.width || 300,
                    height: metadata.height || 200,
                },
            };
        }
        catch (error) {
            console.error(`Errore nel processare l'immagine ${imagePath}:`, error);
            throw error;
        }
    });
}
// Larghezza massima per le immagini (in pixel) - circa 6 pollici per A4 con margini
const MAX_IMAGE_WIDTH = 550;
// Funzione per calcolare le dimensioni dell'immagine rispettando i limiti della pagina
function calculateImageDimensions(imgTag, actualWidth, actualHeight) {
    // Prova a estrarre dimensioni dal tag HTML
    const widthMatch = imgTag.match(/width="(\d+)"/);
    const heightMatch = imgTag.match(/height="(\d+)"/);
    let width = widthMatch ? parseInt(widthMatch[1]) : actualWidth;
    let height = heightMatch ? parseInt(heightMatch[1]) : actualHeight;
    // Se l'immagine è troppo larga, ridimensiona proporzionalmente
    if (width > MAX_IMAGE_WIDTH) {
        const ratio = MAX_IMAGE_WIDTH / width;
        width = MAX_IMAGE_WIDTH;
        height = Math.round(height * ratio);
    }
    return { width, height };
}
// Funzione per ottenere l'immagine di una tabella dalla directory extracted_images
function getTableImage(pageNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        // Formatta il numero di pagina con padding (es: 18 -> "018")
        const pageStr = pageNumber.toString().padStart(3, "0");
        const dirPath = path.resolve("extracted_images", `page-${pageStr}`);
        // Verifica se la directory esiste
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Directory non trovata per le immagini della pagina ${pageNumber}: ${dirPath}\n` +
                `Assicurati di aver estratto le immagini delle tabelle in extracted_images/page-${pageStr}/`);
        }
        // Lista tutti i file nella directory
        const files = fs.readdirSync(dirPath);
        // Filtra solo i file immagine
        const imageExtensions = [".png", ".jpg", ".jpeg"];
        const imageFiles = files.filter((file) => imageExtensions.includes(path.extname(file).toLowerCase()));
        // Caso: nessuna immagine trovata
        if (imageFiles.length === 0) {
            throw new Error(`Nessuna immagine trovata nella directory ${dirPath}\n` +
                `Aggiungi l'immagine della tabella per la pagina ${pageNumber} in questa directory.`);
        }
        // Caso: esattamente un'immagine trovata
        if (imageFiles.length === 1) {
            console.log(`Trovata 1 immagine per la tabella della pagina ${pageNumber}: ${imageFiles[0]}`);
            return path.join(dirPath, imageFiles[0]);
        }
        // Caso: multiple immagini trovate - chiedi all'utente
        console.log(`\nTrovate ${imageFiles.length} immagini nella directory page-${pageStr}:`);
        imageFiles.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
        });
        // Crea interfaccia readline per input utente
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        try {
            const answer = yield rl.question(`\nInserisci il nome del file immagine da utilizzare per la tabella: `);
            rl.close();
            const selectedFile = answer.trim();
            // Verifica che il file selezionato sia nella lista
            if (!imageFiles.includes(selectedFile)) {
                throw new Error(`File "${selectedFile}" non trovato. File disponibili: ${imageFiles.join(", ")}`);
            }
            console.log(`Utilizzo immagine: ${selectedFile}\n`);
            return path.join(dirPath, selectedFile);
        }
        catch (error) {
            rl.close();
            throw error;
        }
    });
}
// Funzione helper per processare grassetto e corsivo in un testo
function processTextFormatting(text, baseSize, baseFont) {
    const textRuns = [];
    // Regex per trovare pattern di formattazione (grassetto e corsivo)
    const formatRegex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
    let lastIndex = 0;
    let match;
    while ((match = formatRegex.exec(text)) !== null) {
        // Aggiungi testo normale prima della formattazione
        if (match.index > lastIndex) {
            const normalText = text.substring(lastIndex, match.index);
            if (normalText.trim()) {
                textRuns.push(new docx_1.TextRun({
                    text: normalText,
                    size: baseSize,
                    font: baseFont,
                }));
            }
        }
        const formattedText = match[0];
        // Gestisci grassetto **testo**
        if (formattedText.startsWith("**") && formattedText.endsWith("**")) {
            const boldText = formattedText.slice(2, -2);
            textRuns.push(new docx_1.TextRun({
                text: boldText,
                bold: true,
                size: baseSize,
                font: baseFont,
            }));
        }
        // Gestisci corsivo _testo_
        else if (formattedText.startsWith("_") && formattedText.endsWith("_")) {
            const italicText = formattedText.slice(1, -1);
            textRuns.push(new docx_1.TextRun({
                text: italicText,
                italics: true,
                size: baseSize,
                font: baseFont,
            }));
        }
        lastIndex = match.index + match[0].length;
    }
    // Aggiungi testo rimanente dopo l'ultima formattazione
    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        if (remainingText.trim()) {
            textRuns.push(new docx_1.TextRun({
                text: remainingText,
                size: baseSize,
                font: baseFont,
            }));
        }
    }
    // Se non ci sono formattazioni, restituisci un solo TextRun con il testo originale
    if (textRuns.length === 0) {
        return [
            new docx_1.TextRun({
                text: text,
                size: baseSize,
                font: baseFont,
            }),
        ];
    }
    return textRuns;
}
// Funzione per parsare la formattazione markdown e convertirla in TextRun/ExternalHyperlink array
function parseMarkdownFormatting(text, baseSize, baseFont) {
    const result = [];
    // Regex per trovare link markdown [testo](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        // Processa testo prima del link
        if (match.index > lastIndex) {
            const textBefore = text.substring(lastIndex, match.index);
            result.push(...processTextFormatting(textBefore, baseSize, baseFont));
        }
        const linkText = match[1];
        const url = match[2];
        // Se è un URL placeholder, aggiungi solo il testo senza hyperlink
        if (url === "https://example.com/placeholder") {
            result.push(...processTextFormatting(linkText, baseSize, baseFont));
        }
        else {
            // Crea un hyperlink con il testo formattato
            result.push(new docx_1.ExternalHyperlink({
                children: processTextFormatting(linkText, baseSize, baseFont),
                link: url,
            }));
        }
        lastIndex = match.index + match[0].length;
    }
    // Processa testo rimanente dopo l'ultimo link
    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        result.push(...processTextFormatting(remainingText, baseSize, baseFont));
    }
    // Se non ci sono link, processa solo la formattazione
    if (result.length === 0) {
        return processTextFormatting(text, baseSize, baseFont);
    }
    return result;
}
// Funzione per parsare una tabella markdown in oggetto Table DOCX
function parseMarkdownTable(tableLines) {
    // Filtra la riga separatore (|---|---|)
    const rows = tableLines.filter((line) => !line.match(/^\|[\s:-]+\|/));
    // Calcola il numero di colonne dalla prima riga
    const firstRowCells = rows[0]
        .split("|")
        .filter((cell) => cell.trim())
        .map((cell) => cell.trim());
    const numColumns = firstRowCells.length;
    // Larghezza totale utilizzabile per A4 con margini (circa 9000 DXA = 450 pt = 6.25 pollici)
    const totalWidth = 9000;
    const columnWidth = Math.floor(totalWidth / numColumns);
    const tableRows = rows.map((line, index) => {
        const cells = line
            .split("|")
            .filter((cell) => cell.trim())
            .map((cell) => cell.trim());
        return new docx_1.TableRow({
            children: cells.map((cellText) => new docx_1.TableCell({
                children: [
                    new docx_1.Paragraph({
                        children: parseMarkdownFormatting(cellText, index === 0 ? 26 : 24, // Header più grande
                        "Arial"),
                    }),
                ],
                width: {
                    size: columnWidth,
                    type: docx_1.WidthType.DXA,
                },
                margins: {
                    top: 150,
                    bottom: 150,
                    left: 200,
                    right: 200,
                },
                // Header con sfondo grigio chiaro
                shading: index === 0
                    ? {
                        fill: "E0E0E0",
                        color: "auto",
                    }
                    : undefined,
            })),
        });
    });
    return new docx_1.Table({
        rows: tableRows,
        width: { size: totalWidth, type: docx_1.WidthType.DXA },
    });
}
// Funzione per convertire il contenuto markdown in sezioni DOCX con footer
function convertMarkdownToDocxPages(pages) {
    return __awaiter(this, void 0, void 0, function* () {
        const sections = [];
        for (const page of pages) {
            // Array per i paragrafi di questa pagina specifica
            const pageParagraphs = [];
            // Processa il contenuto della pagina
            const lines = page.content.split("\n");
            let tableLines = [];
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Salta le linee vuote
                if (!trimmedLine)
                    continue;
                // Salta i separatori "---"
                if (trimmedLine === "---")
                    continue;
                // Salta i div di chiusura </div>
                if (trimmedLine === "</div>")
                    continue;
                // Salta il numero di pagina standalone solo se corrisponde al numero di pagina corrente (sarà nel footer)
                if (trimmedLine === page.pageNumber.toString())
                    continue;
                // Gestisci headings
                if (trimmedLine.startsWith("# ")) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    const titleText = trimmedLine.substring(2);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(titleText, 36, "Arial"),
                        heading: docx_1.HeadingLevel.TITLE,
                        spacing: { before: 400, after: 300, line: 480, lineRule: "auto" },
                    }));
                }
                else if (trimmedLine.startsWith("## ")) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    const headingText = trimmedLine.substring(3);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(headingText, 32, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 200, line: 480, lineRule: "auto" },
                    }));
                }
                else if (trimmedLine.startsWith("### ")) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    const subHeadingText = trimmedLine.substring(4);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(subHeadingText, 28, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 150, line: 480, lineRule: "auto" },
                    }));
                }
                else if (trimmedLine.startsWith("#### ")) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    const subSubHeadingText = trimmedLine.substring(5);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(subSubHeadingText, 26, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 150, line: 480, lineRule: "auto" },
                    }));
                }
                else if (trimmedLine.match(/^<img[^>]+>$/)) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    // Gestisci immagini
                    try {
                        const imgTag = trimmedLine;
                        const srcMatch = imgTag.match(/src="([^"]+)"/);
                        if (srcMatch) {
                            const imagePath = srcMatch[1];
                            const { buffer: imageBuffer, metadata } = yield processImage(imagePath);
                            const dimensions = calculateImageDimensions(imgTag, metadata.width, metadata.height);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                        }
                    }
                    catch (error) {
                        // In caso di errore con l'immagine, aggiungi un placeholder
                        pageParagraphs.push(new docx_1.Paragraph({
                            children: [
                                new docx_1.TextRun({
                                    text: `[Immagine non disponibile: ${trimmedLine}]`,
                                    italics: true,
                                    color: "999999",
                                    font: "Arial",
                                }),
                            ],
                            alignment: docx_1.AlignmentType.CENTER,
                            spacing: { before: 200, after: 200, line: 480, lineRule: "auto" },
                        }));
                    }
                }
                else if (trimmedLine.match(/^<div align="center">/)) {
                    // Salta i div center per numeri di pagina (verranno messi nel footer)
                    continue;
                }
                else if (trimmedLine.startsWith("|")) {
                    // Accumula righe di tabella
                    tableLines.push(trimmedLine);
                }
                else if (trimmedLine.startsWith("-")) {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    // Liste
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(trimmedLine, 26, "Arial"),
                        spacing: { before: 100, after: 100, line: 480, lineRule: "auto" },
                        indent: { left: 720 },
                    }));
                }
                else {
                    // Se c'erano righe di tabella accumulate, carica l'immagine della tabella
                    if (tableLines.length > 0) {
                        try {
                            const tableImagePath = yield getTableImage(page.pageNumber);
                            const image = (0, sharp_1.default)(tableImagePath);
                            const metadata = yield image.metadata();
                            const imageBuffer = yield image.png().toBuffer();
                            const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png",
                                    }),
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: {
                                    before: 200,
                                    after: 200,
                                    line: 480,
                                    lineRule: "auto",
                                },
                            }));
                            tableLines = [];
                        }
                        catch (error) {
                            console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                            throw error;
                        }
                    }
                    // Testo normale
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(trimmedLine, 26, "Arial"),
                        spacing: { before: 100, after: 100, line: 480, lineRule: "auto" },
                    }));
                }
            }
            // Se ci sono righe di tabella alla fine della pagina, carica l'immagine della tabella
            if (tableLines.length > 0) {
                try {
                    const tableImagePath = yield getTableImage(page.pageNumber);
                    const image = (0, sharp_1.default)(tableImagePath);
                    const metadata = yield image.metadata();
                    const imageBuffer = yield image.png().toBuffer();
                    const dimensions = calculateImageDimensions("", metadata.width || 300, metadata.height || 200);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: [
                            new docx_1.ImageRun({
                                data: imageBuffer,
                                transformation: {
                                    width: dimensions.width,
                                    height: dimensions.height,
                                },
                                type: "png",
                            }),
                        ],
                        alignment: docx_1.AlignmentType.CENTER,
                        spacing: {
                            before: 200,
                            after: 200,
                            line: 480,
                            lineRule: "auto",
                        },
                    }));
                }
                catch (error) {
                    console.error(`Errore nel caricare l'immagine della tabella per la pagina ${page.pageNumber}:`, error);
                    throw error;
                }
            }
            // Crea il footer con il numero di pagina per questa pagina
            const footer = new docx_1.Footer({
                children: [
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: page.pageNumber.toString(),
                                size: 24,
                                color: "666666",
                                font: "Arial",
                            }),
                        ],
                        alignment: docx_1.AlignmentType.CENTER,
                    }),
                ],
            });
            // Crea la sezione per questa pagina con i suoi paragrafi e footer
            sections.push({
                properties: {},
                children: pageParagraphs,
                footers: {
                    default: footer,
                },
            });
        }
        return sections;
    });
}
// Funzione principale
function createDocxFromMarkdown() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Inizio conversione da Markdown a DOCX...");
            // Leggi il file markdown
            const markdownPath = "translations/it/final_book.md";
            if (!fs.existsSync(markdownPath)) {
                throw new Error(`File markdown non trovato: ${markdownPath}`);
            }
            const markdownContent = fs.readFileSync(markdownPath, "utf-8");
            console.log("File markdown letto correttamente");
            // Dividi in pagine
            const pages = splitIntoPages(markdownContent);
            console.log(`Trovate ${pages.length} pagine`);
            // Converti in sezioni DOCX con footer
            const sections = yield convertMarkdownToDocxPages(pages);
            console.log("Contenuto convertito in sezioni DOCX con footer");
            // Crea il documento
            const doc = new docx_1.Document({
                sections: sections,
            });
            // Genera il buffer DOCX
            const buffer = yield docx_1.Packer.toBuffer(doc);
            console.log("Documento DOCX generato");
            // Salva il file
            const outputPath = "translations/it/final_book.docx";
            fs.writeFileSync(outputPath, buffer);
            console.log(`File DOCX salvato in: ${outputPath}`);
            console.log("Conversione completata con successo!");
        }
        catch (error) {
            console.error("Errore durante la conversione:", error);
            process.exit(1);
        }
    });
}
// Esegui la funzione principale
if (require.main === module) {
    createDocxFromMarkdown();
}
//# sourceMappingURL=create-docx.js.map