import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, chapters, citations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  NumberFormat,
  Footer,
  Header,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
  PageBreak,
  TableLayoutType,
} from "docx";
import { CHAPTER_TITLES } from "@/lib/types";

// Parse table from custom format
function parseTable(content: string): { name: string; headers: string[]; rows: string[][] } | null {
  const match = content.match(/<<<TABLE_START>>>\s*\n([^\n]+)\n([\s\S]*?)<<<TABLE_END>>>/);
  if (!match) return null;
  
  const name = match[1].trim();
  const lines = match[2].trim().split("\n").filter(l => l.trim());
  
  if (lines.length < 1) return null;
  
  const headers = lines[0].split("|").map(c => c.trim());
  const rows = lines.slice(1).map(line => line.split("|").map(c => c.trim()));
  
  return { name, headers, rows };
}

// Create Word table
function createWordTable(name: string, headers: string[], rows: string[][]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  
  // Table caption
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: `Tabel: ${name.replace(/_/g, " ")}`,
          bold: true,
          size: 22,
          font: "Times New Roman",
        }),
      ],
    })
  );

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "000000",
  };

  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  // Calculate column widths
  const colCount = headers.length;
  const colWidth = Math.floor(9000 / colCount); // Distribute across page width

  // Header row
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          borders: cellBorders,
          shading: { fill: "D9D9D9" },
          width: { size: colWidth, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 20,
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        })
    ),
  });

  // Data rows
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: headers.map((_, idx) =>
          new TableCell({
            borders: cellBorders,
            width: { size: colWidth, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: idx === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: row[idx] || "",
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          })
        ),
      })
  );

  elements.push(
    new Table({
      layout: TableLayoutType.FIXED,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    })
  );

  // Space after table
  elements.push(new Paragraph({ spacing: { after: 240 }, children: [] }));

  return elements;
}

// Process inline formatting
function processInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      runs.push(new TextRun({ text: boldMatch[1], bold: true, size: 24, font: "Times New Roman" }));
    } else {
      const italicParts = part.split(/(_[^_]+_)/g);
      for (const ip of italicParts) {
        const italicMatch = ip.match(/^_(.+)_$/);
        if (italicMatch) {
          runs.push(new TextRun({ text: italicMatch[1], italics: true, size: 24, font: "Times New Roman" }));
        } else if (ip) {
          runs.push(new TextRun({ text: ip, size: 24, font: "Times New Roman" }));
        }
      }
    }
  }

  return runs;
}

// Parse chapter content into Word elements
function parseChapterContent(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  
  // First, extract and process tables
  let processedContent = content;
  const tableRegex = /<<<TABLE_START>>>\s*\n([^\n]+)\n([\s\S]*?)<<<TABLE_END>>>/g;
  const tables: { placeholder: string; name: string; headers: string[]; rows: string[][] }[] = [];
  
  let tableMatch;
  let tableIndex = 0;
  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const placeholder = `__TABLE_PLACEHOLDER_${tableIndex}__`;
    const name = tableMatch[1].trim();
    const lines = tableMatch[2].trim().split("\n").filter(l => l.trim());
    const headers = lines[0]?.split("|").map(c => c.trim()) || [];
    const rows = lines.slice(1).map(line => line.split("|").map(c => c.trim()));
    
    tables.push({ placeholder, name, headers, rows });
    processedContent = processedContent.replace(tableMatch[0], placeholder);
    tableIndex++;
  }

  const lines = processedContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for table placeholder
    const tablePlaceholder = tables.find(t => trimmed === t.placeholder);
    if (tablePlaceholder) {
      elements.push(...createWordTable(tablePlaceholder.name, tablePlaceholder.headers, tablePlaceholder.rows));
      continue;
    }

    // Empty line
    if (!trimmed) {
      elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      continue;
    }

    // Main chapter heading (BAB X)
    if (trimmed.match(/^BAB\s+[IVX]+/i) || trimmed.match(/^#\s+BAB/i)) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [
            new TextRun({
              text: trimmed.replace(/^#\s+/, "").toUpperCase(),
              bold: true,
              size: 28,
              font: "Times New Roman",
            }),
          ],
        })
      );
      continue;
    }

    // Sub-headings with numbers (1.1, 1.1.1, etc)
    const subHeadingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)$/);
    if (subHeadingMatch) {
      const depth = subHeadingMatch[1].split(".").length;
      elements.push(
        new Paragraph({
          heading: depth === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: depth === 2 ? 26 : 24,
              font: "Times New Roman",
            }),
          ],
        })
      );
      continue;
    }

    // Markdown headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({ text: trimmed.slice(4), bold: true, size: 24, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({ text: trimmed.slice(3), bold: true, size: 26, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [
            new TextRun({ text: trimmed.slice(2).toUpperCase(), bold: true, size: 28, font: "Times New Roman" }),
          ],
        })
      );
      continue;
    }

    // Numbered list items (1., 2., etc or a), b), etc)
    if (/^\d+\.\s/.test(trimmed) || /^[a-z]\)\s/i.test(trimmed)) {
      elements.push(
        new Paragraph({
          spacing: { after: 80, line: 360 },
          indent: { left: convertInchesToTwip(0.5) },
          children: processInlineFormatting(trimmed),
        })
      );
      continue;
    }

    // Bullet list
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      elements.push(
        new Paragraph({
          spacing: { after: 80, line: 360 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [
            new TextRun({ text: "• ", size: 24, font: "Times New Roman" }),
            ...processInlineFormatting(trimmed.slice(2)),
          ],
        })
      );
      continue;
    }

    // Formula or special text (indented)
    if (trimmed.startsWith("n =") || trimmed.startsWith("Keterangan:")) {
      elements.push(
        new Paragraph({
          spacing: { after: 80, line: 360 },
          indent: { left: convertInchesToTwip(0.5) },
          children: processInlineFormatting(trimmed),
        })
      );
      continue;
    }

    // Regular paragraph with first-line indent
    elements.push(
      new Paragraph({
        spacing: { after: 120, line: 360 },
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: convertInchesToTwip(0.5) },
        children: processInlineFormatting(trimmed),
      })
    );
  }

  return elements;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chaptersData = await db.select().from(chapters).where(eq(chapters.projectId, id)).orderBy(asc(chapters.chapterNumber));
  const citationsData = await db.select().from(citations).where(eq(citations.projectId, id));

  const children: (Paragraph | Table)[] = [];

  // ===== COVER PAGE =====
  children.push(
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: project.title.toUpperCase(), bold: true, size: 32, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 960 },
      children: [
        new TextRun({ text: "SKRIPSI", bold: true, size: 32, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 960 },
      children: [
        new TextRun({ text: "Diajukan untuk Memenuhi Sebagian Persyaratan", size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80 },
      children: [
        new TextRun({ text: "Memperoleh Gelar Sarjana", size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440 },
      children: [
        new TextRun({ text: `Program Studi ${project.department}`, size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440 },
      children: [
        new TextRun({ text: "Oleh:", size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160 },
      children: [
        new TextRun({ text: "[NAMA MAHASISWA]", bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80 },
      children: [
        new TextRun({ text: "[NIM]", size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440 },
      children: [
        new TextRun({ text: "[NAMA UNIVERSITAS]", bold: true, size: 28, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160 },
      children: [
        new TextRun({ text: "[NAMA FAKULTAS]", bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160 },
      children: [
        new TextRun({ text: new Date().getFullYear().toString(), size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===== CHAPTERS =====
  for (const ch of chaptersData) {
    // Chapter title
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({ text: `BAB ${["I", "II", "III", "IV", "V"][ch.chapterNumber - 1]}`, bold: true, size: 28, font: "Times New Roman" }),
        ],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [
          new TextRun({ text: CHAPTER_TITLES[ch.chapterNumber].toUpperCase(), bold: true, size: 28, font: "Times New Roman" }),
        ],
      })
    );

    // Chapter content
    if (ch.content) {
      const contentElements = parseChapterContent(ch.content);
      children.push(...contentElements);
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({ text: "(Bab ini belum di-generate)", italics: true, size: 24, font: "Times New Roman", color: "666666" }),
          ],
        })
      );
    }

    // Page break
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ===== DAFTAR PUSTAKA =====
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [
        new TextRun({ text: "DAFTAR PUSTAKA", bold: true, size: 28, font: "Times New Roman" }),
      ],
    })
  );

  // Deduplicate and sort
  const seen = new Set<string>();
  const uniqueCitations = citationsData.filter((cit) => {
    const key = cit.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.authors.localeCompare(b.authors));

  for (const cit of uniqueCitations) {
    const parts: string[] = [];
    parts.push(`${cit.authors} (${cit.year ?? "n.d."}).`);
    parts.push(`${cit.title}.`);
    if (cit.publisher) parts.push(`${cit.publisher}.`);
    if (cit.doi) parts.push(`https://doi.org/${cit.doi}`);
    else if (cit.url) parts.push(cit.url);

    children.push(
      new Paragraph({
        spacing: { after: 160, line: 360 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
        children: [
          new TextRun({ text: parts.join(" "), size: 24, font: "Times New Roman" }),
        ],
      })
    );
  }

  // Build document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.5),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.5),
            },
            pageNumbers: { formatType: NumberFormat.DECIMAL },
          },
        },
        headers: { default: new Header({ children: [] }) },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 22 }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);
  const safeTitle = project.title.slice(0, 40).replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Skripsi_${safeTitle}.docx"`,
    },
  });
}
