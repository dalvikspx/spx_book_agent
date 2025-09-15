# Contributing to SPX6900 Book Translation (Non-Developer Guide)

This guide is specifically for **non-developers** who want to help improve the SPX6900 book translation project without needing programming skills.

## Overview

There are three main ways you can contribute to improve the translated book:

1. **Edit and improve the translated text**
2. **Add correct images to the translation**
3. **Create a professional PDF layout**

---

## 1. Improving the Translation Quality

### What You Need

- Any text editor (Notepad, TextEdit, or preferably a markdown editor like Typora) or directly here on Github
- Native or fluent knowledge of the target language

### Step 1: Download the Generated Translation

After the AI agent runs, it creates a file called `final_book.md`. This contains the entire translated book in markdown format.

### Step 2: Review and Edit the Translation

Open `final_book.md` and look for:

#### Common Translation Issues to Fix:

- **Literal translations**: Words translated too directly without considering context
  - Example: "tip" translated as "suggestion" instead of "gratuity/tip"
  - Example: "bull market" translated literally instead of using financial terminology
- **Cultural references**: Adapt American/English cultural references to your language/culture
- **Technical terms**: Ensure cryptocurrency and financial terms are correctly translated
- **Idioms and expressions**: Replace with equivalent expressions in your language
- **Missing hyperlinks**: The original book's hyperlinks are lost during translation and must be manually re-added
  - Compare with the original PDF to identify links
  - Add them back using markdown format: `[link text](https://url.com)`
  - Include external websites, social media, email addresses, etc.

#### Markdown Format Basics:

- **Headers**: Lines starting with `#` (don't change these structure)
- **Bold text**: Surrounded by `**text**`
- **Italic text**: Surrounded by `*text*`
- **Images**: Lines like `![Image description](path/to/image.png)`
- **Links**: Format like `[link text](https://url.com)`

### Step 3: Save Your Improvements

- Save the file as `final_book_improved.md` or similar
- Keep the original `final_book.md` as backup

---

## 2. Adding Correct Images

### Why This Matters

The AI agent attempts to extract images from the page images (PNG files in `book_pages/`), but often makes mistakes by cutting images not on the right width and height (this is an openAI API limit). Manual image extraction provides much better results.

### What You Need

- The original PDF: `Discovering_SPX6900_The_World's_First_Pure_Belief_Asset_E_book.pdf` (only for manual image extraction)
- Screenshot tool (built into Windows/Mac/Linux)
- Basic image editing software (optional)

**Note**: The PDF is only needed if you want to manually extract better quality images. The translation process itself works with the PNG files in the `book_pages/` directory.

### Step 1: Identify Pages with Images

Go through the translated markdown file and look for:

- Placeholder images (usually showing generic placeholders)
- Missing images (text referring to charts, graphs, or illustrations)
- Poor quality extracted images

### Step 2: Extract Images from the Original PDF

1. **Open the original PDF**
2. **Navigate to the page** containing the image you want to extract
3. **Take a screenshot** of just the image area:
   - **Windows**: Use Snipping Tool or Win + Shift + S
   - **Mac**: Use Cmd + Shift + 4
   - **Linux**: Use screenshot tool of your choice
4. **Save the image** as a PNG file

### Step 3: Name and Place the Image Files

Follow this naming convention:

```
extracted_images/page-XXX/page-XXX-img-YY.png
```

**Examples:**

- `extracted_images/page-015/page-015-img-01.png`
- `extracted_images/page-087/page-087-img-01.png`
- `extracted_images/page-125/page-125-img-02.png` (if page has multiple images)

### Step 4: Create Directory Structure

For each page with images:

1. Create a folder: `extracted_images/page-XXX/`
2. Place the extracted images in that folder
3. Use the naming convention above

### Pro Tips:

- **High quality**: Take screenshots at high resolution for better print quality
- **Crop precisely**: Remove unnecessary whitespace around images
- **Multiple images**: Number them sequentially (01, 02, 03, etc.)

---

## 3. Creating a Professional PDF Layout

### Why Create a PDF?

While the markdown file contains all the content, a professional PDF layout makes the translated book more:

- **Readable**: Proper typography and spacing
- **Shareable**: Easy to distribute and print
- **Professional**: Matches the quality of the original book

### Recommended Tool: Canva (Free)

#### Why Canva?

- **Free to use** with professional templates
- **Easy to learn** - no design experience needed
- **Book templates** specifically designed for publications
- **Image handling** - easy to add and position images
- **Export options** - high-quality PDF export

### Step 1: Set Up Your Canva Project

1. **Create a free Canva account** at canva.com
2. **Choose a template**:
   - Search for "Book" or "E-book" templates
   - Select a template that matches the original book's style
   - Consider page size (A4, US Letter, or custom book size)

### Step 2: Import Your Content

1. **Copy text** from your improved markdown file
2. **Paste into Canva** sections by sections
3. **Maintain structure**: Keep chapters, headings, and paragraphs organized

### Step 3: Add Images

1. **Upload images** from your `extracted_images` folder
2. **Position images** to match the original book layout
3. **Resize and adjust** as needed for good visual flow

### Step 4: Design Considerations

#### Typography:

- **Consistent fonts**: Use 2-3 fonts maximum
- **Readable sizes**: 10-12pt for body text, larger for headings
- **Proper spacing**: Adequate line spacing and margins

#### Layout:

- **Page breaks**: Start new chapters on new pages
- **Image placement**: Position images near related text
- **White space**: Don't overcrowd pages

#### Professional touches:

- **Table of contents**: Create a clickable table of contents
- **Page numbers**: Add consistent page numbering
- **Header/Footer**: Include book title or chapter names

### Step 5: Review and Export

1. **Proofread**: Check text, image placement, and overall flow
2. **Export as PDF**: Use high-quality settings for print
3. **Test**: Open the PDF and verify everything displays correctly

### Alternative Tools (Free):

- **Google Docs**: Good for text-heavy books, basic image support
- **LibreOffice Writer**: Full-featured, supports professional layouts
- **Scribus**: Advanced desktop publishing (steeper learning curve)

---

## Sharing Your Contributions

### For Translation Improvements:

- Share your improved markdown file via GitHub (create an issue/pull request)
- Or send directly to the project author on X: [@dalvik_spx](https://x.com/dalvik_spx)

### For Image Contributions:

- Upload your `extracted_images` folder structure
- Share via file sharing service (Google Drive, Dropbox, etc.)
- Include a note about which pages you've improved

### For PDF Layout:

- Export your final PDF
- Share via file sharing service
- Include information about:
  - Target language
  - Design tools used
  - Any special formatting considerations

---

## Getting Help

### Questions or Issues?

- Contact on X: [@dalvik_spx](https://x.com/dalvik_spx)
- Include:
  - What language you're working with
  - What type of contribution (translation, images, or layout)
  - Specific questions or problems

### Community Support

Native speakers helping with the same language can coordinate:

- Share translation decisions and terminology
- Divide work on different sections
- Cross-review each other's improvements

---

## Impact of Your Contribution

Your work helps make SPX6900 knowledge accessible to speakers of your language worldwide. Quality translations and professional presentation:

- **Increase understanding** of SPX6900 concepts
- **Build community** around the project
- **Professional credibility** for the translated content
- **Cultural adaptation** that resonates with local readers

Thank you for contributing to make SPX6900 knowledge globally accessible!

---

_Remember: This is a community effort. Every improvement, no matter how small, makes the translation better for everyone._
