import { createFileRoute } from '@tanstack/react-router';
import { UserAuthForm } from '#components/form/user-auth-form.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { useLanguage } from '#/context/language-context';

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn,
});

function SignIn() {
  const { t } = useLanguage();
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">{t('auth.login')}</CardTitle>
        <CardDescription>{t('auth.loginDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <UserAuthForm />
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground px-8 text-center text-sm">
          {t('auth.loginAgreement')}{' '}
          <a href="/terms" className="hover:text-primary underline underline-offset-4">
            {t('auth.termsOfService')}
          </a>{' '}
          {t('auth.and')}{' '}
          <a href="/privacy" className="hover:text-primary underline underline-offset-4">
            {t('auth.privacyPolicy')}
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
