import AppLayout from '@/layouts/app-layout';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Head } from '@inertiajs/react';



export type ModuleRecord = App.Data.Module.ModuleData;

export type ModuleCollection = PaginationMeta & {
  data: App.Data.Module.ModuleData[];
};

interface ModuleShowProps {
  record: ModuleRecord;
}

export default function ModuleShow({ record }: ModuleShowProps) {
  return (
    <AppLayout>
      <Head title="Module" />
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <h1 className="text-2xl font-semibold">Module</h1>
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <dl className="divide-y divide-border">
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">ID</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.id === null || record.id === undefined ? '—' : typeof record.id === 'object' ? JSON.stringify(record.id, null, 2) : String(record.id)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Title</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.title === null || record.title === undefined ? '—' : typeof record.title === 'object' ? JSON.stringify(record.title, null, 2) : String(record.title)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Description</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.description === null || record.description === undefined ? '—' : typeof record.description === 'object' ? JSON.stringify(record.description, null, 2) : String(record.description)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Thumbnail</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.thumbnail === null || record.thumbnail === undefined ? '—' : typeof record.thumbnail === 'object' ? JSON.stringify(record.thumbnail, null, 2) : String(record.thumbnail)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.duration === null || record.duration === undefined ? '—' : typeof record.duration === 'object' ? JSON.stringify(record.duration, null, 2) : String(record.duration)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Order</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.order === null || record.order === undefined ? '—' : typeof record.order === 'object' ? JSON.stringify(record.order, null, 2) : String(record.order)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Course</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.course_id === null || record.course_id === undefined ? '—' : typeof record.course_id === 'object' ? JSON.stringify(record.course_id, null, 2) : String(record.course_id)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.created_at === null || record.created_at === undefined ? '—' : typeof record.created_at === 'object' ? JSON.stringify(record.created_at, null, 2) : String(record.created_at)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Updated At</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.updated_at === null || record.updated_at === undefined ? '—' : typeof record.updated_at === 'object' ? JSON.stringify(record.updated_at, null, 2) : String(record.updated_at)}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppLayout>
  );
}
