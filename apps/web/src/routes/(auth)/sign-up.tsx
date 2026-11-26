import { createFileRoute, Link } from '@tanstack/react-router';
import { SignUpForm } from '#/components/form/sign-up-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { useLanguage } from '#/context/language-context';

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUp,
});

function SignUp() {
  const { t } = useLanguage();
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">{t('auth.createAccountTitle')}</CardTitle>
        <CardDescription>
          {t('auth.createAccountDescription')} <br />
          {t('auth.haveAccount')}{' '}
          <Link to="/sign-in" className="hover:text-primary underline underline-offset-4">
            {t('auth.signIn')}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground px-8 text-center text-sm">
          {t('auth.signUpAgreement')}{' '}
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
