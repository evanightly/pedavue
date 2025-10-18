import CourseController from '@/actions/App/Http/Controllers/CourseController';
import EnrollmentRequestController from '@/actions/App/Http/Controllers/EnrollmentRequestController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import GuestLayout from '@/layouts/guest-layout';
import { login, register } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Award, BookOpen, Calendar, Clock, Trash2, User, UserPlus, Users } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData & {
    students?: App.Data.User.UserData[] | null;
};

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseShowProps {
    record: CourseRecord;
    abilities?: {
        assign_students?: boolean;
        unassign_students?: boolean;
    } | null;
    viewer?: {
        is_student?: boolean;
        is_enrolled?: boolean;
        can_request_enrollment?: boolean;
        latest_request?: App.Data.EnrollmentRequest.EnrollmentRequestData | null;
    } | null;
}

export default function CourseShow({ record, abilities = null, viewer = null }: CourseShowProps) {
    const page = usePage<{ auth: { user: App.Data.User.UserData | null } }>();
    const authUser = page.props.auth?.user ?? null;
    const courseSlug = typeof record.slug === 'string' ? record.slug : String(record.slug ?? '');
    const canAssignStudents = Boolean(abilities?.assign_students);
    const canUnassignStudents = Boolean(abilities?.unassign_students);
    const viewerState = viewer ?? null;
    const isStudentViewer = Boolean(viewerState?.is_student);
    const isGuestViewer = authUser === null;
    const isInstructorOrAdminViewer = Boolean(authUser && !isStudentViewer);
    const isEnrolledViewer = Boolean(viewerState?.is_enrolled);
    const canRequestEnrollment = Boolean(viewerState?.can_request_enrollment);
    const latestRequest = viewerState?.latest_request ?? null;
    const latestStatus = typeof latestRequest?.status === 'string' ? latestRequest.status : null;
    const hasPendingRequest = latestStatus === 'Pending';
    const hasApprovedRequest = latestStatus === 'Approved';
    const hasRejectedRequest = latestStatus === 'Rejected';
    const latestRequestCreatedAt = typeof latestRequest?.created_at_formatted === 'string' ? latestRequest.created_at_formatted : null;
    const instructors = useMemo(() => (Array.isArray(record.course_instructors) ? record.course_instructors : []), [record.course_instructors]);
    const students = useMemo<App.Data.User.UserData[]>(() => (Array.isArray(record.students) ? record.students : []), [record.students]);
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
    const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
    const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
    const enrollmentForm = useForm({
        message: '',
    });
    const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);
    const enrollmentRedirectPath = useMemo(() => CourseController.show.url({ course: courseSlug }, { query: { enroll: '1' } }), [courseSlug]);
    const registerUrl = useMemo(() => {
        const identifier = typeof record.id === 'number' ? record.id : Number.parseInt(String(record.id ?? 0), 10);

        return register({
            query: {
                course: Number.isFinite(identifier) && identifier > 0 ? identifier : undefined,
                redirect_to: enrollmentRedirectPath,
            },
        }).url;
    }, [enrollmentRedirectPath, record.id]);
    const loginUrl = useMemo(() => login({ query: { redirect_to: enrollmentRedirectPath } }).url, [enrollmentRedirectPath]);
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
    let enrollmentTitle = 'Belum Terdaftar';
    let enrollmentDescription = 'Kirim permintaan pendaftaran untuk mengikuti kursus ini.';
    let enrollmentActionLabel = hasRejectedRequest ? 'Ajukan ulang' : 'Ajukan pendaftaran';
    let showEnrollmentAction = canRequestEnrollment;
    let enrollmentBadge: { label: string; className: string } | null = {
        label: 'Belum terdaftar',
        className: 'border border-primary/20 bg-primary/10 text-primary',
    };

    if (isEnrolledViewer) {
        enrollmentTitle = 'Anda sudah terdaftar';
        enrollmentDescription = 'Nikmati seluruh materi kursus dan pantau progres pembelajaran Anda.';
        showEnrollmentAction = false;
        enrollmentBadge = {
            label: 'Terdaftar',
            className: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
        };
    } else if (hasPendingRequest) {
        enrollmentTitle = 'Permintaan sedang diproses';
        enrollmentDescription = 'Instruktur sedang meninjau permintaan Anda. Kami akan memberi tahu saat ada keputusan.';
        showEnrollmentAction = false;
        enrollmentBadge = {
            label: 'Menunggu',
            className: 'border border-amber-500/20 bg-amber-500/10 text-amber-500',
        };
    } else if (hasApprovedRequest) {
        enrollmentTitle = 'Permintaan disetujui';
        enrollmentDescription = 'Anda akan segera ditambahkan sebagai peserta. Silakan cek halaman ini lagi dalam beberapa saat.';
        showEnrollmentAction = false;
        enrollmentBadge = {
            label: 'Disetujui',
            className: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
        };
    } else if (hasRejectedRequest) {
        enrollmentTitle = 'Permintaan ditolak';
        enrollmentDescription = 'Anda dapat mengajukan ulang dengan pesan tambahan agar instruktur memahami kebutuhan Anda.';
        showEnrollmentAction = true;
        enrollmentActionLabel = 'Ajukan ulang';
        enrollmentBadge = {
            label: 'Ditolak',
            className: 'border border-rose-500/20 bg-rose-500/10 text-rose-500',
        };
    }

    const latestRequestMessage =
        typeof latestRequest?.message === 'string' && latestRequest.message.trim().length > 0 ? latestRequest.message.trim() : null;
    const enrollmentStatusLinkVisible = latestRequest !== null;

    const openEnrollmentDialog = useCallback((): void => {
        enrollmentForm.reset();
        enrollmentForm.clearErrors();
        setEnrollmentDialogOpen(true);
    }, [enrollmentForm]);

    const handleEnrollmentDialogOpenChange = (open: boolean): void => {
        setEnrollmentDialogOpen(open);
        if (!open) {
            enrollmentForm.reset();
            enrollmentForm.clearErrors();
        }
    };

    const handleEnrollmentMessageChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        enrollmentForm.setData('message', event.target.value);
    };

    const handleEnrollmentSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        enrollmentForm.submit(CourseController.requestEnrollment({ course: courseSlug }), {
            preserveScroll: true,
            onSuccess: () => {
                enrollmentForm.reset();
                enrollmentForm.clearErrors();
                setEnrollmentDialogOpen(false);
            },
        });
    };

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

    const handleUnassignStudent = (value: number | string) => {
        if (!canUnassignStudents) {
            return;
        }

        const numeric = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

        if (!Number.isFinite(numeric) || numeric <= 0) {
            return;
        }

        setRemovingStudentId(numeric);

        router.delete(CourseController.unassignStudent.url({ course: courseSlug, student: numeric }), {
            preserveScroll: true,
            onFinish: () => {
                setRemovingStudentId(null);
            },
        });
    };

    useEffect(() => {
        if (hasAutoOpenedModal || !isStudentViewer || !canRequestEnrollment) {
            return;
        }

        const [, queryString = ''] = page.url.split('?');
        const params = new URLSearchParams(queryString);

        if (params.get('enroll') === '1') {
            openEnrollmentDialog();
            setHasAutoOpenedModal(true);
        }
    }, [canRequestEnrollment, hasAutoOpenedModal, isStudentViewer, openEnrollmentDialog, page.url]);

    const backLink = useMemo(() => {
        if (isGuestViewer || isStudentViewer) {
            return CourseController.explore.url();
        }

        if (isInstructorOrAdminViewer) {
            return CourseController.index().url;
        }

        return CourseController.explore.url();
    }, [isGuestViewer, isInstructorOrAdminViewer, isStudentViewer]);

    const layoutContent = (
        <>
            <Head title={record.title || 'Detail Kursus'} />

            {/* Hero Section with Enhanced Thumbnail */}
            <div className='relative overflow-hidden'>
                {record.thumbnail ? (
                    <div className='relative h-[500px] w-full overflow-hidden lg:h-[600px]'>
                        {/* Base Image Layer */}
                        <div className='absolute inset-0'>
                            <img
                                src={record.thumbnail.startsWith('http') ? record.thumbnail : `/storage/${record.thumbnail}`}
                                alt={record.title || 'Course Thumbnail'}
                                className='h-full w-full object-cover'
                            />
                        </div>

                        {/* Multi-layered Dark Gradients */}
                        <div className='absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/40' />
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-background/50' />
                        <div className='absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-background/60' />

                        {/* Subtle Pattern Overlay */}
                        <div
                            className='absolute inset-0 opacity-5'
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />

                        {/* Vignette Effect */}
                        <div className='absolute inset-0' style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.5)' }} />
                    </div>
                ) : (
                    <div className='relative h-[400px] w-full overflow-hidden lg:h-[500px]'>
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10' />
                        <div className='absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]' />
                        <div className='absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent' />
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className='absolute top-6 right-6 left-6 z-20 flex items-center justify-between lg:top-8 lg:right-8 lg:left-8'>
                    <Button
                        variant='secondary'
                        size='lg'
                        asChild
                        className='gap-2 rounded-xl bg-background/90 shadow-2xl backdrop-blur-md hover:bg-background'
                    >
                        <Link href={backLink}>
                            <ArrowLeft className='h-4 w-4' />
                            Kembali
                        </Link>
                    </Button>
                    {canAssignStudents ? (
                        <Button variant='default' size='lg' asChild className='gap-2 rounded-xl shadow-2xl'>
                            <Link href={CourseController.students.url({ course: courseSlug })}>
                                <UserPlus className='h-4 w-4' />
                                Kelola peserta
                            </Link>
                        </Button>
                    ) : null}
                </div>

                {/* Hero Content Overlay */}
                <div className='absolute inset-x-0 bottom-0 z-10 px-6 pb-12 lg:px-12 lg:pb-16'>
                    <div className='mx-auto max-w-5xl'>
                        <div className='space-y-6'>
                            {/* Badges */}
                            <div className='flex flex-wrap items-center gap-3'>
                                {record.level && (
                                    <Badge className='gap-1.5 rounded-xl bg-background/90 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-md'>
                                        <BookOpen className='h-4 w-4' />
                                        {record.level}
                                    </Badge>
                                )}
                                {record.certification_enabled && (
                                    <Badge className='gap-1.5 rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md'>
                                        <Award className='h-4 w-4' />
                                        Bersertifikat
                                    </Badge>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className='max-w-4xl text-4xl leading-tight font-bold tracking-tight text-white drop-shadow-2xl md:text-5xl lg:text-6xl'>
                                {record.title || 'Untitled Course'}
                            </h1>

                            {/* Meta Info */}
                            <div className='flex flex-wrap items-center gap-6 text-white/90'>
                                {record.duration_formatted && (
                                    <div className='flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md'>
                                        <Clock className='h-4 w-4' />
                                        <span className='text-sm font-medium'>{record.duration_formatted}</span>
                                    </div>
                                )}
                                {instructors.length > 0 && (
                                    <div className='flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md'>
                                        <Users className='h-4 w-4' />
                                        <span className='text-sm font-medium'>{instructors.length} instruktur</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='relative z-10 mx-auto -mt-32 max-w-5xl px-4 pb-12'>
                <div className='space-y-8'>
                    {isStudentViewer ? (
                        <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                <div className='space-y-2'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        {enrollmentBadge ? (
                                            <Badge variant='outline' className={`px-3 py-1 text-xs font-medium ${enrollmentBadge.className}`}>
                                                {enrollmentBadge.label}
                                            </Badge>
                                        ) : null}
                                        {latestRequestCreatedAt ? (
                                            <span className='text-xs text-muted-foreground'>Diperbarui {latestRequestCreatedAt}</span>
                                        ) : null}
                                    </div>
                                    <h2 className='text-xl font-semibold text-foreground'>{enrollmentTitle}</h2>
                                    <p className='text-sm text-muted-foreground'>{enrollmentDescription}</p>
                                    {latestRequestMessage ? <p className='text-sm text-muted-foreground italic'>“{latestRequestMessage}”</p> : null}
                                </div>
                                <div className='flex w-full flex-col gap-2 sm:w-auto sm:items-end'>
                                    {enrollmentStatusLinkVisible ? (
                                        <Button variant='outline' asChild className='w-full sm:w-auto'>
                                            <Link href={EnrollmentRequestController.index().url}>Lihat permintaan</Link>
                                        </Button>
                                    ) : null}
                                    {showEnrollmentAction ? (
                                        <Button type='button' className='w-full sm:w-auto' onClick={openEnrollmentDialog}>
                                            {enrollmentActionLabel}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isGuestViewer ? (
                        <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                <div className='space-y-2'>
                                    <Badge variant='outline' className='border border-primary/20 bg-primary/10 text-primary'>
                                        Butuh akun
                                    </Badge>
                                    <h2 className='text-xl font-semibold text-foreground'>Masuk untuk mengajukan pendaftaran</h2>
                                    <p className='text-sm text-muted-foreground'>
                                        Masuk atau buat akun siswa untuk mengirim permintaan pendaftaran. Setelah autentikasi, Anda akan kembali ke
                                        halaman ini dengan formulir pendaftaran yang siap digunakan.
                                    </p>
                                </div>
                                <div className='flex w-full flex-col gap-2 sm:w-auto sm:items-end'>
                                    <Button
                                        type='button'
                                        className='w-full sm:w-auto'
                                        onClick={() => router.visit(loginUrl, { preserveScroll: true })}
                                    >
                                        Ajukan pendaftaran
                                    </Button>
                                    <Button asChild variant='outline' className='w-full sm:w-auto'>
                                        <Link href={registerUrl}>Buat akun siswa</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

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
                            {canAssignStudents ? (
                                <GenericDataSelector<App.Data.User.UserData>
                                    id='attach-instructor-selector'
                                    placeholder={isAttaching ? 'Menambahkan…' : 'Tambah instruktur'}
                                    fetchData={fetchUserOptions}
                                    dataMapper={(response) => response.data.users.data}
                                    selectedDataId={pendingInstructorId}
                                    setSelectedData={handleAttachInstructor}
                                    buttonClassName={`w-full sm:w-auto ${isAttaching ? 'pointer-events-none opacity-60' : ''}`}
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                    disabledSearchState={isAttaching}
                                />
                            ) : null}
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
                                            {identifier && canAssignStudents ? (
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

                    {/* Participants Section */}
                    <div className='rounded-2xl border bg-card p-6 shadow-lg'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div>
                                <h3 className='text-lg font-semibold'>Peserta Terdaftar</h3>
                                <p className='text-sm text-muted-foreground'>Daftar siswa yang saat ini terdaftar pada kursus ini.</p>
                            </div>
                        </div>
                        <ul className='mt-6 space-y-3'>
                            {students.length === 0 ? (
                                <li className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                                    Belum ada siswa yang terdaftar pada kursus ini.
                                </li>
                            ) : (
                                students.map((student) => {
                                    const rawId = student?.id ?? null;
                                    const numericId = typeof rawId === 'number' ? rawId : Number.parseInt(String(rawId ?? ''), 10);
                                    const isRemoving = removingStudentId === numericId;

                                    const displayName = typeof student?.name === 'string' && student.name.length > 0 ? student.name : 'Tanpa nama';
                                    const email = typeof student?.email === 'string' ? student.email : '';

                                    return (
                                        <li
                                            key={`student-${String(rawId)}`}
                                            className='flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
                                        >
                                            <div>
                                                <p className='text-sm font-semibold text-foreground'>{displayName}</p>
                                                {email.length > 0 ? <p className='text-sm text-muted-foreground'>{email}</p> : null}
                                            </div>
                                            {canUnassignStudents ? (
                                                <Button
                                                    type='button'
                                                    variant='outline'
                                                    size='sm'
                                                    className='gap-2'
                                                    disabled={!Number.isFinite(numericId) || numericId <= 0 || isRemoving}
                                                    onClick={() => handleUnassignStudent(numericId)}
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                    {isRemoving ? 'Menghapus...' : 'Hapus peserta'}
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
        </>
    );

    return (
        <>
            {isGuestViewer ? <GuestLayout>{layoutContent}</GuestLayout> : <AppLayout>{layoutContent}</AppLayout>}
            <Dialog open={enrollmentDialogOpen} onOpenChange={handleEnrollmentDialogOpenChange}>
                <DialogContent showCloseIcon>
                    <DialogHeader>
                        <DialogTitle>Ajukan pendaftaran</DialogTitle>
                        <DialogDescription>Kirim permintaan ke instruktur untuk mengikuti kursus ini. Pesan bersifat opsional.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEnrollmentSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <label htmlFor='enrollment-message' className='text-sm font-medium text-foreground'>
                                Pesan untuk instruktur
                            </label>
                            <Textarea
                                id='enrollment-message'
                                name='message'
                                value={enrollmentForm.data.message ?? ''}
                                onChange={handleEnrollmentMessageChange}
                                placeholder='Ceritakan motivasi atau kebutuhan belajar Anda (opsional)'
                                disabled={enrollmentForm.processing}
                                rows={4}
                            />
                            <p className='text-xs text-muted-foreground'>Pesan ini akan membantu instruktur memahami kebutuhan Anda.</p>
                            {enrollmentForm.errors.message ? <p className='text-sm text-destructive'>{enrollmentForm.errors.message}</p> : null}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type='button' variant='ghost' disabled={enrollmentForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type='submit' disabled={enrollmentForm.processing}>
                                {enrollmentForm.processing ? 'Mengirim…' : 'Kirim permintaan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
