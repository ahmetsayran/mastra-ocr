import { toast } from 'sonner';
import { translate } from '#/context/language-context';

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error);

  let errMsg = translate('common.somethingWentWrong');

  if (error && typeof error === 'object' && 'status' in error && Number(error.status) === 204) {
    errMsg = translate('common.contentNotFound');
  }

  /* if (error instanceof AxiosError) {
    errMsg = error.response?.data.title
  } */

  toast.error(errMsg);
}
