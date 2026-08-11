export type FormattedInlineToken = {
  type: 'text' | 'strong' | 'emphasis' | 'strong-emphasis'
  content: string
}

export type FormattedParagraphBlock = {
  type: 'paragraph'
  content: FormattedInlineToken[]
}

export type FormattedListItem = {
  content: FormattedInlineToken[]
  childLists: FormattedListBlock[]
}

export type FormattedListBlock = {
  type: 'unordered-list' | 'ordered-list'
  items: FormattedListItem[]
}

export type FormattedTextBlock = FormattedParagraphBlock | FormattedListBlock

type InlineTokenType = Exclude<FormattedInlineToken['type'], 'text'>

type InlineDelimiter = {
  marker: string
  type: InlineTokenType
}

type ListMarker = {
  type: FormattedListBlock['type']
  indentLevel: number
  content: string
}

type ListFrame = {
  indentLevel: number
  container: Array<FormattedTextBlock> | FormattedListBlock[]
  block: FormattedListBlock
}

export type FormattedTextOptions = {
  restrictedMarkdown?: boolean
}

const inlineDelimiters: InlineDelimiter[] = [
  { marker: '***', type: 'strong-emphasis' },
  { marker: '___', type: 'strong-emphasis' },
  { marker: '**', type: 'strong' },
  { marker: '__', type: 'strong' },
  { marker: '*', type: 'emphasis' },
  { marker: '_', type: 'emphasis' },
]

const unorderedListPattern = /^([ \t]*)[-*•]\s+(.*)$/
const orderedListPattern = /^([ \t]*)\d+[.)]\s+(.*)$/

function indentationLevel(whitespace: string) {
  const width = Array.from(whitespace).reduce(
    (total, character) => total + (character === '\t' ? 2 : 1),
    0,
  )
  return Math.floor(width / 2)
}

function parseListMarker(line: string, allowNestedLists: boolean): ListMarker | null {
  const unorderedMatch = line.match(unorderedListPattern)
  if (unorderedMatch) {
    return {
      type: 'unordered-list',
      indentLevel: allowNestedLists ? indentationLevel(unorderedMatch[1] || '') : 0,
      content: (unorderedMatch[2] || '').trim(),
    }
  }

  const orderedMatch = line.match(orderedListPattern)
  if (orderedMatch) {
    return {
      type: 'ordered-list',
      indentLevel: allowNestedLists ? indentationLevel(orderedMatch[1] || '') : 0,
      content: (orderedMatch[2] || '').trim(),
    }
  }

  return null
}

function delimiterCanOpen(text: string, index: number, delimiter: InlineDelimiter) {
  const contentStart = index + delimiter.marker.length
  const nextCharacter = text[contentStart]
  if (!nextCharacter || /\s/.test(nextCharacter)) return false

  if (delimiter.marker.includes('_')) {
    const previousCharacter = text[index - 1]
    if (previousCharacter && /[\p{L}\p{N}]/u.test(previousCharacter)) return false
  }

  return true
}

function delimiterCanClose(text: string, index: number, delimiter: InlineDelimiter) {
  const previousCharacter = text[index - 1]
  if (!previousCharacter || /\s/.test(previousCharacter)) return false

  if (delimiter.marker.includes('_')) {
    const nextCharacter = text[index + delimiter.marker.length]
    if (nextCharacter && /[\p{L}\p{N}]/u.test(nextCharacter)) return false
  }

  return true
}

function findClosingDelimiter(text: string, openIndex: number, delimiter: InlineDelimiter) {
  let closeIndex = text.indexOf(delimiter.marker, openIndex + delimiter.marker.length)

  while (closeIndex >= 0) {
    if (
      closeIndex > openIndex + delimiter.marker.length &&
      delimiterCanClose(text, closeIndex, delimiter)
    ) {
      return closeIndex
    }
    closeIndex = text.indexOf(delimiter.marker, closeIndex + delimiter.marker.length)
  }

  return -1
}

function findNextInlineToken(text: string, cursor: number) {
  let match: { delimiter: InlineDelimiter; openIndex: number; closeIndex: number } | null = null

  for (const delimiter of inlineDelimiters) {
    let openIndex = text.indexOf(delimiter.marker, cursor)

    while (openIndex >= 0 && !delimiterCanOpen(text, openIndex, delimiter)) {
      openIndex = text.indexOf(delimiter.marker, openIndex + delimiter.marker.length)
    }
    if (openIndex < 0) continue

    const closeIndex = findClosingDelimiter(text, openIndex, delimiter)
    if (closeIndex < 0) continue

    if (
      !match ||
      openIndex < match.openIndex ||
      (openIndex === match.openIndex && delimiter.marker.length > match.delimiter.marker.length)
    ) {
      match = { delimiter, openIndex, closeIndex }
    }
  }

  return match
}

export function parseFormattedInlineText(
  text: string,
  restrictedMarkdown = false,
): FormattedInlineToken[] {
  if (!text || !restrictedMarkdown) {
    return text ? [{ type: 'text', content: text }] : []
  }

  const tokens: FormattedInlineToken[] = []
  let cursor = 0

  while (cursor < text.length) {
    const match = findNextInlineToken(text, cursor)
    if (!match) {
      tokens.push({ type: 'text', content: text.slice(cursor) })
      break
    }

    if (match.openIndex > cursor) {
      tokens.push({ type: 'text', content: text.slice(cursor, match.openIndex) })
    }

    const contentStart = match.openIndex + match.delimiter.marker.length
    tokens.push({
      type: match.delimiter.type,
      content: text.slice(contentStart, match.closeIndex),
    })
    cursor = match.closeIndex + match.delimiter.marker.length
  }

  return tokens
}

function appendListItem(
  result: FormattedTextBlock[],
  stack: ListFrame[],
  marker: ListMarker,
  restrictedMarkdown: boolean,
) {
  while (stack.length > 0 && marker.indentLevel < stack[stack.length - 1]!.indentLevel) {
    stack.pop()
  }

  let frame = stack[stack.length - 1]

  if (!frame) {
    const block: FormattedListBlock = { type: marker.type, items: [] }
    result.push(block)
    frame = { indentLevel: marker.indentLevel, container: result, block }
    stack.push(frame)
  } else if (marker.indentLevel > frame.indentLevel) {
    const parentItem = frame.block.items[frame.block.items.length - 1]
    if (!parentItem) return

    const block: FormattedListBlock = { type: marker.type, items: [] }
    parentItem.childLists.push(block)
    frame = {
      indentLevel: marker.indentLevel,
      container: parentItem.childLists,
      block,
    }
    stack.push(frame)
  } else if (frame.block.type !== marker.type) {
    const block: FormattedListBlock = { type: marker.type, items: [] }
    frame.container.push(block)
    frame = { ...frame, block }
    stack[stack.length - 1] = frame
  }

  frame.block.items.push({
    content: parseFormattedInlineText(marker.content, restrictedMarkdown),
    childLists: [],
  })
}

function appendListContinuation(
  stack: ListFrame[],
  content: string,
  restrictedMarkdown: boolean,
) {
  const frame = stack[stack.length - 1]
  const item = frame?.block.items[frame.block.items.length - 1]
  if (!item) return false

  item.content.push(
    { type: 'text', content: '\n' },
    ...parseFormattedInlineText(content, restrictedMarkdown),
  )
  return true
}

export function parseFormattedText(
  text: string,
  options: FormattedTextOptions = {},
): FormattedTextBlock[] {
  const normalized = text.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return []

  const restrictedMarkdown = options.restrictedMarkdown === true
  const result: FormattedTextBlock[] = []
  const listStack: ListFrame[] = []
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    result.push({
      type: 'paragraph',
      content: parseFormattedInlineText(paragraphLines.join('\n').trim(), restrictedMarkdown),
    })
    paragraphLines = []
  }

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      listStack.length = 0
      continue
    }

    const marker = parseListMarker(line, restrictedMarkdown)
    if (marker) {
      flushParagraph()
      appendListItem(result, listStack, marker, restrictedMarkdown)
      continue
    }

    if (listStack.length > 0 && /^[ \t]+/.test(rawLine)) {
      appendListContinuation(listStack, trimmed, restrictedMarkdown)
      continue
    }

    listStack.length = 0
    paragraphLines.push(trimmed)
  }

  flushParagraph()
  return result
}
