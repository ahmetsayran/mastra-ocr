import { createFileRoute, Link } from '@tanstack/react-router';
import { OtpForm } from '#/components/form/otp-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { useLanguage } from '#/context/language-context';

export const Route = createFileRoute('/(auth)/otp')({
  component: Otp,
});

function Otp() {
  const { t } = useLanguage();
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base tracking-tight">{t('auth.otpTitle')}</CardTitle>
        <CardDescription>{t('auth.otpDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <OtpForm />
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground px-8 text-center text-sm">
          {t('auth.notReceived')}{' '}
          <Link to="/sign-in" className="hover:text-primary underline underline-offset-4">
            {t('auth.resendCode')}
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
