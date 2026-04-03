import mammoth from "mammoth";

export interface ParsedSong {
  title: string;
  artist?: string;
  lyrics: string;
  structure: string[];
}

export class SongParser {
  /**
   * Parse song content from text files
   */
  static parseTextFile(content: string): ParsedSong {
    return this.parseTextContent(content);
  }
  /**
   * Parse song content from PDF files
   */
  static async parsePDFFile(buffer: Buffer): Promise<ParsedSong> {
    try {
      // Use legacy build for Node.js compatibility
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      return this.parseTextContent(fullText);
    } catch (error: any) {
      console.error("PDF Parsing error:", error);
      throw new Error(
        `Failed to parse PDF: ${error?.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Parse song content from DOCX files
   */
  static async parseDOCXFile(buffer: Buffer): Promise<ParsedSong> {
    try {
      // Use HTML extraction to preserve paragraph breaks
      const result = await mammoth.convertToHtml({ buffer });

      // Convert HTML to text while preserving line breaks
      const textContent = result.value
        .replace(/<\/p>/g, "\n") // Convert paragraph endings to line breaks
        .replace(/<br\s*\/?>/g, "\n") // Convert br tags to line breaks
        .replace(/<[^>]+>/g, "") // Remove all remaining HTML tags
        .replace(/&nbsp;/g, " ") // Convert non-breaking spaces
        .replace(/&amp;/g, "&") // Convert HTML entities
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .split("\n") // Split into lines
        .map((line) => line.trim()) // Trim each line
        .join("\n"); // Rejoin with clean line breaks

      return this.parseTextContent(textContent);
    } catch (error: any) {
      throw new Error(
        `Failed to parse DOCX: ${error?.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Intelligent text parsing to extract verses, choruses, and structure
   */
  private static parseTextContent(content: string): ParsedSong {
    // Clean and normalize the content
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error("No content found in file");
    }

    // Extract title (usually the first line or a line that stands out)
    let title = this.extractTitle(lines);
    let artist = this.extractArtist(lines);

    // Parse song sections
    const sections = this.parseSections(lines);

    // Generate structure array
    const structure = this.generateStructure(sections);

    // Combine all lyrics
    const lyrics = this.formatLyrics(sections);

    return {
      title: title || "Untitled Song",
      artist,
      lyrics,
      structure,
    };
  }

  /**
   * Extract song title from content
   */
  private static extractTitle(lines: string[]): string {
    // Look for common title patterns
    for (const line of lines.slice(0, 5)) {
      // Skip obvious section headers
      if (this.isSectionHeader(line)) continue;

      // Title is usually the first substantial line
      if (line.length > 3 && line.length < 100) {
        // Remove common title prefixes
        return line
          .replace(/^(title:|song:|name:)\s*/i, "")
          .replace(/^["\-\*\#\[\]]+\s*/, "")
          .replace(/\s*["\-\*\#\[\]]+$/, "")
          .trim();
      }
    }

    return lines[0] || "Untitled Song";
  }

  /**
   * Extract artist from content
   */
  private static extractArtist(lines: string[]): string | undefined {
    for (const line of lines.slice(0, 10)) {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes("by ") ||
        lowerLine.includes("artist:") ||
        lowerLine.includes("author:")
      ) {
        return line
          .replace(/^(by|artist:|author:)\s*/i, "")
          .replace(/["\-\*\#\[\]]/g, "")
          .trim();
      }
    }
    return undefined;
  }

  /**
   * Parse content into sections (verses, choruses, bridges)
   */
  private static parseSections(
    lines: string[],
  ): Array<{ type: string; title: string; content: string }> {
    const sections: Array<{ type: string; title: string; content: string }> =
      [];
    let currentSection: {
      type: string;
      title: string;
      content: string;
    } | null = null;
    let verseCount = 1;
    let chorusCount = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip title/artist lines at the beginning
      if (i < 3 && (this.isTitle(line) || this.isArtist(line))) {
        continue;
      }

      // Check if this line is a section header
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection && currentSection.content.trim()) {
          sections.push(currentSection);
        }

        // Start new section
        const sectionInfo = this.parseSectionHeader(
          line,
          verseCount,
          chorusCount,
        );
        currentSection = {
          type: sectionInfo.type,
          title: sectionInfo.title,
          content: "",
        };

        if (sectionInfo.type === "verse") verseCount++;
        if (sectionInfo.type === "chorus") chorusCount++;
      } else if (currentSection) {
        // Add line to current section
        if (currentSection.content) {
          currentSection.content += "\n" + line;
        } else {
          currentSection.content = line;
        }
      } else {
        // No section header found and no active section, treat as verse
        currentSection = {
          type: "verse",
          title: `Verse ${verseCount}`,
          content: line,
        };
        verseCount++;
      }
    }

    // Add the last section
    if (currentSection && currentSection.content.trim()) {
      sections.push(currentSection);
    }

    // If no sections were detected, split into verses automatically
    if (sections.length === 0) {
      return this.autoSplitIntoSections(lines);
    }

    return sections;
  }

  /**
   * Check if a line is a section header
   */
  private static isSectionHeader(line: string): boolean {
    const lowerLine = line.toLowerCase().trim();
    const patterns = [
      /^(verse|chorus|bridge|refrain|pre-?chorus|tag|intro|outro)\s*\d*:?$/,
      /^\d+\.\s*(verse|chorus|bridge)/,
      /^\[(verse|chorus|bridge|refrain|pre-?chorus|tag|intro|outro)\s*\d*\]/,
      /^(v\d+|c\d*|b\d*):?$/,
      /^[A-Z][A-Z\s]+:$/,
    ];

    return (
      patterns.some((pattern) => pattern.test(lowerLine)) ||
      (line.length < 50 && line.endsWith(":") && !line.includes(","))
    );
  }

  /**
   * Parse section header to determine type and title
   */
  private static parseSectionHeader(
    line: string,
    verseCount: number,
    chorusCount: number,
  ): { type: string; title: string } {
    const lowerLine = line.toLowerCase().trim();

    // Verse patterns
    if (lowerLine.includes("verse") || lowerLine.match(/^v\d+/)) {
      const match = lowerLine.match(/\d+/);
      const num = match ? parseInt(match[0]) : verseCount;
      return { type: "verse", title: `V${num}` };
    }

    // Chorus patterns
    if (
      lowerLine.includes("chorus") ||
      lowerLine.includes("refrain") ||
      lowerLine.match(/^c\d*/)
    ) {
      const match = lowerLine.match(/\d+/);
      const num = match
        ? parseInt(match[0])
        : chorusCount === 1
          ? ""
          : chorusCount;
      return { type: "chorus", title: `C${num}` };
    }

    // Bridge patterns
    if (lowerLine.includes("bridge") || lowerLine.match(/^b\d*/)) {
      return { type: "bridge", title: "Bridge" };
    }

    // Pre-chorus patterns
    if (lowerLine.includes("pre") && lowerLine.includes("chorus")) {
      return { type: "pre_chorus", title: "Pre-Chorus" };
    }

    // Default to verse
    return { type: "verse", title: `V${verseCount}` };
  }

  /**
   * Auto-split content into sections when no headers are found
   */
  private static autoSplitIntoSections(
    lines: string[],
  ): Array<{ type: string; title: string; content: string }> {
    const sections: Array<{ type: string; title: string; content: string }> =
      [];
    const chunks: string[][] = [];
    let currentChunk: string[] = [];

    // Split by empty lines or significant content changes
    for (const line of lines) {
      if (line.trim() === "") {
        if (currentChunk.length > 0) {
          chunks.push([...currentChunk]);
          currentChunk = [];
        }
      } else {
        currentChunk.push(line);
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // Convert chunks to sections
    let verseCount = 1;
    let chorusCount = 1;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const content = chunk.join("\n");

      // Determine if this might be a chorus (repeated content)
      const isChorus = chunks.some(
        (otherChunk, j) =>
          j !== i &&
          otherChunk.join("\n").toLowerCase() === content.toLowerCase(),
      );

      if (isChorus && chorusCount === 1) {
        sections.push({
          type: "chorus",
          title: "C1",
          content,
        });
        chorusCount++;
      } else {
        sections.push({
          type: "verse",
          title: `V${verseCount}`,
          content,
        });
        verseCount++;
      }
    }

    return sections;
  }

  /**
   * Generate structure array from sections
   */
  private static generateStructure(
    sections: Array<{ type: string; title: string; content: string }>,
  ): string[] {
    return sections.map((section) => section.title);
  }

  /**
   * Format lyrics from sections
   */
  private static formatLyrics(
    sections: Array<{ type: string; title: string; content: string }>,
  ): string {
    return sections
      .map((section) => `[${section.title}]\n${section.content}`)
      .join("\n\n");
  }

  /**
   * Check if line might be a title
   */
  private static isTitle(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return (
      lowerLine.includes("title:") ||
      lowerLine.includes("song:") ||
      (line.length < 100 && !this.isSectionHeader(line))
    );
  }

  /**
   * Check if line might be an artist
   */
  private static isArtist(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return (
      lowerLine.includes("by ") ||
      lowerLine.includes("artist:") ||
      lowerLine.includes("author:")
    );
  }
}
