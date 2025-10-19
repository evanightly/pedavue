import AppLayout from '@/layouts/app-layout';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Head } from '@inertiajs/react';



export type QuizResultRecord = App.Data.QuizResult.QuizResultData;

export type QuizResultCollection = PaginationMeta & {
  data: App.Data.QuizResult.QuizResultData[];
};

interface QuizResultShowProps {
  record: QuizResultRecord;
}

export default function QuizResultShow({ record }: QuizResultShowProps) {
  return (
    <AppLayout>
      <Head title="Quiz Result" />
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <h1 className="text-2xl font-semibold">Quiz Result</h1>
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
              <dt className="text-sm font-medium text-muted-foreground">Score</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.score === null || record.score === undefined ? '—' : typeof record.score === 'object' ? JSON.stringify(record.score, null, 2) : String(record.score)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Attempt</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.attempt === null || record.attempt === undefined ? '—' : typeof record.attempt === 'object' ? JSON.stringify(record.attempt, null, 2) : String(record.attempt)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Started At</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.started_at === null || record.started_at === undefined ? '—' : typeof record.started_at === 'object' ? JSON.stringify(record.started_at, null, 2) : String(record.started_at)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Finished At</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.finished_at === null || record.finished_at === undefined ? '—' : typeof record.finished_at === 'object' ? JSON.stringify(record.finished_at, null, 2) : String(record.finished_at)}
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
              <dt className="text-sm font-medium text-muted-foreground">Quiz</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.quiz_id === null || record.quiz_id === undefined ? '—' : typeof record.quiz_id === 'object' ? JSON.stringify(record.quiz_id, null, 2) : String(record.quiz_id)}
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
