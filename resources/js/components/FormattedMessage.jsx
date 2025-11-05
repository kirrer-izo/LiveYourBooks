import React from "react";

// Reusable component to format markdown-like text into readable format
export const FormattedMessage = ({ content }) => {
  if (!content) return null;
  
  // Split content into lines
  const lines = content.split('\n');
  const formatted = [];
  let currentParagraph = [];
  let inList = false;
  let listItems = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      // Join paragraph parts, handling both strings and React elements
      const paragraphContent = currentParagraph.map((part, idx) => {
        if (typeof part === 'string') {
          return <span key={`text-${idx}`}>{part}</span>;
        }
        return part;
      });
      
      formatted.push(
        <p key={`p-${formatted.length}`} className="mb-3 leading-relaxed">
          {paragraphContent}
        </p>
      );
      currentParagraph = [];
    }
  };
  
  // Helper to process markdown in text
  const processMarkdown = (text) => {
    if (!text) return [text];
    
    const parts = [];
    let remaining = text;
    
    // Process bold text **text** first (must be done before italic to avoid conflicts)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(remaining)) !== null) {
      // Add text before the bold match
      if (match.index > lastIndex) {
        const beforeText = remaining.substring(lastIndex, match.index);
        // Process italic in the text before bold
        const italicProcessed = processItalic(beforeText);
        parts.push(...italicProcessed);
      }
      // Add the bold text (without asterisks)
      parts.push(<strong key={`bold-${parts.length}`} className="font-semibold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    // Process remaining text after last bold match
    if (lastIndex < remaining.length) {
      const afterText = remaining.substring(lastIndex);
      const italicProcessed = processItalic(afterText);
      parts.push(...italicProcessed);
    }
    
    // If no bold was found, process entire text for italic
    if (parts.length === 0) {
      return processItalic(text);
    }
    
    return parts.length > 0 ? parts : [text];
  };
  
  // Helper to process italic text (only processes single asterisks, not double)
  const processItalic = (text) => {
    if (!text) return [text];
    
    const parts = [];
    let remaining = text;
    let lastIndex = 0;
    
    // Simple approach: find single asterisks that aren't part of **
    // We'll check manually to avoid regex lookbehind issues
    while (remaining.length > 0) {
      const asteriskIndex = remaining.indexOf('*', lastIndex);
      if (asteriskIndex === -1) {
        // No more asterisks, add remaining text
        if (lastIndex < remaining.length) {
          parts.push(remaining.substring(lastIndex));
        }
        break;
      }
      
      // Check if this is part of ** (bold)
      if (asteriskIndex < remaining.length - 1 && remaining[asteriskIndex + 1] === '*') {
        // Skip double asterisks (they're handled by bold processing)
        lastIndex = asteriskIndex + 2;
        continue;
      }
      
      // Check if previous character was also * (would be part of **)
      if (asteriskIndex > 0 && remaining[asteriskIndex - 1] === '*') {
        // Skip this asterisk (it's closing a bold)
        lastIndex = asteriskIndex + 1;
        continue;
      }
      
      // This is a single asterisk, try to find the closing one
      const closingIndex = remaining.indexOf('*', asteriskIndex + 1);
      if (closingIndex === -1) {
        // No closing asterisk, add remaining text and break
        if (lastIndex < remaining.length) {
          parts.push(remaining.substring(lastIndex));
        }
        break;
      }
      
      // Check if closing asterisk is part of **
      if (closingIndex < remaining.length - 1 && remaining[closingIndex + 1] === '*') {
        // Skip this closing asterisk (it's opening a bold)
        lastIndex = closingIndex + 1;
        continue;
      }
      
      // Valid italic match
      if (asteriskIndex > lastIndex) {
        parts.push(remaining.substring(lastIndex, asteriskIndex));
      }
      parts.push(<em key={`italic-${parts.length}`} className="italic">{remaining.substring(asteriskIndex + 1, closingIndex)}</em>);
      lastIndex = closingIndex + 1;
    }
    
    return parts.length > 0 ? parts : [text];
  };
  
  const flushList = () => {
    if (listItems.length > 0) {
      formatted.push(
        <ul key={`ul-${formatted.length}`} className="mb-3 ml-4 list-disc space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="ml-2">
              {Array.isArray(item) ? item : item}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Handle headers
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      formatted.push(
        <h3 key={`h3-${idx}`} className="font-semibold text-lg mb-2 mt-4 first:mt-0">
          {trimmed.substring(4)}
        </h3>
      );
      return;
    }
    
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      formatted.push(
        <h2 key={`h2-${idx}`} className="font-bold text-xl mb-3 mt-4 first:mt-0">
          {trimmed.substring(3)}
        </h2>
      );
      return;
    }
    
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      formatted.push(
        <h1 key={`h1-${idx}`} className="font-bold text-2xl mb-3 mt-4 first:mt-0">
          {trimmed.substring(2)}
        </h1>
      );
      return;
    }
    
    // Handle list items
    if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      const listContent = trimmed.replace(/^(\d+\.|[-*])\s/, '');
      if (listContent) {
        // Process markdown in list items
        const processedContent = processMarkdown(listContent);
        listItems.push(processedContent);
        inList = true;
      }
      return;
    }
    
    // Handle bold text
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      flushList();
      currentParagraph.push(
        <strong key={`bold-${idx}`} className="font-semibold">
          {trimmed.substring(2, trimmed.length - 2)}
        </strong>
      );
      return;
    }
    
    // Handle empty lines
    if (trimmed === '') {
      flushParagraph();
      flushList();
      return;
    }
    
    // Regular paragraph text
    flushList();
    // Process markdown formatting
    const processed = processMarkdown(trimmed);
    currentParagraph.push(...processed);
  });
  
  flushParagraph();
  flushList();
  
  // If no formatting was applied, return simple pre-wrap
  if (formatted.length === 0) {
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
  }
  
  return <div>{formatted}</div>;
};

export default FormattedMessage;

