import AppLayout from '@/layouts/app-layout';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Head } from '@inertiajs/react';



export type ModuleContentRecord = App.Data.ModuleContent.ModuleContentData;

export type ModuleContentCollection = PaginationMeta & {
  data: App.Data.ModuleContent.ModuleContentData[];
};

interface ModuleContentShowProps {
  record: ModuleContentRecord;
}

export default function ModuleContentShow({ record }: ModuleContentShowProps) {
  return (
    <AppLayout>
      <Head title="Module Content" />
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <h1 className="text-2xl font-semibold">Module Content</h1>
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
              <dt className="text-sm font-medium text-muted-foreground">File Path</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.file_path === null || record.file_path === undefined ? '—' : typeof record.file_path === 'object' ? JSON.stringify(record.file_path, null, 2) : String(record.file_path)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Content Url</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.content_url === null || record.content_url === undefined ? '—' : typeof record.content_url === 'object' ? JSON.stringify(record.content_url, null, 2) : String(record.content_url)}
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
              <dt className="text-sm font-medium text-muted-foreground">Content Type</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.content_type === null || record.content_type === undefined ? '—' : typeof record.content_type === 'object' ? JSON.stringify(record.content_type, null, 2) : String(record.content_type)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Module Stage</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.module_stage_id === null || record.module_stage_id === undefined ? '—' : typeof record.module_stage_id === 'object' ? JSON.stringify(record.module_stage_id, null, 2) : String(record.module_stage_id)}
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
