import CourseController from '@/actions/App/Http/Controllers/CourseController';
import EnrollmentRequestController from '@/actions/App/Http/Controllers/EnrollmentRequestController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { confirm } from '@/lib/confirmation-utils';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export type EnrollmentRequestRecord = App.Data.EnrollmentRequest.EnrollmentRequestData;

export type EnrollmentRequestCollection = PaginationMeta & {
    data: App.Data.EnrollmentRequest.EnrollmentRequestData[];
};

interface EnrollmentRequestIndexProps {
    enrollmentRequests: EnrollmentRequestCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    filteredData?: Record<string, unknown> | null;
    abilities?: {
        can_manage?: boolean;
        can_create?: boolean;
        is_student?: boolean;
    } | null;
}

export default function EnrollmentRequestIndex({
    enrollmentRequests,
    filters = null,
    sort = null,
    filteredData: initialFilteredData = null,
    abilities = null,
}: EnrollmentRequestIndexProps) {
    const resolveDestroyUrl = useCallback((id: number) => EnrollmentRequestController.destroy(id).url, []);
    const handleDelete = useCallback(
        (id: number) => {
            confirm.delete('Tindakan ini tidak bisa dibatalkan. Hapus permintaan pendaftaran ini?', () => {
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
    const canManageRequests = abilities?.can_manage ?? false;
    const canCreateRequest = abilities?.can_create ?? false;
    const columnFilters =
        filters?.columnFilters && typeof filters.columnFilters === 'object' && !Array.isArray(filters.columnFilters)
            ? (filters.columnFilters as Record<string, unknown>)
            : {};

    const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState<EnrollmentRequestRecord | null>(null);
    const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

    const openVerificationDialog = useCallback((record: EnrollmentRequestRecord) => {
        setActiveRequest(record);
        setVerificationDialogOpen(true);
    }, []);

    const closeVerificationDialog = useCallback(() => {
        setVerificationDialogOpen(false);
        setActiveRequest(null);
        setPendingAction(null);
    }, []);

    const handleStatusChange = useCallback(
        (action: 'approve' | 'reject') => {
            if (!activeRequest) {
                return;
            }

            setPendingAction(action);

            const routeDefinition =
                action === 'approve' ? EnrollmentRequestController.approve(activeRequest.id) : EnrollmentRequestController.reject(activeRequest.id);

            router.patch(
                routeDefinition.url,
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        setPendingAction(null);
                    },
                    onSuccess: () => {
                        closeVerificationDialog();
                    },
                },
            );
        },
        [activeRequest, closeVerificationDialog],
    );

    const columns = useMemo<(ColumnDef<EnrollmentRequestRecord> & ColumnFilterMeta)[]>(
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
                id: 'message',
                accessorKey: 'message',
                header: 'Pesan',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter pesan...' },
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Filter status...' },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: 'Dibuat pada',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter tanggal dibuat...' },
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: 'Diperbarui pada',
                cell: ({ getValue }) => {
                    const value = getValue() as unknown;
                    if (value === null || value === undefined) {
                        return '—';
                    }
                    return String(value);
                },
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'daterange', placeholder: 'Filter tanggal diperbarui...' },
            },
            {
                id: 'user_id',
                accessorKey: 'user_id',
                header: 'Pengguna',
                enableSorting: false,
                enableFiltering: true,
                filterOnly: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter pengguna...',
                    searchPlaceholder: 'Cari pengguna...',
                    fetchDataUrl: UserController.index().url,
                    valueMapKey: 'userOptions',
                    idField: 'id',
                    labelField: 'name',
                },
            },
            {
                id: 'course_id',
                accessorKey: 'course_id',
                header: 'Kursus',
                enableSorting: false,
                enableFiltering: true,
                filterOnly: true,
                filter: {
                    type: 'selector',
                    placeholder: 'Filter kursus...',
                    searchPlaceholder: 'Cari kursus...',
                    fetchDataUrl: CourseController.index().url,
                    valueMapKey: 'courseOptions',
                    idField: 'id',
                    labelField: 'name',
                },
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
                                    <span className='sr-only'>Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-40'>
                                {canManageRequests ? (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openVerificationDialog(row.original);
                                        }}
                                        className='flex items-center gap-2 text-sm'
                                    >
                                        Verifikasi
                                    </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem asChild>
                                    <Link href={EnrollmentRequestController.show(row.original.id).url} className='flex items-center gap-2 text-sm'>
                                        Lihat
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={EnrollmentRequestController.edit(row.original.id).url} className='flex items-center gap-2 text-sm'>
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
        [canManageRequests, handleDelete, openVerificationDialog],
    );

    return (
        <AppLayout>
            <Head title='Permintaan Pendaftaran' />
            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight'>Permintaan Pendaftaran</h1>
                        <p className='text-muted-foreground'>Kelola permintaan pendaftaran dalam satu tempat.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        {canCreateRequest ? (
                            <Button asChild>
                                <Link href={EnrollmentRequestController.create().url}>Permintaan Pendaftaran Baru</Link>
                            </Button>
                        ) : null}
                    </div>
                </div>
                <DataTable<EnrollmentRequestRecord>
                    title='Permintaan Pendaftaran'
                    data={enrollmentRequests.data}
                    columns={columns}
                    pagination={enrollmentRequests}
                    filters={{
                        search: searchValue,
                        sort: activeSort,
                        columnFilters,
                    }}
                    filteredData={filteredData}
                    searchPlaceholder='Cari permintaan pendaftaran...'
                    enableSearch
                    enableColumnFilters
                    enableMultiSort
                    routeFunction={EnrollmentRequestController.index}
                    resetRoute={EnrollmentRequestController.index().url}
                    emptyMessage='Tidak ada permintaan pendaftaran'
                    emptyDescription='Coba ubah filter atau buat permintaan pendaftaran baru'
                />
            </div>
            <Dialog
                open={verificationDialogOpen}
                onOpenChange={(open) => {
                    if (open) {
                        setVerificationDialogOpen(true);
                    } else {
                        closeVerificationDialog();
                    }
                }}
            >
                <DialogContent showCloseIcon className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>Verifikasi permintaan pendaftaran</DialogTitle>
                        <DialogDescription>Periksa detail permintaan sebelum mengambil tindakan.</DialogDescription>
                    </DialogHeader>
                    {activeRequest ? (
                        <div className='space-y-6'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <Badge variant='outline' className='tracking-wide uppercase'>
                                    {activeRequest.status ?? 'Tidak diketahui'}
                                </Badge>
                                {activeRequest.created_at_formatted ? (
                                    <span className='text-sm text-muted-foreground'>Dibuat pada {activeRequest.created_at_formatted}</span>
                                ) : null}
                            </div>

                            <div className='space-y-4 rounded-lg border border-border p-4'>
                                <div>
                                    <h3 className='text-sm font-semibold text-muted-foreground'>Informasi kursus</h3>
                                    <p className='text-base font-medium text-foreground'>
                                        {activeRequest.course?.title ?? activeRequest.course_title ?? 'Kursus tidak tersedia'}
                                    </p>
                                    {activeRequest.course?.level ? (
                                        <p className='text-sm text-muted-foreground'>Tingkat: {activeRequest.course.level}</p>
                                    ) : null}
                                    {activeRequest.course?.duration_formatted ? (
                                        <p className='text-sm text-muted-foreground'>Durasi: {activeRequest.course.duration_formatted}</p>
                                    ) : null}
                                </div>

                                <Separator />

                                <div className='space-y-2'>
                                    <h3 className='text-sm font-semibold text-muted-foreground'>Informasi pengguna</h3>
                                    <p className='text-base font-medium text-foreground'>
                                        {activeRequest.user?.name ?? activeRequest.user_name ?? 'Pengguna tidak tersedia'}
                                    </p>
                                    {activeRequest.user?.email ? <p className='text-sm text-muted-foreground'>{activeRequest.user.email}</p> : null}
                                    {activeRequest.user_created_at_formatted ? (
                                        <p className='text-sm text-muted-foreground'>Bergabung pada {activeRequest.user_created_at_formatted}</p>
                                    ) : null}
                                </div>

                                <Separator />

                                <div className='space-y-2'>
                                    <h3 className='text-sm font-semibold text-muted-foreground'>Pesan pendaftaran</h3>
                                    <p className='text-sm leading-relaxed text-foreground'>
                                        {activeRequest.message && activeRequest.message.trim().length > 0
                                            ? activeRequest.message
                                            : 'Tidak ada pesan yang diberikan.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type='button' variant='outline' disabled={pendingAction !== null}>
                                Tutup
                            </Button>
                        </DialogClose>
                        <Button
                            type='button'
                            variant='destructive'
                            disabled={pendingAction === 'approve' || !canManageRequests || (activeRequest?.status ?? '') !== 'Pending'}
                            onClick={() => handleStatusChange('reject')}
                            className='gap-2'
                        >
                            {pendingAction === 'reject' ? <Spinner className='h-4 w-4' /> : null}
                            Tolak
                        </Button>
                        <Button
                            type='button'
                            disabled={pendingAction === 'reject' || !canManageRequests || (activeRequest?.status ?? '') !== 'Pending'}
                            onClick={() => handleStatusChange('approve')}
                            className='gap-2'
                        >
                            {pendingAction === 'approve' ? <Spinner className='h-4 w-4' /> : null}
                            Setujui
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
