import AppLayout from '@/layouts/app-layout';
import QuizController from '@/actions/App/Http/Controllers/QuizController';
import QuizResultController from '@/actions/App/Http/Controllers/QuizResultController';
import UserController from '@/actions/App/Http/Controllers/UserController';
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



export type QuizResultRecord = App.Data.QuizResult.QuizResultData;

export type QuizResultCollection = PaginationMeta & {
  data: App.Data.QuizResult.QuizResultData[];
};

interface QuizResultIndexProps {
  quizResults: QuizResultCollection;
  filters?: DataTableFilters | null;
  sort?: string | null;
  filteredData?: Record<string, unknown> | null;
}

export default function QuizResultIndex({ quizResults, filters = null, sort = null, filteredData: initialFilteredData = null }: QuizResultIndexProps) {
  const resolveDestroyUrl = useCallback((id: number) => QuizResultController.destroy(id).url, []);
  const handleDelete = useCallback(
    (id: number) => {
      confirm.delete(
        'This action cannot be undone. Delete this quiz result?',
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
  const columns = useMemo<(ColumnDef<QuizResultRecord> & ColumnFilterMeta)[]>(() => [
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
      id: 'score',
      accessorKey: 'score',
      header: 'Score',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value.toLocaleString() : String(value);
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'number', placeholder: 'Filter by score...' },
    },
    {
      id: 'attempt',
      accessorKey: 'attempt',
      header: 'Attempt',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value.toLocaleString() : String(value);
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'number', placeholder: 'Filter by attempt...' },
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
      id: 'user_id',
      accessorKey: 'user_id',
      header: 'User',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by user...',
        searchPlaceholder: 'Search user...',
        fetchDataUrl: UserController.index().url,
        valueMapKey: 'userOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'quiz_id',
      accessorKey: 'quiz_id',
      header: 'Quiz',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by quiz...',
        searchPlaceholder: 'Search quiz...',
        fetchDataUrl: QuizController.index().url,
        valueMapKey: 'quizOptions',
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
                <Link href={QuizResultController.show(row.original.id).url} className="flex items-center gap-2 text-sm">
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={QuizResultController.edit(row.original.id).url} className="flex items-center gap-2 text-sm">
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
      <Head title="Quiz Results" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
            <p className="text-muted-foreground">Manage quiz results in one place.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
            <Button asChild>
              <Link href={QuizResultController.create().url}>
                New Quiz Result
              </Link>
            </Button>
          </div>
        </div>
        <DataTable<QuizResultRecord>
          title="Quiz Results"
          data={quizResults.data}
          columns={columns}
          pagination={quizResults}
          filters={{
            search: searchValue,
            sort: activeSort,
            columnFilters,
          }}
          filteredData={filteredData}
          searchPlaceholder="Search quiz results..."
          enableSearch
          enableColumnFilters
          enableMultiSort
          routeFunction={QuizResultController.index}
          resetRoute={QuizResultController.index().url}
          emptyMessage="No quiz results found"
          emptyDescription="Try adjusting your filters or create a new quiz result"
        />
      </div>
    </AppLayout>
  );
}
