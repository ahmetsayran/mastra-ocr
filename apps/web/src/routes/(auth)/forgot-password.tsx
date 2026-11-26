import { createFileRoute, Link } from '@tanstack/react-router';
import { ForgotPasswordForm } from '#/components/form/forgot-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { useLanguage } from '#/context/language-context';

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPassword,
});
function ForgotPassword() {
  const { t } = useLanguage();
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight">{t('auth.forgotPasswordTitle')}</CardTitle>
        <CardDescription>{t('auth.forgotPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground px-8 text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/sign-up" className="hover:text-primary underline underline-offset-4">
            {t('auth.signUp')}
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
