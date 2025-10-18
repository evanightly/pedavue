import CourseController from '@/actions/App/Http/Controllers/CourseController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Award, BookOpen, Calendar, Clock, Trash2, User } from 'lucide-react';
import { useMemo, useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseShowProps {
    record: CourseRecord;
}

export default function CourseShow({ record }: CourseShowProps) {
    const courseSlug = typeof record.slug === 'string' ? record.slug : String(record.slug ?? '');
    const instructors = useMemo(() => (Array.isArray(record.course_instructors) ? record.course_instructors : []), [record.course_instructors]);
    const instructorIds = useMemo(() => {
        if (!Array.isArray(record.instructor_ids)) {
            return [] as number[];
        }

        return record.instructor_ids
            .map((value) => {
                if (typeof value === 'number') {
                    return value;
                }

                const parsed = Number.parseInt(String(value), 10);
                return Number.isNaN(parsed) ? null : parsed;
            })
            .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
    }, [record.instructor_ids]);

    const [pendingInstructorId, setPendingInstructorId] = useState<number | string | null>(null);
    const [isAttaching, setIsAttaching] = useState(false);
    const [removingInstructorId, setRemovingInstructorId] = useState<number | null>(null);
    const certificatePreviewName = useMemo(() => {
        const base = 'Nama Lengkap Peserta';
        const limit = typeof record.certificate_name_max_length === 'number' ? record.certificate_name_max_length : null;

        if (!limit || limit <= 0) {
            return base;
        }

        return base.slice(0, limit);
    }, [record.certificate_name_max_length]);
    const certificatePosition = useMemo(() => {
        const x = typeof record.certificate_name_position_x === 'number' ? record.certificate_name_position_x : null;
        const y = typeof record.certificate_name_position_y === 'number' ? record.certificate_name_position_y : null;

        return {
            x,
            y,
            previewX: x ?? 50,
            previewY: y ?? 50,
        };
    }, [record.certificate_name_position_x, record.certificate_name_position_y]);
    const hasCertificateTemplate = Boolean(record.certification_enabled && record.certificate_template_url);

    const fetchUserOptions = async ({ search }: { search?: string }) => {
        const params: Record<string, unknown> = {};

        if (search && search.trim().length > 0) {
            params['filter[search]'] = search.trim();
        }

        const response = await axios.get(UserController.index().url, { params });

        return response;
    };

    const handleAttachInstructor = (value: number | string | null) => {
        if (value === null) {
            setPendingInstructorId(null);
            return;
        }

        const numeric = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

        if (!Number.isFinite(numeric) || numeric <= 0) {
            setPendingInstructorId(null);
            return;
        }

        if (instructorIds.includes(numeric)) {
            setPendingInstructorId(null);
            return;
        }

        setPendingInstructorId(numeric);
        setIsAttaching(true);

        router.post(
            CourseController.attachInstructor.url(courseSlug),
            { instructor_id: numeric },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsAttaching(false);
                    setPendingInstructorId(null);
                },
            },
        );
    };

    const handleDetachInstructor = (value: number | string) => {
        if (instructors.length <= 1) {
            return;
        }

        const numeric = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

        if (!Number.isFinite(numeric) || numeric <= 0) {
            return;
        }

        setRemovingInstructorId(numeric);

        router.delete(CourseController.detachInstructor.url({ course: courseSlug, instructor: numeric }), {
            preserveScroll: true,
            onFinish: () => {
                setRemovingInstructorId(null);
            },
        });
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
                                {instructors.length > 0 && (
                                    <div className='flex items-center gap-3'>
                                        <div className='flex -space-x-2'>
                                            {instructors.slice(0, 3).map((instructor) =>
                                                instructor && typeof instructor === 'object' && 'id' in instructor ? (
                                                    instructor.avatar_url ? (
                                                        <img
                                                            key={`instructor-avatar-${String(instructor.id)}`}
                                                            src={String(instructor.avatar_url)}
                                                            alt={String(instructor.name ?? 'Instruktur')}
                                                            className='h-8 w-8 rounded-full border-2 border-background object-cover shadow-sm'
                                                        />
                                                    ) : (
                                                        <div
                                                            key={`instructor-avatar-${String(instructor.id)}`}
                                                            className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-primary shadow-sm'
                                                        >
                                                            <User className='h-4 w-4' />
                                                        </div>
                                                    )
                                                ) : null,
                                            )}
                                            {instructors.length > 3 ? (
                                                <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-foreground shadow-sm'>
                                                    +{instructors.length - 3}
                                                </div>
                                            ) : null}
                                        </div>
                                        <span className='text-sm font-medium text-foreground'>
                                            {instructors.length === 1
                                                ? String((instructors[0] as { name?: string }).name ?? 'Instruktur')
                                                : `${instructors.length} instruktur`}
                                        </span>
                                    </div>
                                )}
                                {record.duration_formatted && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <Clock className='h-4 w-4' />
                                        <span className='text-sm font-medium'>{record.duration_formatted}</span>
                                    </div>
                                )}
                                {record.created_at_formatted && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <Calendar className='h-4 w-4' />
                                        <span className='text-sm font-medium'>Dibuat {record.created_at_formatted}</span>
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
                                {record.duration_formatted && (
                                    <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Durasi Total</dt>
                                        <dd className='text-sm font-medium'>{record.duration_formatted}</dd>
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
                                {record.created_at_formatted && (
                                    <div className='flex items-center justify-between border-b border-border/50 py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Dibuat</dt>
                                        <dd className='text-sm'>{record.created_at_formatted}</dd>
                                    </div>
                                )}
                                {record.updated_at_formatted && (
                                    <div className='flex items-center justify-between py-2'>
                                        <dt className='text-sm font-medium text-muted-foreground'>Terakhir Diperbarui</dt>
                                        <dd className='text-sm'>{record.updated_at_formatted}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Certificate Preview */}
                    {hasCertificateTemplate ? (
                        <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                            <div className='space-y-6'>
                                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                    <div>
                                        <h3 className='text-lg font-semibold'>Pratinjau Sertifikat</h3>
                                        <p className='text-sm text-muted-foreground'>
                                            Posisi nama peserta dapat disesuaikan melalui halaman edit kursus.
                                        </p>
                                    </div>
                                    <span className='inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                                        Aktif
                                    </span>
                                </div>
                                <div className='relative overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted/20 p-3'>
                                    <div className='relative mx-auto w-full max-w-3xl'>
                                        <img
                                            src={record.certificate_template_url as string}
                                            alt='Template Sertifikat Kursus'
                                            className='h-full w-full rounded-lg object-contain'
                                        />
                                        <div
                                            className='absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-lg'
                                            style={{ left: `${certificatePosition.previewX}%`, top: `${certificatePosition.previewY}%` }}
                                        >
                                            {certificatePreviewName}
                                        </div>
                                    </div>
                                </div>
                                <dl className='grid gap-4 text-sm text-muted-foreground sm:grid-cols-3'>
                                    <div>
                                        <dt className='font-medium text-foreground'>Batas Karakter</dt>
                                        <dd>{record.certificate_name_max_length ?? 'Tidak diatur'}</dd>
                                    </div>
                                    <div>
                                        <dt className='font-medium text-foreground'>Posisi Horizontal</dt>
                                        <dd>
                                            {certificatePosition.x ?? 'Belum diatur'}
                                            {certificatePosition.x !== null ? '%' : ''}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className='font-medium text-foreground'>Posisi Vertikal</dt>
                                        <dd>
                                            {certificatePosition.y ?? 'Belum diatur'}
                                            {certificatePosition.y !== null ? '%' : ''}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    ) : record.certification_enabled ? (
                        <div className='rounded-2xl border border-dashed bg-card/40 p-6 text-sm text-muted-foreground shadow-inner'>
                            Sertifikat diaktifkan, tetapi template belum diunggah. Unggah template di halaman edit kursus untuk menampilkan pratinjau.
                        </div>
                    ) : null}

                    {/* Instructors Management */}
                    <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div>
                                <h3 className='text-lg font-semibold'>Instruktur</h3>
                                <p className='text-sm text-muted-foreground'>Kelola instruktur yang mengajar kursus ini.</p>
                            </div>
                            <GenericDataSelector<App.Data.User.UserData>
                                id='attach-instructor-selector'
                                placeholder={isAttaching ? 'Menambahkan…' : 'Tambah instruktur'}
                                fetchData={fetchUserOptions}
                                dataMapper={(response) => response.data.users.data}
                                selectedDataId={pendingInstructorId}
                                setSelectedData={handleAttachInstructor}
                                buttonClassName={`w-full sm:w-auto ${isAttaching ? 'pointer-events-none opacity-60' : ''}`}
                                renderItem={(item) => String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)}
                                disabledSearchState={isAttaching}
                            />
                        </div>
                        <ul className='mt-6 space-y-3'>
                            {instructors.length === 0 ? (
                                <li className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                                    Belum ada instruktur yang terdaftar.
                                </li>
                            ) : (
                                instructors.map((instructor) => {
                                    if (!instructor || typeof instructor !== 'object') {
                                        return null;
                                    }

                                    const identifier = 'id' in instructor ? Number(instructor.id) : null;
                                    const displayName = 'name' in instructor ? String(instructor.name ?? 'Instruktur') : 'Instruktur';
                                    const email = 'email' in instructor ? String(instructor.email ?? '') : '';
                                    const avatarUrl = 'avatar_url' in instructor ? String(instructor.avatar_url ?? '') : '';

                                    return (
                                        <li
                                            key={`course-instructor-${String(identifier ?? displayName)}`}
                                            className='flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3 shadow-sm'
                                        >
                                            <div className='flex items-center gap-3'>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className='h-9 w-9 rounded-full object-cover' />
                                                ) : (
                                                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
                                                        <User className='h-4 w-4' />
                                                    </div>
                                                )}
                                                <div className='flex flex-col'>
                                                    <span className='text-sm font-medium text-foreground'>{displayName}</span>
                                                    {email ? <span className='text-xs text-muted-foreground'>{email}</span> : null}
                                                </div>
                                            </div>
                                            {identifier ? (
                                                <Button
                                                    type='button'
                                                    variant='ghost'
                                                    size='sm'
                                                    className='gap-2 text-destructive hover:text-destructive'
                                                    onClick={() => handleDetachInstructor(identifier)}
                                                    disabled={removingInstructorId === identifier || instructors.length <= 1}
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                    Hapus
                                                </Button>
                                            ) : null}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
