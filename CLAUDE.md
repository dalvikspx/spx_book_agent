# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered book translation agent that translates the SPX6900 book from English into any target language. It uses OpenAI's GPT models with vision capabilities to process scanned book pages (PNG images), extract text and images, translate content naturally while preserving layout, and generate markdown output organized by language.

## Build & Run Commands

```bash
# Install dependencies
npm install

# Compile TypeScript and run translation
npm run build:start

# Or run separately:
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled JavaScript
```

## Environment Configuration

Copy `env.example` to `.env` and configure:

- `OPENAI_API_KEY` - Required OpenAI API key
- `TARGET_LANGUAGE` - Full language name (e.g., "Italian", "Spanish", "French")
- `TARGET_LANGUAGE_CODE` - ISO language code for HTML (e.g., "it", "es", "fr")

**Language-specific example files**: `env.hindi`, `env.mandarin`, `env.thai` provide configuration templates for specific languages.

## Architecture Overview

### Core Translation Pipeline

The agent follows a 5-step process for each page:

1. **OCR & Layout Extraction** (`readPageContent` tool) - Uses GPT-4.1 vision to extract text from PNG page images, preserving markdown structure, detecting image regions, and inserting placeholder images
2. **Image Handling** (`insertRealImages` tool) - Either reuses existing images from `extracted_images/page-XXX/` or detects/crops new images from the page
3. **Translation** (`translatePageContent` tool) - Translates to target language using natural idioms (not literal translation), with special handling for SPX6900-specific terms that should remain in English
4. **Persistence** (`savePageContent` tool) - Appends translated content to language-specific markdown file with page markers
5. **Progress Tracking** (`getNextPageToTranslate` tool) - Determines next untranslated page by checking existing page markers in output file

### Key Design Patterns

**Batch Processing**: The agent is designed to translate in batches (recommended: pages 1-52, 53-104, 105-157) rather than all 157 pages at once. Modify the prompt in `index.ts` main function to specify page ranges.

**Incremental Translation**: The system tracks completed pages via HTML comments (`<!-- page: N -->`) in the output markdown, allowing interrupted translations to resume.

**Image Reuse Strategy**: Before attempting image extraction, the system checks `extracted_images/page-XXX/` for existing images. This allows manual image extraction (higher quality) to override automatic extraction.

**Translation Quality**: The agent uses context-aware translation with examples (see `getTranslationExample()`) to avoid literal translations. Special handling prevents translation of SPX6900-specific terminology like "believe in something", "Pure Belief Asset", etc.

## Directory Structure

```
book_pages/              # Source: PNG images named -001.png, -002.png, etc.
translations/            # Output: Language-specific subdirectories
  ├── it/               # Italian translations
  ├── fr/               # French translations
  ├── zh/               # Mandarin Chinese translations
  └── [lang-code]/      # Other language translations
      └── final_book.md # Markdown output with page markers
extracted_images/        # Optional: Manually extracted images
  └── page-XXX/         # Per-page image directories
      └── page-XXX-img-YY.png
utils/
  └── pdf.ts            # Markdown-to-PDF conversion (currently commented out)
```

## Working with Translations

### To Start a New Translation

1. Set `TARGET_LANGUAGE` and `TARGET_LANGUAGE_CODE` in `.env`
2. Modify the prompt in `main()` function in `index.ts` line 642 to specify page range
3. Run `npm run build:start`
4. Output will be saved to `translations/[lang-code]/final_book.md`

### To Resume an Interrupted Translation

The agent automatically detects completed pages by scanning for `<!-- page: N -->` markers in the output file. Simply run again with the same configuration - it will continue from where it stopped.

### Translation Quality Considerations

- The agent may translate some words too literally (e.g., "tip" as "suggestion" instead of "gratuity")
- Hyperlinks from the original book are lost and must be manually re-added
- Image extraction accuracy is limited by GPT-4 vision capabilities
- For better results, manually extract images from the PDF and place them in `extracted_images/page-XXX/` directories before running the translation

## Agent Framework

This project uses OpenAI's Agents SDK (`@openai/agents`) with:
- **Agent model**: GPT-5 (2025-08-07) for orchestration
- **Vision model**: GPT-4.1 (2025-04-14) for OCR and image detection
- **Tools**: Custom Zod-validated tools for each pipeline step
- **Execution**: `run()` function with configurable max turns (default: 1000)

## Image Processing

Uses `sharp` for image manipulation, `image-size` for dimension detection, and `jimp` as a fallback. Images are:
- Cropped based on GPT-4 vision bounding box detection
- Saved with standardized naming: `page-XXX-img-YY.png`
- Inserted as HTML `<img>` tags with explicit width/height attributes
- Referenced via relative paths from the markdown file location

## PDF Generation (Currently Disabled)

The `utils/pdf.ts` module uses Puppeteer to convert markdown to paginated PDF with:
- Fixed page dimensions matching original book aspect ratio
- Inline base64 image encoding for self-contained HTML
- Page numbers centered at bottom
- Currently commented out in `main()` function (lines 650-661)

## Known Limitations

1. **Literal translations** - Context-dependent terms may be translated incorrectly
2. **Image extraction** - GPT-4 vision isn't specialized for precise bounding box detection
3. **Lost hyperlinks** - Original PDF links are not preserved in translation
4. **Page numbers** - Standalone page numbers should be filtered out but may occasionally appear

## Special Translation Rules

SPX6900-specific terms should NOT be translated:
- Slogans: "believe in something", "persist forever", "flip the stock market", "stop trading and believe in something", "there is no chart"
- Technical terms: "Aeon", "Cognisphere", "Pure Belief Asset (PBA)"

Keep these in English and add target language explanations in parentheses when first mentioned.
