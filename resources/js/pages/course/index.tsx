import CourseController from '@/actions/App/Http/Controllers/CourseController';
import UserController from '@/actions/App/Http/Controllers/UserController';
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

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseIndexProps {
    courses: CourseCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
}

export default function CourseIndex({ courses, filters = null, sort = null, filteredData: initialFilteredData = null }: CourseIndexProps) {
    const resolveDestroyUrl = useCallback((slug: string) => CourseController.show.url(slug), []);
    const handleDelete = useCallback(
        (slug: string) => {
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
    const columns = useMemo<(ColumnDef<CourseRecord> & ColumnFilterMeta)[]>(
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
                id: 'title',
                accessorKey: 'title',
                header: 'Title',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by title...' },
            },
            {
                id: 'slug',
                accessorKey: 'slug',
                header: 'Slug',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                filter: { type: 'text', placeholder: 'Filter by slug...' },
            },
            {
                id: 'certification_enabled',
                accessorKey: 'certification_enabled',
                header: 'Certification Enabled',
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
            {
                id: 'thumbnail',
                accessorKey: 'thumbnail_url',
                header: 'Thumbnail',
                cell: ({ getValue, row }) => {
                    return row.original.thumbnail_url ? (
                        <img
                            src={String(getValue())}
                            alt={`Thumbnail for course ${row.original.title}`}
                            className='h-10 w-10 rounded-md object-cover'
                        />
                    ) : (
                        '—'
                    );
                },

                enableSorting: true,
                filter: { type: 'text', placeholder: 'Filter by thumbnail...' },
            },
            {
                id: 'level',
                accessorKey: 'level',
                header: 'Level',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter by level...' },
            },
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
                id: 'instructors',
                accessorKey: 'instructors',
                header: 'Instruktur',
                enableSorting: false,
                enableFiltering: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter by instructor...',
                    searchPlaceholder: 'Cari instruktur...',
                    fetchDataUrl: UserController.index().url,
                    valueMapKey: 'instructorOptions',
                    idField: 'id',
                    labelField: 'name',
                    dataMapper(response) {
                        return response.users.data;
                    },
                },
                cell: ({ row }) => {
                    const instructors = Array.isArray(row.original.course_instructors) ? row.original.course_instructors : [];

                    if (instructors.length === 0) {
                        return <span className='text-sm text-muted-foreground'>—</span>;
                    }

                    const names = instructors
                        .map((entry) => {
                            if (entry && typeof entry === 'object' && 'name' in entry) {
                                return String(entry.name ?? '');
                            }

                            if (typeof entry === 'string' || typeof entry === 'number') {
                                return String(entry);
                            }

                            return null;
                        })
                        .filter((value): value is string => Boolean(value));

                    return <span className='text-sm font-medium text-foreground'>{names.join(', ')}</span>;
                },
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
                                    <Link href={CourseController.show.url(row.original.slug)} className='flex items-center gap-2 text-sm'>
                                        View
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={CourseController.edit.url(row.original.slug)} className='flex items-center gap-2 text-sm'>
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        if (row.original.slug) {
                                            handleDelete(row.original.slug);
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
            <Head title='Courses' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Courses</h1>
                        <p className='text-muted-foreground'>Manage courses in one place.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button asChild>
                            <Link href={CourseController.create().url}>New Course</Link>
                        </Button>
                    </div>
                </div>
                <DataTable<CourseRecord>
                    title='Courses'
                    data={courses.data}
                    columns={columns}
                    pagination={courses}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Search courses...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={CourseController.index}
                    resetRoute={CourseController.index().url}
                    emptyMessage='No courses found'
                    emptyDescription='Try adjusting your filters or create a new course'
                />
            </div>
        </AppLayout>
    );
}
