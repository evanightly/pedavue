import type { PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export type RoleRecord = App.Data.Role.RoleData;

export type RoleCollection = PaginationMeta & {
    data: App.Data.Role.RoleData[];
};

interface RoleShowProps {
    record: RoleRecord;
}

export default function RoleShow({ record }: RoleShowProps) {
    return (
        <AppLayout>
            <Head title='Role' />
            <div className='mx-auto max-w-3xl space-y-6 py-6'>
                <h1 className='text-2xl font-semibold'>Role</h1>
                <div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
                    <dl className='divide-y divide-border'>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>ID</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.id === null || record.id === undefined
                                        ? '—'
                                        : typeof record.id === 'object'
                                          ? JSON.stringify(record.id, null, 2)
                                          : String(record.id)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Name</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.name === null || record.name === undefined
                                        ? '—'
                                        : typeof record.name === 'object'
                                          ? JSON.stringify(record.name, null, 2)
                                          : String(record.name)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Guard Name</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.guard_name === null || record.guard_name === undefined
                                        ? '—'
                                        : typeof record.guard_name === 'object'
                                          ? JSON.stringify(record.guard_name, null, 2)
                                          : String(record.guard_name)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Created At</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.created_at === null || record.created_at === undefined
                                        ? '—'
                                        : typeof record.created_at === 'object'
                                          ? JSON.stringify(record.created_at, null, 2)
                                          : String(record.created_at)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Updated At</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.updated_at === null || record.updated_at === undefined
                                        ? '—'
                                        : typeof record.updated_at === 'object'
                                          ? JSON.stringify(record.updated_at, null, 2)
                                          : String(record.updated_at)}
                                </div>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
