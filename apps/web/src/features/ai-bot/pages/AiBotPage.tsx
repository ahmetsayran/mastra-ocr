import { Header } from '#/components/layout/header';
import { Main } from '#/components/layout/main';
import { LanguageSwitch } from '#/components/language-switch';
import { ProfileDropdown } from '#/components/profile-dropdown';
import { ThemeSwitch } from '#/components/theme-switch';
import { Button } from '#/components/ui/button';
import { useLanguage } from '#/context/language-context';
import { cn } from '#/lib/utils';
import { IconArrowUp, IconFileText, IconPaperclip, IconSparkles } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { MarkdownMessage } from '../components/markdown-message';
import { useAiBot } from '../hooks/use-ai-bot';
import { threadDetailQueryOptions } from '../queries/thread-queries';

// Same MIME types the API accepts for OCR documents
const DOCUMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

type ChatBubble = {
  key: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: Date;
  document?: { name: string; title: string | null };
};

export default function AiBotPage() {
  const { uuid: threadId } = useParams({ strict: false });
  const [message, setMessage] = useState('');
  const { t } = useLanguage();
  const { data: thread } = useQuery({ ...threadDetailQueryOptions(threadId ?? '') });
  const { sendMessage, isSending, pendingMessage, streamedReply, addDocument, isAddingDocument } =
    useAiBot(threadId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bubbles: ChatBubble[] = (threadId ? (thread?.messages ?? []) : []).map((msg) => ({
    key: msg.uuid,
    role: msg.role,
    content: msg.content,
    createdAt: new Date(msg.createdAt),
    document: msg.asset ?? undefined,
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
        <h1 className="truncate text-[15px] font-medium">
          {threadId ? (thread?.title ?? '') : t('aiBot.newChat')}
        </h1>
        <div className="ml-auto flex items-center space-x-4">
          <LanguageSwitch />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="py-0">
        {/* Conversation */}
        <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl shrink-0 flex-col gap-6 py-6">
            {bubbles.length === 0 && (
              <div className="m-auto flex max-w-md flex-col items-center gap-3 text-center">
                <IconSparkles size={32} className="text-muted-foreground" />
                <h2 className="text-2xl font-semibold">{t('aiBot.emptyTitle')}</h2>
                <p className="text-muted-foreground text-[15px] leading-relaxed">
                  {t('aiBot.emptyDescription')}
                </p>
              </div>
            )}
            {bubbles.map((bubble) => (
              <div
                key={bubble.key}
                className={cn(
                  'text-[15px] leading-7 break-words',
                  bubble.role === 'USER'
                    ? 'bg-secondary max-w-[80%] self-end rounded-2xl px-4 py-2.5 whitespace-pre-wrap'
                    : 'max-w-full self-start',
                  bubble.key === 'streaming' && !streamedReply && 'animate-pulse',
                )}
              >
                {bubble.document ? (
                  <span className="flex items-center gap-3">
                    <IconFileText size={28} className="text-muted-foreground shrink-0" />
                    <span className="flex flex-col leading-5">
                      <span className="font-medium">
                        {bubble.document.title ?? bubble.document.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t('aiBot.documentAdded')}
                      </span>
                    </span>
                  </span>
                ) : bubble.role === 'USER' ? (
                  bubble.content
                ) : (
                  <MarkdownMessage content={bubble.content} />
                )}
                {bubble.createdAt && (
                  <span
                    className={cn(
                      'text-muted-foreground mt-1 block text-xs',
                      bubble.role === 'USER' && 'text-right',
                    )}
                  >
                    {format(bubble.createdAt, t('aiBot.timeFormat'))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Box */}
        <form className="mx-auto w-full max-w-3xl flex-none pb-4" onSubmit={handleSubmit}>
          <div className="bg-accent border-input focus-within:ring-ring/50 flex items-center gap-2 rounded-2xl border px-2 py-2 shadow-sm focus-within:ring-2">
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
              className="rounded-full"
              title={t('aiBot.addDocument')}
              onClick={() => fileInputRef.current?.click()}
              disabled={isAddingDocument}
            >
              <IconPaperclip size={20} />
            </Button>
            <label className="flex-1">
              <span className="sr-only">{t('aiBot.message')}</span>
              <input
                type="text"
                placeholder={t('aiBot.messagePlaceholder')}
                className="placeholder:text-muted-foreground h-10 w-full bg-transparent text-[15px] focus-visible:outline-hidden"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isSending}
              />
            </label>
            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              title={t('aiBot.send')}
              disabled={isSending || !message.trim()}
            >
              <IconArrowUp size={20} />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-center text-xs">{t('aiBot.footer')}</p>
        </form>
      </Main>
    </>
  );
}
