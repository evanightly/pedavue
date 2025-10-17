import type { PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseShowProps {
    record: CourseRecord;
}

export default function CourseShow({ record }: CourseShowProps) {
    return (
        <AppLayout>
            <Head title='Course' />
            <div className='mx-auto max-w-3xl space-y-6 py-6'>
                <h1 className='text-2xl font-semibold'>Course</h1>
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
                            <dt className='text-sm font-medium text-muted-foreground'>Title</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.title === null || record.title === undefined
                                        ? '—'
                                        : typeof record.title === 'object'
                                          ? JSON.stringify(record.title, null, 2)
                                          : String(record.title)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Slug</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.slug === null || record.slug === undefined
                                        ? '—'
                                        : typeof record.slug === 'object'
                                          ? JSON.stringify(record.slug, null, 2)
                                          : String(record.slug)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Description</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.description === null || record.description === undefined
                                        ? '—'
                                        : typeof record.description === 'object'
                                          ? JSON.stringify(record.description, null, 2)
                                          : String(record.description)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Certification Enabled</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.certification_enabled === null || record.certification_enabled === undefined
                                        ? '—'
                                        : typeof record.certification_enabled === 'object'
                                          ? JSON.stringify(record.certification_enabled, null, 2)
                                          : String(record.certification_enabled)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Thumbnail</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.thumbnail === null || record.thumbnail === undefined
                                        ? '—'
                                        : typeof record.thumbnail === 'object'
                                          ? JSON.stringify(record.thumbnail, null, 2)
                                          : String(record.thumbnail)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Level</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.level === null || record.level === undefined
                                        ? '—'
                                        : typeof record.level === 'object'
                                          ? JSON.stringify(record.level, null, 2)
                                          : String(record.level)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Duration</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.duration === null || record.duration === undefined
                                        ? '—'
                                        : typeof record.duration === 'object'
                                          ? JSON.stringify(record.duration, null, 2)
                                          : String(record.duration)}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Instructor</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.instructor_id === null || record.instructor_id === undefined
                                        ? '—'
                                        : typeof record.instructor_id === 'object'
                                          ? JSON.stringify(record.instructor_id, null, 2)
                                          : String(record.instructor_id)}
                                </div>
                            </dd>
                        </div>
                        {/* <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Modules</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.module_ids === null || record.module_ids === undefined
                                        ? '—'
                                        : typeof record.module_ids === 'object'
                                          ? JSON.stringify(record.module_ids, null, 2)
                                          : String(record.module_ids)}
                                </div>
                            </dd>
                        </div> */}
                        {/* <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Quizzes</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.quiz_ids === null || record.quiz_ids === undefined ? '—' : typeof record.quiz_ids === 'object' ? JSON.stringify(record.quiz_ids, null, 2) : String(record.quiz_ids)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Enrollments</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.enrollment_ids === null || record.enrollment_ids === undefined ? '—' : typeof record.enrollment_ids === 'object' ? JSON.stringify(record.enrollment_ids, null, 2) : String(record.enrollment_ids)}
                </div>
              </dd>
            </div>
            <div className="grid gap-2 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">Certificates</dt>
              <dd className="sm:col-span-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {record.certificate_ids === null || record.certificate_ids === undefined ? '—' : typeof record.certificate_ids === 'object' ? JSON.stringify(record.certificate_ids, null, 2) : String(record.certificate_ids)}
                </div>
              </dd>
            </div> */}
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
