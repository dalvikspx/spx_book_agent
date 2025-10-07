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
            const content = sections[i + 1] || '';
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
                images
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
            const fullPath = path.resolve('translations/it', imagePath);
            if (!fs.existsSync(fullPath)) {
                console.warn(`Immagine non trovata: ${fullPath}`);
                throw new Error(`Immagine non trovata: ${fullPath}`);
            }
            // Usa sharp per convertire l'immagine in buffer
            const imageBuffer = yield (0, sharp_1.default)(fullPath)
                .png()
                .toBuffer();
            return imageBuffer;
        }
        catch (error) {
            console.error(`Errore nel processare l'immagine ${imagePath}:`, error);
            throw error;
        }
    });
}
// Funzione per estrarre dimensioniImmagine dal tag HTML
function extractImageDimensions(imgTag) {
    const widthMatch = imgTag.match(/width="(\d+)"/);
    const heightMatch = imgTag.match(/height="(\d+)"/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 300;
    const height = heightMatch ? parseInt(heightMatch[1]) : 200;
    return { width, height };
}
// Funzione per parsare la formattazione markdown e convertirla in TextRun array
function parseMarkdownFormatting(text, baseSize, baseFont) {
    const textRuns = [];
    // Regex per trovare pattern di formattazione (grassetto e corsivo)
    // Pattern complesso che gestisce anche formattazioni combinate
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
                    font: baseFont
                }));
            }
        }
        const formattedText = match[0];
        // Gestisci grassetto **testo**
        if (formattedText.startsWith('**') && formattedText.endsWith('**')) {
            const boldText = formattedText.slice(2, -2);
            textRuns.push(new docx_1.TextRun({
                text: boldText,
                bold: true,
                size: baseSize,
                font: baseFont
            }));
        }
        // Gestisci corsivo _testo_
        else if (formattedText.startsWith('_') && formattedText.endsWith('_')) {
            const italicText = formattedText.slice(1, -1);
            textRuns.push(new docx_1.TextRun({
                text: italicText,
                italics: true,
                size: baseSize,
                font: baseFont
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
                font: baseFont
            }));
        }
    }
    // Se non ci sono formattazioni, restituisci un solo TextRun con il testo originale
    if (textRuns.length === 0) {
        return [
            new docx_1.TextRun({
                text: text,
                size: baseSize,
                font: baseFont
            })
        ];
    }
    return textRuns;
}
// Funzione per convertire il contenuto markdown in sezioni DOCX con footer
function convertMarkdownToDocxPages(pages) {
    return __awaiter(this, void 0, void 0, function* () {
        const sections = [];
        for (const page of pages) {
            // Array per i paragrafi di questa pagina specifica
            const pageParagraphs = [];
            // Processa il contenuto della pagina
            const lines = page.content.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                // Salta le linee vuote
                if (!trimmedLine)
                    continue;
                // Salta i separatori "---"
                if (trimmedLine === '---')
                    continue;
                // Salta i div di chiusura </div>
                if (trimmedLine === '</div>')
                    continue;
                // Gestisci headings
                if (trimmedLine.startsWith('# ')) {
                    const titleText = trimmedLine.substring(2);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(titleText, 32, "Arial"),
                        heading: docx_1.HeadingLevel.TITLE,
                        spacing: { before: 400, after: 300 }
                    }));
                }
                else if (trimmedLine.startsWith('## ')) {
                    const headingText = trimmedLine.substring(3);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(headingText, 28, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 200 }
                    }));
                }
                else if (trimmedLine.startsWith('### ')) {
                    const subHeadingText = trimmedLine.substring(4);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(subHeadingText, 24, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 150 }
                    }));
                }
                else if (trimmedLine.startsWith('#### ')) {
                    const subSubHeadingText = trimmedLine.substring(5);
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(subSubHeadingText, 22, "Arial"),
                        heading: docx_1.HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 150 }
                    }));
                }
                else if (trimmedLine.match(/^<img[^>]+>$/)) {
                    // Gestisci immagini
                    try {
                        const imgTag = trimmedLine;
                        const srcMatch = imgTag.match(/src="([^"]+)"/);
                        if (srcMatch) {
                            const imagePath = srcMatch[1];
                            const imageBuffer = yield processImage(imagePath);
                            const dimensions = extractImageDimensions(imgTag);
                            pageParagraphs.push(new docx_1.Paragraph({
                                children: [
                                    new docx_1.ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: dimensions.width,
                                            height: dimensions.height,
                                        },
                                        type: "png"
                                    })
                                ],
                                alignment: docx_1.AlignmentType.CENTER,
                                spacing: { before: 200, after: 200 }
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
                                    font: "Arial"
                                })
                            ],
                            alignment: docx_1.AlignmentType.CENTER,
                            spacing: { before: 200, after: 200 }
                        }));
                    }
                }
                else if (trimmedLine.match(/^<div align="center">/)) {
                    // Salta i div center per numeri di pagina (verranno messi nel footer)
                    continue;
                }
                else if (trimmedLine.startsWith('|')) {
                    // Inizia una tabella - sempliciamo per ora
                    // Per ora tratta le tabelle come testo normale
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(trimmedLine, 20, "Arial"),
                        spacing: { before: 100, after: 100 }
                    }));
                }
                else if (trimmedLine.startsWith('-')) {
                    // Liste
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(trimmedLine, 22, "Arial"),
                        spacing: { before: 100, after: 100 },
                        indent: { left: 720 }
                    }));
                }
                else {
                    // Testo normale
                    pageParagraphs.push(new docx_1.Paragraph({
                        children: parseMarkdownFormatting(trimmedLine, 22, "Arial"),
                        spacing: { before: 100, after: 100 }
                    }));
                }
            }
            // Crea il footer con il numero di pagina per questa pagina
            const footer = new docx_1.Footer({
                children: [
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: page.pageNumber.toString(),
                                size: 20,
                                color: "666666",
                                font: "Arial"
                            })
                        ],
                        alignment: docx_1.AlignmentType.CENTER
                    })
                ]
            });
            // Crea la sezione per questa pagina con i suoi paragrafi e footer
            sections.push({
                properties: {},
                children: pageParagraphs,
                footers: {
                    default: footer
                }
            });
        }
        return sections;
    });
}
// Funzione principale
function createDocxFromMarkdown() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Inizio conversione da Markdown a DOCX...');
            // Leggi il file markdown
            const markdownPath = 'translations/it/final_book.md';
            if (!fs.existsSync(markdownPath)) {
                throw new Error(`File markdown non trovato: ${markdownPath}`);
            }
            const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
            console.log('File markdown letto correttamente');
            // Dividi in pagine
            const pages = splitIntoPages(markdownContent);
            console.log(`Trovate ${pages.length} pagine`);
            // Converti in sezioni DOCX con footer
            const sections = yield convertMarkdownToDocxPages(pages);
            console.log('Contenuto convertito in sezioni DOCX con footer');
            // Crea il documento
            const doc = new docx_1.Document({
                sections: sections
            });
            // Genera il buffer DOCX
            const buffer = yield docx_1.Packer.toBuffer(doc);
            console.log('Documento DOCX generato');
            // Salva il file
            const outputPath = 'translations/it/final_book.docx';
            fs.writeFileSync(outputPath, buffer);
            console.log(`File DOCX salvato in: ${outputPath}`);
            console.log('Conversione completata con successo!');
        }
        catch (error) {
            console.error('Errore durante la conversione:', error);
            process.exit(1);
        }
    });
}
// Esegui la funzione principale
if (require.main === module) {
    createDocxFromMarkdown();
}
//# sourceMappingURL=create-docx.js.map