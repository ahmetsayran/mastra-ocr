import { Header } from '#/components/layout/header';
import { Main } from '#/components/layout/main';
import { ProfileDropdown } from '#/components/profile-dropdown';
import { ThemeSwitch } from '#/components/theme-switch';
import { Button } from '#/components/ui/button';
import { cn } from '#/lib/utils';
import { IconMessages, IconPaperclip, IconSend } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { useChatbot } from '../hooks/use-chatbot';
import { threadDetailQueryOptions } from '../queries/thread-queries';

// Same MIME types the API accepts for OCR documents
const DOCUMENT_ACCEPT = 'image/jpeg,image/png,image/webp';

type ChatBubble = { key: string; role: 'USER' | 'ASSISTANT'; content: string; createdAt?: Date };

export function ChatbotPage() {
  const { threadId } = useParams({ strict: false });
  const [message, setMessage] = useState('');
  const { data: thread } = useQuery({ ...threadDetailQueryOptions(threadId ?? '') });
  const { sendMessage, isSending, pendingMessage, streamedReply, addDocument, isAddingDocument } =
    useChatbot(threadId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bubbles: ChatBubble[] = (threadId ? (thread?.messages ?? []) : []).map((msg) => ({
    key: msg.uuid,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.createdAt),
  }));
  if (pendingMessage) {
    bubbles.push({ key: 'pending', role: 'USER', content: pendingMessage });
    bubbles.push({ key: 'streaming', role: 'ASSISTANT', content: streamedReply || '…' });
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || isSending) return;
    sendMessage(content);
    setMessage('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) addDocument(file);
  };

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className="bg-primary-foreground flex h-full flex-col rounded-md border shadow-xs">
          {/* Top Part */}
          <div className="bg-secondary mb-1 flex flex-none items-center gap-2 rounded-t-md p-4 shadow-lg">
            <IconMessages size={20} />
            <span className="text-sm font-medium lg:text-base">
              {threadId ? (thread?.title ?? '') : 'New chat'}
            </span>
          </div>

          {/* Conversation */}
          <div className="flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4">
            <div className="flex size-full flex-1">
              <div className="chat-text-container relative -mr-4 flex flex-1 flex-col overflow-y-hidden">
                <div className="chat-flex flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pr-4 pb-4">
                  {bubbles.length === 0 && (
                    <div className="text-muted-foreground m-auto text-sm">
                      Send a message to start a chat.
                    </div>
                  )}
                  {[...bubbles].reverse().map((bubble) => (
                    <div
                      key={bubble.key}
                      className={cn(
                        'chat-box max-w-[75%] px-3 py-2 break-words whitespace-pre-wrap shadow-lg',
                        bubble.role === 'USER'
                          ? 'bg-primary/85 text-primary-foreground/75 self-end rounded-[16px_16px_0_16px]'
                          : 'bg-secondary self-start rounded-[16px_16px_16px_0]',
                      )}
                    >
                      {bubble.content}
                      {bubble.createdAt && (
                        <span
                          className={cn(
                            'text-muted-foreground mt-1 block text-xs font-light italic',
                            bubble.role === 'USER' && 'text-right',
                          )}
                        >
                          {format(bubble.createdAt, 'h:mm a')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <form className="flex w-full flex-none gap-2" onSubmit={handleSubmit}>
              <div className="border-input focus-within:ring-ring flex flex-1 items-center gap-2 rounded-md border px-2 py-1 focus-within:ring-1 focus-within:outline-hidden lg:gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DOCUMENT_ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Add document"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAddingDocument}
                >
                  <IconPaperclip size={20} />
                </Button>
                <label className="flex-1">
                  <span className="sr-only">Chat Text Box</span>
                  <input
                    type="text"
                    placeholder="Type your messages..."
                    className="h-8 w-full bg-inherit focus-visible:outline-hidden"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    disabled={isSending}
                  />
                </label>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex"
                  disabled={isSending}
                >
                  <IconSend size={20} />
                </Button>
              </div>
              <Button type="submit" className="h-full sm:hidden" disabled={isSending}>
                <IconSend size={18} /> Send
              </Button>
            </form>
          </div>
        </section>
      </Main>
    </>
  );
}
