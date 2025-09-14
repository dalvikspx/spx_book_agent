# SPX6900 Book Translation AI Agent

This AI agent can translate the book **"Discovering SPX6900: The World's First Pure Belief Asset E-book"** from English into all languages of the world.

## Original Book

The original book this translation is based on can be found here:
[SPX6900: Believing in the Future of Tokenized Cryptocurrency Investing](https://www.amazon.com/SPX6900-Believing-Tokenized-Cryptocurrency-Investing/dp/B0FC4BGVKJ/ref=sr_1_1?crid=2YCS1OXUQBI4E&dib=eyJ2IjoiMSJ9.n6Yx7X9Yn1orvqzELSXuHODtAM-ahn-b_I1TIicOhNf3azDo_qbxUFGfvlYhqYaG._EaNwqxmSImYc7DfX6Gv2a08iuYhgKX1TbsVfIpeq1o&dib_tag=se&keywords=spx6900+book&qid=1757841026&sprefix=spx6900+b%2Caps%2C184&sr=8-1)

## Translation Capabilities

This AI agent can translate the entire book into any language worldwide, maintaining the original structure and meaning while adapting the content for different linguistic contexts.

## Author & Translation Quality

The author of this AI agent is Italian, which means translation quality can only be verified for Italian translations. Currently, the book has been translated into:

- **Italian** (verified by author)
- **Mandarin Chinese** (requires native speaker verification)
- **Hindi** (requires native speaker verification)

**We need native speakers to verify the quality of non-Italian translations.**

## Contact

For questions, feedback, or translation quality reports, please contact on X: [@dalvik_spx](https://x.com/dalvik_spx)

## Support & Tips

This code and its usage is completely **free**. However, if you find this AI agent useful and want to show your support, you can send a tip in SPX6900 (or any other token, which I will convert to SPX6900) to this address on **Ethereum or Base networks**:

```
0xBe9C1c18dEF96cA2fA89c04Ba54100360Ad09D9C
```

_All tips are greatly appreciated and help support further development!_

## Current Limitations

The AI agent has some known limitations that users should be aware of:

### 1. Literal Translations

Some words may be translated too literally, missing contextual meaning. For example:

- "tip" might be translated as "suggestion" instead of "gratuity/tip"
- Similar context-dependent terms may need manual review

### 2. Image Extraction Challenges

The AI agent attempts to identify and extract images from each page of the book, but since OpenAI models aren't specialized for precise image detection, accuracy can be limited.

**Manual Image Solution:**

- The AI agent is smart enough to detect if images already exist for a page in the `extracted_images` directory
- If images are found, it will use the existing images instead of attempting to crop new ones
- For better results, manually extract images by taking screenshots from the original PDF and placing them in the corresponding page directory within `extracted_images/`

### 3. Lost Hyperlinks

During the translation process, **hyperlinks present in the original book are lost** and need to be manually re-added to the generated markdown file. This includes:

- External web links
- Internal cross-references
- Email addresses
- Social media links

### Directory Structure for Images

```
extracted_images/
├── page-001/
│   └── page-001-img-01.png
├── page-002/
│   ├── page-002-img-01.png
│   └── page-002-img-02.png
└── ...
```

## Installation & Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- OpenAI API key

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

### Build and Run

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

### Expected Output

The agent will:

1. Process each page of the PDF book (in batches of ~50 pages)
2. Extract and translate the text content
3. Identify and handle images on each page
4. Generate/append to the final translated book as `final_book.md`

### Image Handling

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

## Contributing

Contributions from developers and native speakers are very welcome!

**For Developers:**

- Code improvements and optimizations
- Bug fixes and error handling enhancements
- New features for better translation accuracy
- Better image extraction algorithms
- PDF export improvements: Enhance the markdown-to-PDF conversion in `utils/pdf.ts`
- UI/UX improvements
- Documentation improvements

**For Native Speakers & Non-Developers:**

- Reviewing translation quality
- Suggesting improvements for context-dependent translations
- Providing feedback on cultural adaptation of content
- Adding correct images from the original PDF
- Creating professional PDF layouts

📖 **Detailed Guide for Non-Developers**: See [CONTRIBUTING_TRANSLATION.md](./CONTRIBUTING_TRANSLATION.md) for step-by-step instructions on how to improve translations, add images, and create professional PDF layouts using free tools like Canva.

Feel free to open issues, submit pull requests, or reach out with suggestions!

---

_This project aims to make SPX6900 knowledge accessible worldwide through high-quality translations._
