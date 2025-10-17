import CourseController from '@/actions/App/Http/Controllers/CourseController';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, BookOpen, Calendar, Clock, User } from 'lucide-react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseShowProps {
    record: CourseRecord;
}

export default function CourseShow({ record }: CourseShowProps) {
    const formatDuration = (minutes: number | string | null | undefined) => {
        if (!minutes) return null;
        const numMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
        if (isNaN(numMinutes)) return null;
        const hours = Math.floor(numMinutes / 60);
        const mins = numMinutes % 60;
        if (hours > 0 && mins > 0) return `${hours} jam ${mins} menit`;
        if (hours > 0) return `${hours} jam`;
        return `${mins} menit`;
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <AppLayout>
            <Head title={record.title || 'Detail Kursus'} />

            {/* Hero Section with Thumbnail */}
            <div className='relative'>
                {record.thumbnail ? (
                    <div className='relative h-[400px] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background'>
                        <div className='absolute inset-0 z-10 bg-gradient-to-t from-background via-background/80 to-transparent' />
                        <img
                            src={record.thumbnail.startsWith('http') ? record.thumbnail : `/storage/${record.thumbnail}`}
                            alt={record.title || 'Course Thumbnail'}
                            className='h-full w-full object-cover opacity-40'
                        />
                    </div>
                ) : (
                    <div className='relative h-[300px] w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background' />
                )}

                {/* Back Button */}
                <div className='absolute top-8 left-8 z-20'>
                    <Button variant='secondary' size='sm' asChild className='gap-2 bg-background/80 shadow-lg backdrop-blur-sm'>
                        <Link href={CourseController.index().url}>
                            <ArrowLeft className='h-4 w-4' />
                            Kembali
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className='relative z-10 mx-auto -mt-32 max-w-5xl px-4 pb-12'>
                <div className='space-y-8'>
                    {/* Title Card */}
                    <div className='rounded-2xl border bg-card p-8 shadow-2xl md:p-10'>
                        <div className='space-y-6'>
                            {/* Title & Level */}
                            <div className='space-y-4'>
                                <div className='flex flex-wrap items-center gap-3'>
                                    {record.level && (
                                        <span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/20 ring-inset'>
                                            <BookOpen className='h-3.5 w-3.5' />
                                            {record.level}
                                        </span>
                                    )}
                                    {record.certification_enabled && (
                                        <span className='inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 ring-1 ring-green-500/20 ring-inset dark:text-green-400'>
                                            <Award className='h-3.5 w-3.5' />
                                            Bersertifikat
                                        </span>
                                    )}
                                </div>
                                <h1 className='bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight md:text-5xl'>
                                    {record.title || 'Untitled Course'}
                                </h1>
                            </div>

                            {/* Meta Information */}
                            <div className='flex flex-wrap items-center gap-6 pt-2'>
                                {record.instructor && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <User className='h-4 w-4' />
                                        <span className='text-sm font-medium'>
                                            {typeof record.instructor === 'object' && 'name' in record.instructor
                                                ? record.instructor.name
                                                : 'Instruktur'}
                                        </span>
                                    </div>
                                )}
                                {record.duration && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <Clock className='h-4 w-4' />
                                        <span className='text-sm font-medium'>{formatDuration(record.duration)}</span>
                                    </div>
                                )}
                                {record.created_at && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <Calendar className='h-4 w-4' />
                                        <span className='text-sm font-medium'>Dibuat {formatDate(record.created_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    {record.description && (
                        <div className='rounded-2xl border bg-card p-8 shadow-lg md:p-10'>
                            <div className='space-y-4'>
                                <h2 className='text-2xl font-semibold tracking-tight'>Tentang Kursus</h2>
                                <div
                                    className='prose prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-pre:border prose-pre:bg-muted'
                                    dangerouslySetInnerHTML={{ __html: record.description }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Additional Info Grid */}
                    <div className='grid gap-6 md:grid-cols-2'>
                        {/* Course Details Card */}
                        <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                            <h3 className='mb-4 text-lg font-semibold'>Detail Kursus</h3>
                            <dl className='space-y-3'>
                                <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                    <dt className='text-sm font-medium text-muted-foreground'>ID Kursus</dt>
                                    <dd className='font-mono text-sm'>{record.id}</dd>
                                </div>
                                <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                    <dt className='text-sm font-medium text-muted-foreground'>Slug</dt>
                                    <dd className='text-right font-mono text-sm break-all'>{record.slug}</dd>
                                </div>
                                {record.duration && (
                                    <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Durasi Total</dt>
                                        <dd className='text-sm font-medium'>{formatDuration(record.duration)}</dd>
                                    </div>
                                )}
                                {record.level && (
                                    <div className='flex items-center justify-between py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Tingkat Kesulitan</dt>
                                        <dd className='text-sm font-medium'>{record.level}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Timeline Card */}
                        <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                            <h3 className='mb-4 text-lg font-semibold'>Timeline</h3>
                            <dl className='space-y-3'>
                                {record.created_at && (
                                    <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Dibuat</dt>
                                        <dd className='text-sm'>{formatDate(record.created_at)}</dd>
                                    </div>
                                )}
                                {record.updated_at && (
                                    <div className='flex items-center justify-between py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Terakhir Diperbarui</dt>
                                        <dd className='text-sm'>{formatDate(record.updated_at)}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
