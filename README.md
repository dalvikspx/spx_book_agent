# SPX6900 Book Translation AI Agent

This AI agent can translate the book **"Discovering SPX6900: The World's First Pure Belief Asset E-book"** from English into all languages of the world.

## Original Book

The original book this translation is based on can be found here:
[SPX6900: Believing in the Future of Tokenized Cryptocurrency Investing](https://www.amazon.com/SPX6900-Believing-Tokenized-Cryptocurrency-Investing/dp/B0FC4BGVKJ/ref=sr_1_1?crid=2YCS1OXUQBI4E&dib=eyJ2IjoiMSJ9.n6Yx7X9Yn1orvqzELSXuHODtAM-ahn-b_I1TIicOhNf3azDo_qbxUFGfvlYhqYaG._EaNwqxmSImYc7DfX6Gv2a08iuYhgKX1TbsVfIpeq1o&dib_tag=se&keywords=spx6900+book&qid=1757841026&sprefix=spx6900+b%2Caps%2C184&sr=8-1)

## Translation Capabilities

This AI agent can translate the entire book into any language worldwide, maintaining the original structure and meaning while adapting the content for different linguistic contexts.

**Existing translations can be found in the [`translations/`](./translations/) directory.**

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

The AI agent attempts to identify and extract images from each page image (PNG files in the `book_pages/` directory), but since OpenAI models aren't specialized for precise image detection, accuracy can be limited.

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

## For Developers & Technical Contributors

All technical setup, installation instructions, build commands, and developer contribution guidelines have been moved to a dedicated guide:

**[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete technical reference

This guide covers:

- Installation & setup instructions
- Environment configuration
- Running the translation agent
- Build and deployment commands
- Image handling and optimization
- Troubleshooting common issues
- How to contribute code improvements

## Contributing

We welcome contributions from everyone! Whether you're a developer, native speaker, designer, or just someone passionate about making SPX6900 knowledge accessible worldwide.

### For Native Speakers & Language Contributors

Your expertise is invaluable for creating high-quality translations:

- **Review translation quality** - Help identify context-dependent translation errors
- **Suggest cultural adaptations** - Ensure content resonates with local audiences
- **Provide linguistic feedback** - Help improve translations that might be too literal
- **Verify existing translations** - We especially need verification for non-Italian translations

### For Designers & Content Contributors

Help make the translated books visually appealing:

- **Add correct images** from the original PDF to improve visual quality
- **Create professional PDF layouts** using tools like Canva or similar
- **Improve markdown formatting** for better readability
- **Design visual elements** for the final output

### For Technical Contributors

To contribute code improvements, see the **[Developer Guide](./DEVELOPER_GUIDE.md)** for:

- Technical contribution guidelines
- Code improvement opportunities
- Architecture enhancement ideas
- Bug fixes and feature requests

### Non-Technical Contributor Guide

**Detailed Instructions**: See [CONTRIBUTING_TRANSLATION.md](./CONTRIBUTING_TRANSLATION.md) for step-by-step instructions on how to improve translations, add images, and create professional PDF layouts using free tools.

---

To get involved, open issues, submit pull requests, or reach out with suggestions. All contributions help make SPX6900 knowledge more accessible.

---

_This project aims to make SPX6900 knowledge accessible worldwide through high-quality translations._
