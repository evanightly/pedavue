import AnswerController from '@/actions/App/Http/Controllers/AnswerController';
import AppLayout from '@/layouts/app-layout';
import QuestionController from '@/actions/App/Http/Controllers/QuestionController';
import QuizResultAnswerController from '@/actions/App/Http/Controllers/QuizResultAnswerController';
import QuizResultController from '@/actions/App/Http/Controllers/QuizResultController';
import type { ColumnDef } from '@tanstack/react-table';
import type { ColumnFilterMeta } from '@/components/ui/data-table-types';
import type { DataTableFilters } from '@/components/ui/data-table-types';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Head, Link, router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { confirm } from '@/lib/confirmation-utils';
import { useCallback, useMemo } from 'react';



export type QuizResultAnswerRecord = App.Data.QuizResultAnswer.QuizResultAnswerData;

export type QuizResultAnswerCollection = PaginationMeta & {
  data: App.Data.QuizResultAnswer.QuizResultAnswerData[];
};

interface QuizResultAnswerIndexProps {
  quizResultAnswers: QuizResultAnswerCollection;
  filters?: DataTableFilters | null;
  sort?: string | null;
  filteredData?: Record<string, unknown> | null;
}

export default function QuizResultAnswerIndex({ quizResultAnswers, filters = null, sort = null, filteredData: initialFilteredData = null }: QuizResultAnswerIndexProps) {
  const resolveDestroyUrl = useCallback((id: number) => QuizResultAnswerController.destroy(id).url, []);
  const handleDelete = useCallback(
    (id: number) => {
      confirm.delete(
        'This action cannot be undone. Delete this quiz result answer?',
        () => {
          router.delete(resolveDestroyUrl(id), {
            preserveScroll: true,
            preserveState: false,
          });
        }
      );
    },
    [resolveDestroyUrl]
  );

  const filteredData = initialFilteredData ?? undefined;
  const searchValue = typeof filters?.search === 'string' ? filters.search : '';
  const activeSort = typeof sort === 'string' ? sort : undefined;
  const columnFilters =
    filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
      ? (filters.columnFilters as Record<string, unknown>)
      : {};
  const columns = useMemo<(ColumnDef<QuizResultAnswerRecord> & ColumnFilterMeta)[]>(() => [
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.id}</span>
      ),
      enableSorting: true,
      enableFiltering: false,
    },
    {
      id: 'user_answer_text',
      accessorKey: 'user_answer_text',
      header: 'User Answer Text',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'text', placeholder: 'Filter by user answer text...' },
    },
    {
      id: 'started_at',
      accessorKey: 'started_at',
      header: 'Started At',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'daterange', placeholder: 'Filter by started at...' },
    },
    {
      id: 'finished_at',
      accessorKey: 'finished_at',
      header: 'Finished At',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'daterange', placeholder: 'Filter by finished at...' },
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'daterange', placeholder: 'Filter by created at...' },
    },
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Updated At',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'daterange', placeholder: 'Filter by updated at...' },
    },
    {
      id: 'quiz_result_id',
      accessorKey: 'quiz_result_id',
      header: 'Quiz Result',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by quiz result...',
        searchPlaceholder: 'Search quiz result...',
        fetchDataUrl: QuizResultController.index().url,
        valueMapKey: 'quizResultOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'question_id',
      accessorKey: 'question_id',
      header: 'Question',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by question...',
        searchPlaceholder: 'Search question...',
        fetchDataUrl: QuestionController.index().url,
        valueMapKey: 'questionOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'answer_id',
      accessorKey: 'answer_id',
      header: 'Answer',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by answer...',
        searchPlaceholder: 'Search answer...',
        fetchDataUrl: AnswerController.index().url,
        valueMapKey: 'answerOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link href={QuizResultAnswerController.show(row.original.id).url} className="flex items-center gap-2 text-sm">
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={QuizResultAnswerController.edit(row.original.id).url} className="flex items-center gap-2 text-sm">
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleDelete(row.original.id);
                }}
                className="flex items-center gap-2 text-sm text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
      enableFiltering: false,
    },
  ], [handleDelete]);

  return (
    <AppLayout>
      <Head title="Quiz Result Answers" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quiz Result Answers</h1>
            <p className="text-muted-foreground">Manage quiz result answers in one place.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
            <Button asChild>
              <Link href={QuizResultAnswerController.create().url}>
                New Quiz Result Answer
              </Link>
            </Button>
          </div>
        </div>
        <DataTable<QuizResultAnswerRecord>
          title="Quiz Result Answers"
          data={quizResultAnswers.data}
          columns={columns}
          pagination={quizResultAnswers}
          filters={{
            search: searchValue,
            sort: activeSort,
            columnFilters,
          }}
          filteredData={filteredData}
          searchPlaceholder="Search quiz result answers..."
          enableSearch
          enableColumnFilters
          enableMultiSort
          routeFunction={QuizResultAnswerController.index}
          resetRoute={QuizResultAnswerController.index().url}
          emptyMessage="No quiz result answers found"
          emptyDescription="Try adjusting your filters or create a new quiz result answer"
        />
      </div>
    </AppLayout>
  );
}
