import QuizController from '@/actions/App/Http/Controllers/QuizController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { confirm } from '@/lib/confirmation-utils';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';

export type QuizRecord = App.Data.Quiz.QuizData;

export type QuizCollection = PaginationMeta & {
    data: App.Data.Quiz.QuizData[];
};

interface QuizIndexProps {
    quizzes: QuizCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
}

export default function QuizIndex({ quizzes, filters = null, sort = null, filteredData: initialFilteredData = null }: QuizIndexProps) {
    const resolveDestroyUrl = useCallback((slug: number) => QuizController.show.url(slug), []);
    const handleDelete = useCallback(
        (slug: number) => {
            confirm.delete('This action cannot be undone. Delete this course?', () => {
                router.delete(resolveDestroyUrl(slug), {
                    preserveScroll: true,
                    preserveState: false,
                });
            });
        },
        [resolveDestroyUrl],
    );

    const filteredData = initialFilteredData ?? undefined;
    const searchValue = typeof filters?.search === 'string' ? filters.search : '';
    const activeSort = typeof sort === 'string' ? sort : undefined;
    const columnFilters =
        filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
            ? (filters.columnFilters as Record<string, unknown>)
            : {};
    const columns = useMemo<(ColumnDef<QuizRecord> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'id',
                accessorKey: 'id',
                header: 'ID',
                cell: ({ row }) => <span className='text-sm font-medium text-foreground'>{row.original.id}</span>,
                enableSorting: true,
                enableFiltering: false,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Name',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by name...' },
            },
            {
                id: 'description',
                accessorKey: 'description',
                header: 'Description',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                filter: { type: 'text', placeholder: 'Filter by description...' },
            },
            {
                id: 'is_question_shuffled',
                accessorKey: 'is_question_shuffled',
                header: 'Shuffle Questions',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    if (typeof value === 'boolean') {
                        return value ? 'Yes' : 'No';
                    }
                    if (typeof value === 'number') {
                        return value === 0 ? 'No' : 'Yes';
                    }
                    if (typeof value === 'string') {
                        const normalized = value.trim().toLowerCase();
                        if (normalized === 'true' || normalized === '1') {
                            return 'Yes';
                        }
                        if (normalized === 'false' || normalized === '0') {
                            return 'No';
                        }
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'boolean' },
            },
            // {
            //     id: 'level',
            //     accessorKey: 'level',
            //     header: 'Level',
            //     cell: ({ getValue }) => {
            //         const value = getValue() as unknown;
            //         if (value === null || value === undefined) {
            //             return '—';
            //         }
            //         return String(value);
            //     },
            //     enableSorting: true,
            //     enableFiltering: true,
            //     filter: { type: 'text', placeholder: 'Filter by level...' },
            // },
            {
                id: 'duration',
                accessorKey: 'duration',
                header: 'Duration',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by duration...' },
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
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem asChild>
                                    <Link href={QuizController.show.url(row.original.id)} className='flex items-center gap-2 text-sm'>
                                        View
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={QuizController.edit.url(row.original.id)} className='flex items-center gap-2 text-sm'>
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        if (row.original.id) {
                                            handleDelete(row.original.id);
                                        }
                                    }}
                                    className='flex items-center gap-2 text-sm text-destructive focus:text-destructive'
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
        ],
        [handleDelete],
    );

    return (
        <AppLayout>
            <Head title='Quizzes' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Quizzes</h1>
                        <p className='text-muted-foreground'>Manage quizzes in one place.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button asChild>
                            <Link href={QuizController.create().url}>New Quiz</Link>
                        </Button>
                        
                    </div>
                </div>
                <DataTable<QuizRecord>
                    title='Quizs'
                    data={quizzes.data}
                    columns={columns}
                    pagination={quizzes}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Search quizzes...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={QuizController.index}
                    resetRoute={QuizController.index().url}
                    emptyMessage='No quizzes found'
                    emptyDescription='Try adjusting your filters or create a new quiz.'
                />
            </div>
        </AppLayout>
    );
}
