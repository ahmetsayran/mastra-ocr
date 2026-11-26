import { useNavigate, useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { useLanguage } from '#/context/language-context';
import { cn } from '#/lib/utils';

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean;
}

export default function GeneralError({ className, minimal = false }: GeneralErrorProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { history } = useRouter();
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        {!minimal && <h1 className="text-[7rem] leading-tight font-bold">500</h1>}
        <span className="font-medium">{t('error.generalTitle')}</span>
        <p className="text-muted-foreground text-center">{t('error.generalDescription')}</p>
        {!minimal && (
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => history.go(-1)}>
              {t('error.goBack')}
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>{t('error.backToHome')}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
