import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import PermissionController from '@/actions/App/Http/Controllers/PermissionController';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { Form, Head } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';

export type PermissionRecord = App.Data.Permission.PermissionData;

export type PermissionCollection = PaginationMeta & {
  data: App.Data.Permission.PermissionData[];
};

interface PermissionCreateProps {}

export default function PermissionCreate() {
  return (
    <AppLayout>
      <Head title="Create Permission" />
      <Form {...PermissionController.store.form()}
        options={{ preserveScroll: true }}
        className="p-8"
      >
        {({ errors, processing }) => (
          <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Create Permission</h1>
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
                />
                <InputError message={errors.guard_name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="group">Group</Label>
                <Input
                  id="group"
                  name="group"
                  type="text"
                  required
                />
                <InputError message={errors.group} />
              </div>
            </div>
            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {processing ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </Form>
    </AppLayout>
  );
}
