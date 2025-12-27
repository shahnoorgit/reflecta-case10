/**
 * MarkdownText Component
 * Renders markdown content with proper styling for chat messages
 */

import React, { memo } from 'react';
import { Platform, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface MarkdownTextProps {
  content: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export const MarkdownText = memo<MarkdownTextProps>(({ content, isUser = false, isStreaming = false }) => {
  const textColor = isUser ? '#FFFFFF' : '#ECECF1';
  const codeBgColor = isUser ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const codeTextColor = isUser ? '#FFFFFF' : '#9B8AFF';

  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: 'System',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
    },
    strong: {
      fontWeight: '600' as const,
      color: textColor,
    },
    em: {
      fontStyle: 'italic' as const,
      color: textColor,
    },
    code_inline: {
      backgroundColor: codeBgColor,
      color: codeTextColor,
      fontSize: 13,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        web: 'monospace',
      }),
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(155, 138, 255, 0.2)',
    },
    fence: {
      backgroundColor: codeBgColor,
      borderWidth: 1,
      borderColor: isUser ? 'rgba(255, 255, 255, 0.15)' : 'rgba(155, 138, 255, 0.25)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      overflow: 'hidden' as const,
    },
    code_block: {
      backgroundColor: 'transparent',
      color: codeTextColor,
      fontSize: 13,
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        web: 'monospace',
      }),
      lineHeight: 18,
    },
    list_item: {
      marginBottom: 4,
      color: textColor,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    link: {
      color: isUser ? '#B3E5D1' : '#9B8AFF',
      textDecorationLine: 'underline' as const,
    },
    blockquote: {
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(155, 138, 255, 0.1)',
      borderLeftWidth: 3,
      borderLeftColor: isUser ? '#FFFFFF' : '#9B8AFF',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    table: {
      borderWidth: 1,
      borderColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(155, 138, 255, 0.2)',
      borderRadius: 8,
      overflow: 'hidden' as const,
      marginVertical: 8,
    },
    thead: {
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(155, 138, 255, 0.15)',
    },
    th: {
      padding: 8,
      borderRightWidth: 1,
      borderRightColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(155, 138, 255, 0.2)',
      fontWeight: '600' as const,
    },
    td: {
      padding: 8,
      borderRightWidth: 1,
      borderTopWidth: 1,
      borderRightColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(155, 138, 255, 0.15)',
      borderTopColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(155, 138, 255, 0.15)',
    },
    hr: {
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(155, 138, 255, 0.2)',
      height: 1,
      marginVertical: 12,
    },
  };

  // Simple check if content contains markdown syntax
  // This helps optimize performance for plain text
  const hasMarkdown = (
    content.includes('```') ||
    content.includes('**') ||
    content.includes('`') ||
    content.includes('#') ||
    content.includes('-') ||
    content.includes('[') ||
    content.includes('>') ||
    content.includes('*') ||
    content.includes('_')
  );

  // For plain text or streaming, render as plain text for better performance
  if (!hasMarkdown || isStreaming) {
    return (
      <Text style={[markdownStyles.body, { color: textColor }]}>
        {content}
      </Text>
    );
  }

  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
});

MarkdownText.displayName = 'MarkdownText';

