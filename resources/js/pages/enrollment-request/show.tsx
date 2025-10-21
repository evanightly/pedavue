import type { PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export type EnrollmentRequestRecord = App.Data.EnrollmentRequest.EnrollmentRequestData;

export type EnrollmentRequestCollection = PaginationMeta & {
    data: App.Data.EnrollmentRequest.EnrollmentRequestData[];
};

interface EnrollmentRequestShowProps {
    record: EnrollmentRequestRecord;
}

export default function EnrollmentRequestShow({ record }: EnrollmentRequestShowProps) {
    return (
        <AppLayout>
            <Head title='Enrollment Request' />
            <div className='container mx-auto space-y-8 py-8'>
                <h1 className='text-2xl font-semibold'>Enrollment Request</h1>
                <div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
                    <dl className='divide-y divide-border'>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>ID</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.id}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Message</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.message}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Status</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.status}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>User</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.user?.name}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Course</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.course?.title}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Created At</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.created_at_formatted}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Updated At</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{record.updated_at_formatted}</div>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
