import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import RoleController from '@/actions/App/Http/Controllers/RoleController';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';



export type RoleRecord = App.Data.Role.RoleData;

export type RoleCollection = PaginationMeta & {
  data: App.Data.Role.RoleData[];
};

interface RoleEditProps {
  record: RoleRecord;
}

export default function RoleEdit({ record }: RoleEditProps) {
  const normalizeFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (_error) {
        return '';
      }
    }

    return String(value);
  };

  return (
    <AppLayout>
      <Head title="Edit Role" />
      <Form {...RoleController.update.form(record.id)}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Edit Role</h1>
              <p className="text-sm text-muted-foreground">
                Provide the necessary information below and submit when you're ready.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={normalizeFieldValue(record.name)}
                />
                <InputError message={errors.name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="guard_name">Guard Name</Label>
                <Input
                  id="guard_name"
                  name="guard_name"
                  type="text"
                  required
                  defaultValue={normalizeFieldValue(record.guard_name)}
                />
                <InputError message={errors.guard_name} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
