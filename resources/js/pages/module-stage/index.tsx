import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import AppLayout from '@/layouts/app-layout';
// import ModuleQuizController from '@/actions/App/Http/Controllers/ModuleQuizController';
import ModuleStageController from '@/actions/App/Http/Controllers/ModuleStageController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { confirm } from '@/lib/confirmation-utils';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { MODULEABLE_OPTIONS } from './constants';

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

export default function ModuleStageIndex({
    moduleStages,
    filters = null,
    sort = null,
    filteredData: initialFilteredData = null,
}: ModuleStageIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => ModuleStageController.destroy(id).url, []);
    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete('Tindakan ini tidak dapat dibatalkan. Hapus tahap modul ini?', () => {
                router.delete(resolveDestroyUrl(id), {
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
    const columns = useMemo<(ColumnDef<ModuleStageRecord> & ColumnFilterMeta)[]>(
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
                id: 'module_id',
                accessorFn: (row) => row.module?.name ?? null,
                header: 'Modul',
                cell: ({ row }) => {
                    const module = row.original.module as { id?: number | string; name?: string } | null;

                    if (!module) {
                        return '—';
                    }

                    return (
                        <div className='space-y-0.5'>
                            <span className='text-sm font-medium text-foreground'>{module.name ?? `ID ${module.id}`}</span>
                            {module?.id !== undefined ? <span className='text-xs text-muted-foreground'>ID: {module.id}</span> : null}
                        </div>
                    );
                },
                enableSorting: false,
                enableFiltering: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Saring berdasarkan modul...',
                    searchPlaceholder: 'Cari modul...',
                    fetchDataUrl: ModuleController.index().url,
                    valueMapKey: 'moduleOptions',
                    idField: 'id',
                    labelField: 'name',
                },
            },
            {
                id: 'module_able',
                accessorKey: 'module_able',
                header: 'Tipe Tahap',
                cell: ({ getValue }) => {
                    const value = getValue() as string | null | undefined;

                    if (!value) {
                        return '—';
                    }

                    const option = MODULEABLE_OPTIONS.find((item) => item.key === value);

                    return option ? option.label : value;
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Saring tipe tahap...' },
            },
            {
                id: 'module_able_type',
                accessorKey: 'module_able_type',
                header: 'Kelas Tahap',
                cell: ({ getValue }) => {
                    const value = getValue() as string | null | undefined;

                    if (!value) {
                        return '—';
                    }

                    const option = MODULEABLE_OPTIONS.find((item) => item.fqcn === value);

                    return (
                        <div className='space-y-0.5'>
                            <span className='text-sm font-medium text-foreground'>{option?.label ?? value}</span>
                            {option ? <span className='text-xs text-muted-foreground'>{value}</span> : null}
                        </div>
                    );
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Saring kelas tahap...' },
            },
            {
                id: 'module_able_id',
                accessorKey: 'module_able_id',
                header: 'ID Tahap Terkait',
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
                filter: { type: 'number', placeholder: 'Saring ID tahap...' },
            },
            {
                id: 'order',
                accessorKey: 'order',
                header: 'Urutan',
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
                filter: { type: 'number', placeholder: 'Saring urutan...' },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: 'Dibuat Pada',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Saring tanggal dibuat...' },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: 'Diperbarui Pada',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Saring tanggal diperbarui...' },
            },
            {
                id: 'actions',
                header: 'Aksi',
                cell: ({ row }) => (
                    <div className='flex justify-end'>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                    <span className='sr-only'>Buka menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem asChild>
                                    <Link href={ModuleStageController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Lihat
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={ModuleStageController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Ubah
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        handleDelete(row.original.id);
                                    }}
                                    className='flex items-center gap-2 text-sm text-destructive focus:text-destructive'
                                >
                                    Hapus
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
            <Head title='Tahap Modul' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Tahap Modul</h1>
                        <p className='text-muted-foreground'>Kelola seluruh tahap modul pada satu tempat.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button asChild>
                            <Link href={ModuleStageController.create().url}>Tambah Tahap Modul</Link>
                        </Button>
                    </div>
                </div>
                <DataTable<ModuleStageRecord>
                    title='Tahap Modul'
                    data={moduleStages.data}
                    columns={columns}
                    pagination={moduleStages}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Cari tahap modul...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={ModuleStageController.index}
                    resetRoute={ModuleStageController.index().url}
                    emptyMessage='Tahap modul tidak ditemukan'
                    emptyDescription='Sesuaikan filter atau buat tahap modul baru.'
                />
            </div>
        </AppLayout>
    );
}
