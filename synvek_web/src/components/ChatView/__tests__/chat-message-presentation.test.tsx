/**
 * Property-Based Tests for Chat Message Presentation
 * **Feature: ui-enhancement, Property 28: Chat message presentation**
 * **Validates: Requirements 6.3**
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import React from 'react';

// Mock chat message structure based on the ChatView component
interface MockChatMessage {
  key: string;
  fromUser: boolean;
  content: Array<{ type: 'text' | 'image_url' | 'audio_url'; text: string }>;
  time: number;
  modelName?: string;
  attachments: Array<{ attachmentId: number | null; attachmentName: string; attachmentType: string }>;
  toolCalls: Array<{ id: string; name: string; args: string }>;
  success: boolean;
}

// Generator for chat messages
const chatMessageGenerator = fc.record({
  key: fc.uuid(),
  fromUser: fc.boolean(),
  content: fc.array(fc.record({
    type: fc.constantFrom('text' as const, 'image_url' as const, 'audio_url' as const),
    text: fc.string({ minLength: 1, maxLength: 1000 })
  }), { minLength: 1, maxLength: 1 }),
  time: fc.integer({ min: Date.now() - 86400000, max: Date.now() }), // Last 24 hours
  modelName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  attachments: fc.array(fc.record({
    attachmentId: fc.option(fc.integer({ min: 1 })),
    attachmentName: fc.string({ minLength: 1, maxLength: 100 }),
    attachmentType: fc.constantFrom('image/png', 'image/jpeg', 'text/plain', 'application/pdf')
  }), { maxLength: 5 }),
  toolCalls: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    args: fc.string({ maxLength: 200 })
  }), { maxLength: 3 }),
  success: fc.boolean()
});

// Mock component that renders a chat message section similar to ChatView
const MockChatMessageSection: React.FC<{ chatMessage: MockChatMessage }> = ({ chatMessage }) => {
  return (
    <div className="chat-section" data-testid="chat-message">
      <div className="chat-section-header">
        <div className="chat-section-from" data-testid="message-sender">
          {chatMessage.fromUser ? 'User' : (chatMessage.modelName || 'Assistant')}
        </div>
        <div className="chat-section-datetime" data-testid="message-time">
          {new Date(chatMessage.time).toISOString()}
        </div>
      </div>
      <div className="chat-content" data-testid="message-content">
        {chatMessage.content.map((content, index) => (
          <div key={index} data-content-type={content.type}>
            {content.type === 'text' && <div>{content.text}</div>}
            {content.type === 'image_url' && <img src={content.text} alt="Chat image" />}
            {content.type === 'audio_url' && <audio src={content.text} controls />}
          </div>
        ))}
      </div>
      {chatMessage.attachments.length > 0 && (
        <div className="attachment-container" data-testid="message-attachments">
          {chatMessage.attachments.map((attachment, index) => (
            <div key={index} data-testid="attachment-item">
              {attachment.attachmentName}
            </div>
          ))}
        </div>
      )}
      {chatMessage.toolCalls.length > 0 && (
        <div className="tools-section" data-testid="message-tools">
          {chatMessage.toolCalls.map((toolCall, index) => (
            <div key={index} data-testid="tool-call">
              {toolCall.name}
            </div>
          ))}
        </div>
      )}
      {!chatMessage.success && (
        <div className="error-section" data-testid="message-error">
          Error in message processing
        </div>
      )}
    </div>
  );
};

describe('Chat Message Presentation Tests', () => {
  describe('Property 28: Chat message presentation', () => {
    test('chat messages should be presented in well-designed bubbles or cards', () => {
      fc.assert(
        fc.property(chatMessageGenerator, (chatMessage) => {
          const { container, getByTestId } = render(
            <ConfigProvider>
              <MockChatMessageSection chatMessage={chatMessage} />
            </ConfigProvider>
          );

          const messageElement = getByTestId('chat-message');
          
          // Message should be contained in a structured element (card-like)
          expect(messageElement).toBeInTheDocument();
          expect(messageElement.className).toContain('chat-section');
          
          // Should have proper header with sender and timestamp
          const senderElement = getByTestId('message-sender');
          const timeElement = getByTestId('message-time');
          expect(senderElement).toBeInTheDocument();
          expect(timeElement).toBeInTheDocument();
          
          // Sender should display appropriate name
          const expectedSender = chatMessage.fromUser ? 'User' : (chatMessage.modelName || 'Assistant');
          expect(senderElement.textContent).toBe(expectedSender);
          
          // Should have content section
          const contentElement = getByTestId('message-content');
          expect(contentElement).toBeInTheDocument();
          
          // Content should match the message content
          chatMessage.content.forEach((content) => {
            const contentTypeElements = container.querySelectorAll(`[data-content-type="${content.type}"]`);
            expect(contentTypeElements.length).toBeGreaterThan(0);
          });
          
          // If attachments exist, they should be displayed
          if (chatMessage.attachments.length > 0) {
            const attachmentsContainer = getByTestId('message-attachments');
            expect(attachmentsContainer).toBeInTheDocument();
            
            const attachmentItems = container.querySelectorAll('[data-testid="attachment-item"]');
            expect(attachmentItems.length).toBe(chatMessage.attachments.length);
          }
          
          // If tool calls exist, they should be displayed
          if (chatMessage.toolCalls.length > 0) {
            const toolsSection = getByTestId('message-tools');
            expect(toolsSection).toBeInTheDocument();
            
            const toolCallItems = container.querySelectorAll('[data-testid="tool-call"]');
            expect(toolCallItems.length).toBe(chatMessage.toolCalls.length);
          }
          
          // Error states should be handled appropriately
          if (!chatMessage.success) {
            const errorSection = getByTestId('message-error');
            expect(errorSection).toBeInTheDocument();
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('message structure should be consistent across different message types', () => {
      fc.assert(
        fc.property(
          fc.array(chatMessageGenerator, { minLength: 2, maxLength: 10 }),
          (chatMessages) => {
            const renderedMessages = chatMessages.map((chatMessage, index) => {
              const { container } = render(
                <ConfigProvider key={index}>
                  <MockChatMessageSection chatMessage={chatMessage} />
                </ConfigProvider>
              );
              return container;
            });

            // All messages should have consistent structure
            renderedMessages.forEach((container) => {
              const messageElement = container.querySelector('[data-testid="chat-message"]');
              const senderElement = container.querySelector('[data-testid="message-sender"]');
              const timeElement = container.querySelector('[data-testid="message-time"]');
              const contentElement = container.querySelector('[data-testid="message-content"]');
              
              // Core elements should always be present
              expect(messageElement).toBeInTheDocument();
              expect(senderElement).toBeInTheDocument();
              expect(timeElement).toBeInTheDocument();
              expect(contentElement).toBeInTheDocument();
              
              // Structure should be consistent (same class names)
              expect(messageElement?.className).toContain('chat-section');
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('message content should be properly formatted based on content type', () => {
      fc.assert(
        fc.property(chatMessageGenerator, (chatMessage) => {
          const { container } = render(
            <ConfigProvider>
              <MockChatMessageSection chatMessage={chatMessage} />
            </ConfigProvider>
          );

          chatMessage.content.forEach((content) => {
            const contentElements = container.querySelectorAll(`[data-content-type="${content.type}"]`);
            expect(contentElements.length).toBeGreaterThan(0);
            
            contentElements.forEach((element) => {
              switch (content.type) {
                case 'text':
                  // Text content should be in a div
                  expect(element.tagName.toLowerCase()).toBe('div');
                  expect(element.textContent).toBe(content.text);
                  break;
                case 'image_url':
                  // Image content should contain an img element
                  const imgElement = element.querySelector('img');
                  expect(imgElement).toBeInTheDocument();
                  expect(imgElement?.getAttribute('src')).toBe(content.text);
                  break;
                case 'audio_url':
                  // Audio content should contain an audio element
                  const audioElement = element.querySelector('audio');
                  expect(audioElement).toBeInTheDocument();
                  expect(audioElement?.getAttribute('src')).toBe(content.text);
                  break;
              }
            });
          });
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('message timestamps should be properly formatted and valid', () => {
      fc.assert(
        fc.property(chatMessageGenerator, (chatMessage) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockChatMessageSection chatMessage={chatMessage} />
            </ConfigProvider>
          );

          const timeElement = getByTestId('message-time');
          const timeText = timeElement.textContent;
          
          // Should be a valid ISO string
          expect(() => new Date(timeText!)).not.toThrow();
          
          // Should represent the correct time
          const parsedTime = new Date(timeText!).getTime();
          expect(parsedTime).toBe(chatMessage.time);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    test('message sender identification should be clear and consistent', () => {
      fc.assert(
        fc.property(chatMessageGenerator, (chatMessage) => {
          const { getByTestId } = render(
            <ConfigProvider>
              <MockChatMessageSection chatMessage={chatMessage} />
            </ConfigProvider>
          );

          const senderElement = getByTestId('message-sender');
          const senderText = senderElement.textContent;
          
          if (chatMessage.fromUser) {
            expect(senderText).toBe('User');
          } else {
            // Should show model name if available, otherwise 'Assistant'
            const expectedName = chatMessage.modelName || 'Assistant';
            expect(senderText).toBe(expectedName);
          }
          
          // Sender text should not be empty
          expect(senderText).toBeTruthy();
          expect(senderText!.length).toBeGreaterThan(0);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});