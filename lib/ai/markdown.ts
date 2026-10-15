export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string };

const FENCE_RE = /^```\s*([\w+#.-]*)\s*$/;
const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const UNORDERED_RE = /^[-*]\s+(.+)$/;
const ORDERED_RE = /^\d+[.)]\s+(.+)$/;

function pushParagraph(blocks: MarkdownBlock[], lines: string[]) {
  if (lines.length > 0) blocks.push({ type: "paragraph", lines: [...lines] });
}

function pushList(blocks: MarkdownBlock[], ordered: boolean, items: string[]) {
  if (items.length > 0) blocks.push({ type: "list", ordered, items: [...items] });
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listOrdered = false;

  const flush = () => {
    pushParagraph(blocks, paragraph);
    paragraph = [];
    pushList(blocks, listOrdered, list);
    list = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fence = line.match(FENCE_RE);

    if (fence) {
      flush();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? "")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push({ type: "code", language: fence[1] || "text", code: codeLines.join("\n") });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      flush();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }

    const unordered = line.match(UNORDERED_RE);
    const ordered = line.match(ORDERED_RE);
    if (unordered || ordered) {
      const nextOrdered = Boolean(ordered);
      if (list.length > 0 && listOrdered !== nextOrdered) flush();
      listOrdered = nextOrdered;
      list.push((unordered?.[1] ?? ordered?.[1] ?? "").trim());
      continue;
    }

    if (list.length > 0) flush();
    paragraph.push(line);
  }

  flush();
  return blocks;
}
