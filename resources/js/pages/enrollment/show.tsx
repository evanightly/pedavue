import AppLayout from '@/layouts/app-layout';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Head } from '@inertiajs/react';



export type EnrollmentRecord = App.Data.Enrollment.EnrollmentData;

export type EnrollmentCollection = PaginationMeta & {
  data: App.Data.Enrollment.EnrollmentData[];
};

interface EnrollmentShowProps {
  record: EnrollmentRecord;
}

export default function EnrollmentShow({ record }: EnrollmentShowProps) {
  return (
    <AppLayout>
      <Head title="Enrollment" />
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <h1 className="text-2xl font-semibold">Enrollment</h1>
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
              <dt className="text-sm font-medium text-muted-foreground">Progress</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.progress === null || record.progress === undefined ? '—' : typeof record.progress === 'object' ? JSON.stringify(record.progress, null, 2) : String(record.progress)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Completed At</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.completed_at === null || record.completed_at === undefined ? '—' : typeof record.completed_at === 'object' ? JSON.stringify(record.completed_at, null, 2) : String(record.completed_at)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">User</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.user_id === null || record.user_id === undefined ? '—' : typeof record.user_id === 'object' ? JSON.stringify(record.user_id, null, 2) : String(record.user_id)}
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
