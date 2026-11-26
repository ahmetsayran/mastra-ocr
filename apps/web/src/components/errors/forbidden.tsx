import { useNavigate, useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { useLanguage } from '#/context/language-context';

export default function ForbiddenError() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { history } = useRouter();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">403</h1>
        <span className="font-medium">{t('error.forbiddenTitle')}</span>
        <p className="text-muted-foreground text-center">{t('error.forbiddenDescription')}</p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => history.go(-1)}>
            {t('error.goBack')}
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>{t('error.backToHome')}</Button>
        </div>
      </div>
    </div>
  );
}
