import AppLayout from '@/layouts/app-layout';
import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';
import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import ModuleQuizController from '@/actions/App/Http/Controllers/ModuleQuizController';
import ModuleStageController from '@/actions/App/Http/Controllers/ModuleStageController';
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



export type ModuleStageRecord = App.Data.ModuleStage.ModuleStageData;

export type ModuleStageCollection = PaginationMeta & {
  data: App.Data.ModuleStage.ModuleStageData[];
};

interface ModuleStageIndexProps {
  moduleStages: ModuleStageCollection;
  filters?: DataTableFilters | null;
  sort?: string | null;
  filteredData?: Record<string, unknown> | null;
}

export default function ModuleStageIndex({ moduleStages, filters = null, sort = null, filteredData: initialFilteredData = null }: ModuleStageIndexProps) {
  const resolveDestroyUrl = useCallback((id: number) => ModuleStageController.destroy(id).url, []);
  const handleDelete = useCallback(
    (id: number) => {
      confirm.delete(
        'This action cannot be undone. Delete this module stage?',
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
  const columns = useMemo<(ColumnDef<ModuleStageRecord> & ColumnFilterMeta)[]>(() => [
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
      id: 'module_able',
      accessorKey: 'module_able',
      header: 'Module Able',
      cell: ({ getValue }) => {
        const value = getValue() as unknown;
        if (value === null || value === undefined) {
          return '—';
        }
        return String(value);
      },
      enableSorting: true,
      enableFiltering: true,
      filter: { type: 'text', placeholder: 'Filter by module able...' },
    },
    {
      id: 'order',
      accessorKey: 'order',
      header: 'Order',
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
      filter: { type: 'number', placeholder: 'Filter by order...' },
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
      id: 'module_id',
      accessorKey: 'module_id',
      header: 'Module',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by module...',
        searchPlaceholder: 'Search module...',
        fetchDataUrl: ModuleController.index().url,
        valueMapKey: 'moduleOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'module_content_id',
      accessorKey: 'module_content_id',
      header: 'Module Content',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by module content...',
        searchPlaceholder: 'Search module content...',
        fetchDataUrl: ModuleContentController.index().url,
        valueMapKey: 'moduleContentOptions',
        idField: 'id',
        labelField: 'name',
      },
    },
    {
      id: 'module_quiz_id',
      accessorKey: 'module_quiz_id',
      header: 'Module Quiz',
      enableSorting: false,
      enableFiltering: true,
      filterOnly: true,
      filter: {
        type: 'selector',
        placeholder: 'Filter by module quiz...',
        searchPlaceholder: 'Search module quiz...',
        fetchDataUrl: ModuleQuizController.index().url,
        valueMapKey: 'moduleQuizOptions',
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
                <Link href={ModuleStageController.show(row.original.id).url} className="flex items-center gap-2 text-sm">
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={ModuleStageController.edit(row.original.id).url} className="flex items-center gap-2 text-sm">
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
      <Head title="Module Stages" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Module Stages</h1>
            <p className="text-muted-foreground">Manage module stages in one place.</p>
          </div>
          <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
            <Button asChild>
              <Link href={ModuleStageController.create().url}>
                New Module Stage
              </Link>
            </Button>
          </div>
        </div>
        <DataTable<ModuleStageRecord>
          title="Module Stages"
          data={moduleStages.data}
          columns={columns}
          pagination={moduleStages}
          filters={{
            search: searchValue,
            sort: activeSort,
            columnFilters,
          }}
          filteredData={filteredData}
          searchPlaceholder="Search module stages..."
          enableSearch
          enableColumnFilters
          enableMultiSort
          routeFunction={ModuleStageController.index}
          resetRoute={ModuleStageController.index().url}
          emptyMessage="No module stages found"
          emptyDescription="Try adjusting your filters or create a new module stage"
        />
      </div>
    </AppLayout>
  );
}
