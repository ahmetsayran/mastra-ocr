import { Button } from '#/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import type { TranslationKey } from '#/config/translations';
import { useLanguage } from '#/context/language-context';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { formatListItem, parseParty } from '../utils/extraction-helpers';

export type ExtractionField = {
  key: string;
  label: TranslationKey;
  kind: 'text' | 'number' | 'date' | 'list' | 'parties';
};

type LineItemValues = { description: string; quantity: string; unitPrice: string; total: string };
type ExtractionFormValues = { fields: Record<string, string>; lineItems: LineItemValues[] };

interface ExtractionFormProps {
  fields: ExtractionField[];
  extraction: Record<string, unknown>;
  hasLineItems: boolean;
  onSubmit: (extraction: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

// Form inputs hold strings; the API expects numbers, ISO dates, lists, contract parties or null
function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(formatListItem).join('\n');
  return String(value);
}

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function fromInputValue(value: string, kind: ExtractionField['kind']): unknown {
  if (kind === 'list' || kind === 'parties') {
    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return kind === 'parties' ? lines.map(parseParty) : lines;
  }
  if (value.trim() === '') return null;
  return kind === 'number' ? Number(value) : value.trim();
}

export function ExtractionForm({
  fields,
  extraction,
  hasLineItems,
  onSubmit,
  onCancel,
  isSaving = false,
}: ExtractionFormProps) {
  const { t } = useLanguage();
  const lineItems = (extraction.lineItems as Record<string, unknown>[] | undefined) ?? [];

  const form = useForm<ExtractionFormValues>({
    defaultValues: {
      fields: Object.fromEntries(
        fields.map((field) => [field.key, toInputValue(extraction[field.key])]),
      ),
      lineItems: lineItems.map((item) => ({
        description: toInputValue(item.description),
        quantity: toInputValue(item.quantity),
        unitPrice: toInputValue(item.unitPrice),
        total: toInputValue(item.total),
      })),
    },
  });
  const lineItemsArray = useFieldArray({ control: form.control, name: 'lineItems' });

  const handleSubmit = async (values: ExtractionFormValues) => {
    await onSubmit({
      ...Object.fromEntries(
        fields.map((field) => [
          field.key,
          fromInputValue(values.fields[field.key] ?? '', field.kind),
        ]),
      ),
      ...(hasLineItems && {
        lineItems: values.lineItems.map((item) => ({
          description: item.description.trim(),
          quantity: toNumber(item.quantity),
          unitPrice: toNumber(item.unitPrice),
          total: toNumber(item.total),
        })),
      }),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 bg-muted rounded-lg p-3"
      >
        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => (
            <FormField
              key={field.key}
              control={form.control}
              name={`fields.${field.key}`}
              render={({ field: input }) => (
                <FormItem
                  className={
                    field.kind === 'list' || field.kind === 'parties' ? 'col-span-2' : undefined
                  }
                >
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    {field.kind === 'list' || field.kind === 'parties' ? (
                      <Textarea
                        {...input}
                        rows={3}
                        placeholder={t(
                          field.kind === 'parties'
                            ? 'field.partiesPlaceholder'
                            : 'field.listPlaceholder',
                        )}
                      />
                    ) : (
                      <Input
                        {...input}
                        type={
                          field.kind === 'number'
                            ? 'number'
                            : field.kind === 'date'
                              ? 'date'
                              : 'text'
                        }
                        step={field.kind === 'number' ? 'any' : undefined}
                      />
                    )}
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>

        {hasLineItems && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('field.lineItems')}</p>
            {lineItemsArray.fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[1fr_70px_90px_90px_auto] gap-2">
                <Input
                  {...form.register(`lineItems.${index}.description`)}
                  placeholder={t('field.description')}
                />
                <Input
                  {...form.register(`lineItems.${index}.quantity`)}
                  type="number"
                  step="any"
                  placeholder={t('field.quantity')}
                />
                <Input
                  {...form.register(`lineItems.${index}.unitPrice`)}
                  type="number"
                  step="any"
                  placeholder={t('field.unitPrice')}
                />
                <Input
                  {...form.register(`lineItems.${index}.total`)}
                  type="number"
                  step="any"
                  placeholder={t('field.total')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={t('field.removeLine')}
                  onClick={() => lineItemsArray.remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                lineItemsArray.append({ description: '', quantity: '', unitPrice: '', total: '' })
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('field.addLine')}
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('common.saveChanges')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
