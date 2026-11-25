import { IconCheck, IconLanguage } from '@tabler/icons-react';
import { Button } from '#/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import { type Language, languages } from '#/config/translations';
import { useLanguage } from '#/context/language-context';
import { cn } from '#/lib/utils';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
};

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full">
          <IconLanguage className="size-[1.2rem]" />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((code) => (
          <DropdownMenuItem key={code} onClick={() => setLanguage(code)}>
            {LANGUAGE_NAMES[code]}
            <IconCheck size={14} className={cn('ml-auto', language !== code && 'hidden')} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
