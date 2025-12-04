import { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import markdown files as raw text
import userManualRaw from '../../../docs/USER_MANUAL.md?raw';
import howToRaw from '../../../docs/HOWTO.md?raw';

/**
 * Generate a URL-friendly ID from header text
 * Removes markdown formatting before generating ID
 */
function generateHeaderId(text: string): string {
  // Remove markdown formatting before generating ID
  let cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text
  
  return cleanText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Simple markdown renderer that converts markdown to HTML-like structure
 * This is a basic implementation - for production, consider using a proper markdown library
 */
function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let listItems: string[] = [];

  function processInlineMarkdown(text: string): string {
    // Process bold first, then italic (to avoid conflicts)
    let result = text
      // Bold (must be processed before italic)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Inline code (before other processing to avoid conflicts)
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links - handle anchor links specially
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, linkUrl) => {
        // If it's an anchor link (starts with #), add scroll behavior
        if (linkUrl.startsWith('#')) {
          return `<a href="${linkUrl}" class="text-primary hover:underline scroll-link" data-anchor="${linkUrl.substring(1)}">${linkText}</a>`;
        }
        return `<a href="${linkUrl}" class="text-primary hover:underline">${linkText}</a>`;
      });
    
    // Italic (after bold, only match single asterisks not part of bold)
    result = result.replace(/(?<!\*)\*([^*<]+?)\*(?!\*)/g, '<em>$1</em>');
    
    return result;
  }

  function flushList() {
    if (listItems.length > 0) {
      html.push(`<ul class="list-disc space-y-2 mb-4 ml-6">${listItems.join('')}</ul>`);
      listItems = [];
    }
  }

  function flushCodeBlock() {
    if (codeBlockContent.length > 0) {
      const code = codeBlockContent.join('\n');
      html.push(`<pre class="bg-muted p-4 rounded-md overflow-x-auto my-4 text-sm"><code>${escapeHtml(code)}</code></pre>`);
      codeBlockContent = [];
      inCodeBlock = false;
    }
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers - add IDs for anchor navigation
    if (trimmed.startsWith('### ')) {
      flushList();
      const headerText = trimmed.substring(4);
      const headerHtml = processInlineMarkdown(headerText);
      const headerId = generateHeaderId(headerText);
      html.push(`<h3 id="${headerId}" class="text-lg font-semibold mt-6 mb-3 scroll-mt-4">${headerHtml}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      const headerText = trimmed.substring(3);
      const headerHtml = processInlineMarkdown(headerText);
      const headerId = generateHeaderId(headerText);
      html.push(`<h2 id="${headerId}" class="text-xl font-bold mt-8 mb-4 scroll-mt-4">${headerHtml}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      const headerText = trimmed.substring(2);
      const headerHtml = processInlineMarkdown(headerText);
      const headerId = generateHeaderId(headerText);
      html.push(`<h1 id="${headerId}" class="text-2xl font-bold mt-8 mb-4 scroll-mt-4">${headerHtml}</h1>`);
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed.startsWith('---')) {
      flushList();
      html.push('<hr class="my-6 border-border" />');
      continue;
    }

    // Lists
    if (trimmed.match(/^[-*]\s/)) {
      flushCodeBlock();
      const content = trimmed.substring(2);
      listItems.push(`<li class="mb-1">${processInlineMarkdown(content)}</li>`);
      continue;
    }
    if (trimmed.match(/^\d+\.\s/)) {
      flushCodeBlock();
      const content = trimmed.replace(/^\d+\.\s/, '');
      listItems.push(`<li class="mb-1">${processInlineMarkdown(content)}</li>`);
      continue;
    }

    // Empty line
    if (trimmed === '') {
      flushList();
      flushCodeBlock();
      continue;
    }

    // Regular paragraph
    flushList();
    flushCodeBlock();
    html.push(`<p class="mb-4 leading-relaxed">${processInlineMarkdown(trimmed)}</p>`);
  }

  // Flush any remaining blocks
  flushList();
  flushCodeBlock();

  return html.join('');
}

export function HelpSection() {
  const [userManualContent, setUserManualContent] = useState<string>('');
  const [howToContent, setHowToContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const manualContentRef = useRef<HTMLDivElement>(null);
  const howToContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setUserManualContent(renderMarkdown(userManualRaw));
      setHowToContent(renderMarkdown(howToRaw));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load help content:', error);
      setLoading(false);
    }
  }, []);

  // Handle anchor link clicks for smooth scrolling
  useEffect(() => {
    if (loading) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a.scroll-link') as HTMLAnchorElement;
      
      if (link) {
        e.preventDefault();
        const anchorId = link.getAttribute('data-anchor');
        if (!anchorId) return;

        // Find which content container we're in
        let contentContainer: HTMLElement | null = null;
        if (manualContentRef.current && manualContentRef.current.contains(link)) {
          contentContainer = manualContentRef.current;
        } else if (howToContentRef.current && howToContentRef.current.contains(link)) {
          contentContainer = howToContentRef.current;
        }

        if (!contentContainer) return;

        // Find the viewport element (Radix ScrollArea wraps content in a viewport)
        const viewport = contentContainer.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (!viewport) return;

        // Find the target element within the content container
        const targetElement = contentContainer.querySelector(`#${anchorId}`) as HTMLElement;
        if (targetElement) {
          // Calculate scroll position relative to viewport
          const containerRect = viewport.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const offset = 20; // Offset from top
          const scrollTop = viewport.scrollTop + (targetRect.top - containerRect.top) - offset;

          viewport.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }
    };

    // Add event listeners using event delegation on document
    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [loading, userManualContent, howToContent]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Help & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Help & Documentation
        </CardTitle>
        <CardDescription>
          Complete user manual and step-by-step guides
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              User Manual
            </TabsTrigger>
            <TabsTrigger value="howto" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              How-To Guide
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="mt-4">
            <ScrollArea className="h-[600px] pr-4">
              <div
                ref={manualContentRef}
                className="text-sm space-y-4"
                dangerouslySetInnerHTML={{ __html: userManualContent }}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="howto" className="mt-4">
            <ScrollArea className="h-[600px] pr-4">
              <div
                ref={howToContentRef}
                className="text-sm space-y-4"
                dangerouslySetInnerHTML={{ __html: howToContent }}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

