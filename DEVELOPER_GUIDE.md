# Developer Guide - SPX6900 Book Translation AI Agent

Welcome, fellow developers and tech enthusiasts! 🚀 This guide covers everything you need to get the SPX6900 Book Translation AI Agent up and running on your machine.

## Prerequisites

Before diving in, make sure you have:

- Node.js (version 16 or higher)
- npm or yarn package manager
- OpenAI API key

## Installation & Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if from GitHub) or navigate to the project directory
cd spx_book_agent

# Install dependencies
npm install
```

### Step 2: Environment Configuration

1. Copy the example environment file:

```bash
cp env.example .env
```

2. Edit the `.env` file and configure the following variables:

```bash
# Your OpenAI API key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Target language - Full language name
TARGET_LANGUAGE=Italian

# Target language code - ISO language code for HTML
TARGET_LANGUAGE_CODE=it
```

### Step 3: Language Configuration

To translate to different languages, modify the `TARGET_LANGUAGE` and `TARGET_LANGUAGE_CODE` in your `.env` file:

**Supported languages with built-in examples:**

- **Italian**: `TARGET_LANGUAGE=Italian` and `TARGET_LANGUAGE_CODE=it`
- **Spanish**: `TARGET_LANGUAGE=Spanish` and `TARGET_LANGUAGE_CODE=es`
- **French**: `TARGET_LANGUAGE=French` and `TARGET_LANGUAGE_CODE=fr`
- **German**: `TARGET_LANGUAGE=German` and `TARGET_LANGUAGE_CODE=de`
- **Portuguese**: `TARGET_LANGUAGE=Portuguese` and `TARGET_LANGUAGE_CODE=pt`

**For other languages:**

```bash
TARGET_LANGUAGE=Chinese
TARGET_LANGUAGE_CODE=zh

# Or
TARGET_LANGUAGE=Japanese
TARGET_LANGUAGE_CODE=ja

# Or any other language
TARGET_LANGUAGE=Hindi
TARGET_LANGUAGE_CODE=hi
```

### Step 4: Prepare the Book

1. Ensure the PDF file `Discovering_SPX6900_The_World's_First_Pure_Belief_Asset_E_book.pdf` is in the project root directory
2. (Optional) Manually extract and place images in the `extracted_images/` directory for better quality

## Running the Translation Agent

### Recommended Approach: Batch Processing

For optimal performance and reliability, it's **highly recommended** to run the agent in **3 separate batches** instead of processing all 157 pages at once:

**Batch 1: Pages 1-52**

1. Edit `index.ts` in the `main` function and modify the prompt to:
   ```typescript
   "Translate from page 1 to page 52 to ${TARGET_LANGUAGE}.`";
   ```
2. Run the agent:
   ```bash
   npm run build:start
   ```

**Batch 2: Pages 53-104**

1. Edit `index.ts` in the `main` function and modify the prompt to:
   ```typescript
   "Translate from page 53 to page 104 to ${TARGET_LANGUAGE}.`";
   ```
2. Run the agent:
   ```bash
   npm run build:start
   ```

**Batch 3: Pages 105-157**

1. Edit `index.ts` in the `main` function and modify the prompt to:
   ```typescript
   "Translate from page 105 to the end of the book to ${TARGET_LANGUAGE}.`";
   ```
2. Run the agent:
   ```bash
   npm run build:start
   ```

### Why Batch Processing?

- **Better reliability**: Avoids timeouts and memory issues with large batches
- **Progress tracking**: You can monitor translation quality incrementally
- **Error recovery**: If something goes wrong, you don't lose all progress
- **Resource management**: More efficient use of OpenAI API limits

## Build and Run Commands

### Primary Command

```bash
# Compile TypeScript and run the agent
npm run build:start
```

### Alternative Commands

```bash
# Just compile TypeScript
npm run build

# Run the compiled JavaScript (after building)
npm run start
```

## Expected Output

The agent will:

1. Process each page of the PDF book (in batches of ~50 pages)
2. Extract and translate the text content
3. Identify and handle images on each page
4. Generate/append to the final translated book as `final_book.md`

## Image Handling

- The agent automatically detects if images exist in `extracted_images/page-XXX/` directories
- If images are found, it uses them; otherwise, it attempts to extract them from the PDF
- For best results, manually extract images and place them in the appropriate directories:

```
extracted_images/
├── page-001/
│   └── page-001-img-01.png
├── page-015/
│   ├── page-015-img-01.png
│   └── page-015-img-02.png
└── ...
```

## Developer Contributions

We welcome contributions from developers and vibe coders! Here's how you can help:

### Code Improvements

- **Code optimizations**: Make the translation process faster and more efficient
- **Bug fixes**: Enhance error handling and fix edge cases
- **New features**: Add functionality for better translation accuracy
- **Better image extraction**: Improve algorithms for detecting and extracting images from PDFs

### Technical Enhancements

- **PDF export improvements**: Enhance the markdown-to-PDF conversion in `utils/pdf.ts`
- **UI/UX improvements**: Make the tool more user-friendly
- **Documentation**: Keep this guide and code comments up to date
- **Testing**: Add unit tests and integration tests
- **Performance monitoring**: Add logging and metrics

### Architecture & Scaling

- **Async processing**: Implement better parallel processing for multiple pages
- **Rate limiting**: Smart handling of OpenAI API rate limits
- **Caching**: Cache translation results to avoid re-processing
- **Configuration**: Make more aspects configurable via environment variables

## Troubleshooting

### Common Issues

1. **API Key errors**: Make sure your OpenAI API key is valid and has sufficient credits
2. **Memory issues**: Use batch processing for large books
3. **Image extraction failures**: Manually extract images for better results
4. **Translation inconsistencies**: Review context-dependent terms manually

### Debug Mode

Add debug logging by setting the environment variable:

```bash
DEBUG=true
```

## Tech Stack

- **TypeScript**: Main language for type safety
- **Node.js**: Runtime environment
- **OpenAI API**: GPT models for translation
- **PDF processing**: Custom utilities for PDF manipulation
- **Markdown generation**: Dynamic markdown file creation

---

Ready to contribute? Fork the repo, make your changes, and submit a pull request! Let's make SPX6900 knowledge accessible worldwide! 🌍
