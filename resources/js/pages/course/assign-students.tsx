import CourseController from '@/actions/App/Http/Controllers/CourseController';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnFilterMeta, DataTableBulkAction, DataTableFilters, PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Users } from 'lucide-react';
import { useCallback, useMemo } from 'react';

type StudentRecord = App.Data.User.UserData;

type StudentsCollection = PaginationMeta & {
    data: StudentRecord[];
};

type AssignStudentsProps = {
    course: App.Data.Course.CourseData;
    students: StudentsCollection;
    filters?: DataTableFilters | null;
    sort?: string | null;
    abilities?: {
        assign_students?: boolean;
    } | null;
};

export default function AssignStudentsPage({ course, students, filters = null, sort = null, abilities = null }: AssignStudentsProps) {
    const courseSlug = typeof course.slug === 'string' ? course.slug : String(course.slug ?? '');
    const canAssign = Boolean(abilities?.assign_students);

    const baseFilters = filters ?? {};
    const searchValue = typeof baseFilters.search === 'string' ? baseFilters.search : '';
    const activeSort = typeof sort === 'string' ? sort : undefined;

    const handleBulkAssign = useCallback(
        (selected: StudentRecord[]) => {
            if (!canAssign || selected.length === 0) {
                return;
            }

            const userIds = selected
                .map((student) => {
                    const rawId = (student as any)?.id ?? null;
                    if (typeof rawId === 'number') {
                        return rawId;
                    }

                    const parsed = Number.parseInt(String(rawId ?? ''), 10);
                    return Number.isFinite(parsed) ? parsed : null;
                })
                .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0);

            if (userIds.length === 0) {
                return;
            }

            router.post(
                CourseController.assignStudents.url({ course: courseSlug }),
                { user_ids: userIds },
                {
                    preserveScroll: true,
                },
            );
        },
        [canAssign, courseSlug],
    );

    const columns = useMemo<(ColumnDef<StudentRecord> & ColumnFilterMeta)[]>(
        () => [
            {
                id: 'name',
                accessorKey: 'name',
                header: 'Nama Lengkap',
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Cari berdasarkan nama...' },
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: 'Email',
                enableSorting: true,
                enableFiltering: true,
                filter: { type: 'text', placeholder: 'Cari berdasarkan email...' },
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (value === null || value === undefined) {
                        return '—';
                    }

                    return String(value);
                },
            },
        ],
        [],
    );

    const bulkActions = useMemo<DataTableBulkAction<StudentRecord>[]>(
        () =>
            canAssign
                ? [
                      ({ selectedRows }) => (
                          <Button key='assign-students' size='sm' onClick={() => handleBulkAssign(selectedRows)} disabled={selectedRows.length === 0}>
                              Tambahkan {selectedRows.length} siswa
                          </Button>
                      ),
                  ]
                : [],
        [canAssign, handleBulkAssign],
    );

    return (
        <AppLayout>
            <Head title={`Kelola Peserta · ${course.title ?? 'Kursus'}`} />

            <div className='container mx-auto py-8'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Users className='h-4 w-4' />
                            <span>Manajemen Peserta Kursus</span>
                        </div>
                        <h1 className='text-3xl font-bold tracking-tight'>{course.title ?? 'Kursus'}</h1>
                        <p className='text-sm text-muted-foreground'>Pilih beberapa siswa sekaligus untuk didaftarkan ke kursus ini.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
                        <Button variant='ghost' size='sm' asChild className='gap-2'>
                            <Link href={CourseController.show.url({ course: courseSlug })}>
                                <ArrowLeft className='h-4 w-4' />
                                Kembali ke detail kursus
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className='mt-6 rounded-xl border bg-card p-6 shadow-sm'>
                    <DataTable<StudentRecord>
                        title='Siswa Belum Terdaftar'
                        description='Daftar siswa berperan sebagai Student yang belum terdaftar pada kursus ini.'
                        data={students.data}
                        columns={columns}
                        actionBulkButtons={bulkActions}
                        pagination={students}
                        filters={{
                            search: searchValue,
                            sort: activeSort,
                        }}
                        searchPlaceholder='Cari siswa...'
                        enableSearch
                        enableColumnFilters
                        enableMultiSort={false}
                        routeFunction={() => CourseController.students({ course: courseSlug })}
                        resetRoute={CourseController.students.url({ course: courseSlug })}
                        emptyMessage='Tidak ada siswa tersedia'
                        emptyDescription='Seluruh siswa sudah terdaftar pada kursus ini atau belum ada siswa dengan peran Student.'
                    />
                </div>
            </div>
        </AppLayout>
    );
}
