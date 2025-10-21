import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { MagicCard } from '@/components/ui/magic-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    CircleDashed,
    GraduationCap,
    Hourglass,
    Layers3,
    TrendingUp,
    UserCircle2,
    Users2,
} from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: DashboardController.index().url,
    },
];

type DashboardFiltersOption = {
    value: string;
    label: string;
};

type SuperAdminFilters = {
    user_range: {
        options: DashboardFiltersOption[];
        selected: string;
    };
    course_range: {
        options: DashboardFiltersOption[];
        selected: string;
    };
    course_level: {
        options: DashboardFiltersOption[];
        selected: string[];
    };
};

type ChartDistribution = {
    title: string;
    description?: string | null;
    segments: SuperAdminSegment[];
    meta: Record<string, unknown>;
};

type SuperAdminDashboard = {
    user_roles: ChartDistribution;
    course_levels: ChartDistribution;
    filters: SuperAdminFilters;
};

type InstructorFilters = {
    course_options: DashboardFiltersOption[];
    selected_course_ids: string[];
};

type InstructorDashboard = {
    course_progress: CourseProgressSummary[];
    unique_students: number;
    filters: InstructorFilters;
};

type StudentFilters = {
    course_options: DashboardFiltersOption[];
    selected_course_id: string | null;
    status_options: DashboardFiltersOption[];
    selected_status: string | null;
};

type StudentDashboard = {
    recent_progress: ModuleProgressItem[];
    completed_count: number;
    in_progress_count: number;
    pending_count: number;
    filters: StudentFilters;
};

type DashboardUser = {
    id: number;
    name?: string | null;
    email?: string | null;
    created_at?: string | null;
    [key: string]: unknown;
};

type DashboardPayload = {
    user: DashboardUser | null;
    role_names: string[];
    super_admin: SuperAdminDashboard | null;
    instructor: InstructorDashboard | null;
    student: StudentDashboard | null;
    filters: Record<string, unknown>;
};

type DashboardPageProps = {
    dashboard: DashboardPayload;
};

const statusLabels: Record<string, string> = {
    completed: 'Selesai',
    in_progress: 'Sedang Berjalan',
    pending: 'Belum Dimulai',
    not_started: 'Belum Dimulai',
};

const statusBadgeClasses: Record<string, string> = {
    completed: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-800/20 dark:text-emerald-300',
    in_progress: 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800/40 dark:bg-sky-800/20 dark:text-sky-300',
    pending: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200',
    not_started: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300',
};

type SuperAdminSegment = {
    key: string;
    label: string;
    value: number;
    color?: string | null;
};

type CourseStudentProgress = {
    student_id: number;
    student_name: string;
    student_email?: string | null;
    progress: number;
    status: string;
};

type CourseProgressSummary = {
    course_id: number;
    course_title: string;
    total_students: number;
    completed_count: number;
    in_progress_count: number;
    not_started_count: number;
    students: CourseStudentProgress[];
};

type ModuleProgressItem = {
    id?: number | null;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
    module_stage?: {
        module?: { title?: string | null } | null;
        module_content?: { title?: string | null } | null;
        module_quiz?: { name?: string | null } | null;
    } | null;
};

const formatter = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatDateTime(value?: string | null): string {
    if (!value) {
        return 'Belum tersedia';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'Belum tersedia';
    }

    return formatter.format(parsed);
}

export default function Dashboard() {
    const page = usePage<DashboardPageProps>();
    const payload = page.props.dashboard;

    const user = payload?.user ?? null;
    const superAdmin = payload?.super_admin ?? null;
    const instructor = payload?.instructor ?? null;
    const student = payload?.student ?? null;

    const handleFilterChange = (key: string, value?: string | null) => {
        const baseUrl = DashboardController.index.url();
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

        params.delete(key);

        if (value && value !== '__all__') {
            params.set(key, value);
        }

        const query = params.toString();
        const url = query.length > 0 ? `${baseUrl}?${query}` : baseUrl;

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const superAdminUserRangeOptions: Array<{ value: string; label: string }> = Array.isArray(superAdmin?.filters?.user_range?.options)
        ? superAdmin.filters.user_range.options
        : [];
    const superAdminCourseRangeOptions: Array<{ value: string; label: string }> = Array.isArray(superAdmin?.filters?.course_range?.options)
        ? superAdmin.filters.course_range.options
        : [];
    const superAdminCourseLevelOptions: Array<{ value: string; label: string }> = Array.isArray(superAdmin?.filters?.course_level?.options)
        ? superAdmin.filters.course_level.options
        : [];
    const superAdminSelectedLevels = Array.isArray(superAdmin?.filters?.course_level?.selected) ? superAdmin.filters.course_level.selected : [];

    const instructorCourseOptions: Array<{ value: string; label: string }> = Array.isArray(instructor?.filters?.course_options)
        ? instructor.filters.course_options
        : [];
    const instructorSelectedCourseIds: string[] = Array.isArray(instructor?.filters?.selected_course_ids)
        ? instructor.filters.selected_course_ids
        : [];

    const studentCourseOptions: Array<{ value: string; label: string }> = Array.isArray(student?.filters?.course_options)
        ? student.filters.course_options
        : [];
    const studentStatusOptions: Array<{ value: string; label: string }> = Array.isArray(student?.filters?.status_options)
        ? student.filters.status_options
        : [];

    const userRoleChartData = useMemo(() => {
        if (!superAdmin) {
            return { data: [], config: {} as ChartConfig };
        }

        const segments: SuperAdminSegment[] = Array.isArray(superAdmin.user_roles.segments)
            ? (superAdmin.user_roles.segments as SuperAdminSegment[])
            : [];

        const chartConfig = segments.reduce((carry: ChartConfig, segment: SuperAdminSegment) => {
            carry[segment.key] = {
                label: segment.label ?? segment.key,
                color: segment.color ?? 'hsl(var(--primary))',
            };

            return carry;
        }, {} as ChartConfig);

        const data = segments.map((segment): { key: string; label: string; value: number; color: string } => ({
            key: segment.key,
            label: segment.label,
            value: segment.value,
            color: segment.color ?? 'hsl(var(--primary))',
        }));

        return { data, config: chartConfig };
    }, [superAdmin]);

    const courseLevelChartData = useMemo(() => {
        if (!superAdmin) {
            return [] as Array<{ key: string; label: string; value: number; color: string }>;
        }

        const segments: SuperAdminSegment[] = Array.isArray(superAdmin.course_levels.segments)
            ? (superAdmin.course_levels.segments as SuperAdminSegment[])
            : [];

        return segments.map((segment): { key: string; label: string; value: number; color: string } => ({
            key: segment.key,
            label: segment.label,
            value: segment.value,
            color: segment.color ?? 'hsl(var(--chart-2))',
        }));
    }, [superAdmin]);

    const instructorCourseData = useMemo(() => {
        if (!instructor) {
            return {
                chart: [] as Array<{ course: string; completed: number; in_progress: number; not_started: number }>,
                summaries: [] as CourseProgressSummary[],
            };
        }

        const summaries: CourseProgressSummary[] = Array.isArray(instructor.course_progress)
            ? (instructor.course_progress as CourseProgressSummary[])
            : [];

        const chart = summaries.map((summary): { course: string; completed: number; in_progress: number; not_started: number } => ({
            course: summary.course_title,
            completed: summary.completed_count,
            in_progress: summary.in_progress_count,
            not_started: summary.not_started_count,
        }));

        return { chart, summaries };
    }, [instructor]);

    const instructorChartConfig: ChartConfig = {
        completed: { label: 'Selesai', color: 'hsl(var(--chart-1))' },
        in_progress: { label: 'Sedang Berjalan', color: 'hsl(var(--chart-2))' },
        not_started: { label: 'Belum Dimulai', color: 'hsl(var(--chart-3))' },
    };

    const studentProgress = useMemo(() => {
        if (!student) {
            return [] as ModuleProgressItem[];
        }

        return Array.isArray(student.recent_progress) ? (student.recent_progress as ModuleProgressItem[]) : [];
    }, [student]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title='Dashboard' />
            <div className='flex flex-col gap-6 p-6 pb-12'>
                <section className='grid gap-6 lg:grid-cols-3'>
                    <MagicCard className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                        <CardHeader className='relative p-0'>
                            <div className='flex items-center justify-between gap-4'>
                                <div>
                                    <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                        <UserCircle2 className='h-5 w-5 text-primary' />
                                        Akun Aktif
                                    </CardTitle>
                                    <CardDescription className='mt-1.5 text-sm'>Profil ringkas pengguna yang sedang masuk.</CardDescription>
                                </div>
                                <Badge
                                    variant='outline'
                                    className='rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-sm'
                                >
                                    {payload?.role_names?.join(' • ') || 'Tanpa Peran'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className='mt-6 space-y-2 p-0 text-sm'>
                            <div className='flex items-center gap-3'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                                    <Users2 className='h-5 w-5' />
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Nama</p>
                                    <p className='text-base font-semibold text-foreground'>{user?.name ?? 'Pengguna'}</p>
                                </div>
                            </div>
                            <div>
                                <p className='text-xs text-muted-foreground'>Email</p>
                                <p className='mt-1 font-medium text-foreground'>{user?.email ?? 'Tidak tersedia'}</p>
                            </div>
                            <div>
                                <p className='text-xs text-muted-foreground'>Terdaftar Sejak</p>
                                <p className='mt-1 font-medium text-foreground'>{formatDateTime(user?.created_at ?? null)}</p>
                            </div>
                        </CardContent>
                    </MagicCard>

                    <Card className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                        <CardHeader className='relative flex flex-row items-center justify-between gap-3'>
                            <div>
                                <CardTitle className='text-lg font-bold'>Peran Anda</CardTitle>
                                <CardDescription>Setiap peran memiliki kartu wawasan khusus di bawah ini.</CardDescription>
                            </div>
                            <Layers3 className='h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110' />
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            {payload?.role_names?.length ? (
                                <div className='flex flex-wrap gap-2'>
                                    {payload.role_names.map((role: string) => (
                                        <Badge
                                            key={role}
                                            variant='secondary'
                                            className='rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase'
                                        >
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className='text-sm text-muted-foreground'>Tidak ada peran khusus yang aktif.</p>
                            )}
                            <p className='text-xs leading-relaxed text-muted-foreground'>
                                Gunakan pemilih filter pada setiap bagian untuk menggali data yang paling relevan dengan aktivitas Anda.
                            </p>
                        </CardContent>
                    </Card>

                    <MagicCard className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                        <CardHeader className='relative p-0'>
                            <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                <BarChart3 className='h-5 w-5 text-primary' />
                                Ringkasan Cepat
                            </CardTitle>
                            <CardDescription className='mt-1.5 text-sm'>Jumlah data utama berdasarkan peran Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className='relative mt-6 grid gap-4 p-0 text-sm lg:grid-cols-2'>
                            <div className='group/stat rounded-xl border border-border/60 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md'>
                                <p className='text-xs text-muted-foreground'>Mahasiswa Dibimbing</p>
                                <p className='mt-2 text-2xl font-semibold text-foreground'>{instructor?.unique_students ?? 0}</p>
                                <p className='text-xs text-muted-foreground'>Total siswa unik yang terdaftar di kursus Anda</p>
                            </div>
                            <div className='group/stat rounded-xl border border-border/60 bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-4 shadow-sm transition-all duration-300 hover:border-sky-500/30 hover:shadow-md'>
                                <p className='text-xs font-medium text-muted-foreground'>Progress Modul Terbaru</p>
                                <p className='mt-2 text-2xl font-semibold text-foreground'>{studentProgress.length}</p>
                                <p className='text-xs text-muted-foreground'>Riwayat aktivitas modul terakhir Anda</p>
                            </div>
                        </CardContent>
                    </MagicCard>
                </section>

                {superAdmin && (
                    <section className='space-y-4'>
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-xl font-semibold text-foreground'>Wawasan Super Admin</h2>
                                <p className='text-sm text-muted-foreground'>Pantau pertumbuhan pengguna dan kursus dengan filter cepat.</p>
                            </div>
                            <div className='flex flex-wrap items-center gap-3'>
                                <Select
                                    value={superAdmin.filters.user_range.selected}
                                    onValueChange={(value) => handleFilterChange('filter[user_range]', value)}
                                >
                                    <SelectTrigger className='w-[200px]'>
                                        <SelectValue placeholder='Periode Pengguna' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {superAdminUserRangeOptions.map((option: { value: string; label: string }) => (
                                            <SelectItem key={`user-range-${option.value}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={superAdmin.filters.course_range.selected}
                                    onValueChange={(value) => handleFilterChange('filter[course_range]', value)}
                                >
                                    <SelectTrigger className='w-[200px]'>
                                        <SelectValue placeholder='Periode Kursus' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {superAdminCourseRangeOptions.map((option: { value: string; label: string }) => (
                                            <SelectItem key={`course-range-${option.value}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={superAdminSelectedLevels[0] ?? '__all__'}
                                    onValueChange={(value) => {
                                        if (value === '__all__') {
                                            handleFilterChange('filter[course_level]', undefined);
                                            return;
                                        }

                                        handleFilterChange('filter[course_level]', value);
                                    }}
                                >
                                    <SelectTrigger className='w-[220px]'>
                                        <SelectValue placeholder='Semua Level Kursus' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='__all__'>Semua Level</SelectItem>
                                        {superAdminCourseLevelOptions.map((option: { value: string; label: string }) => (
                                            <SelectItem key={`course-level-${option.value}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className='grid gap-6 lg:grid-cols-2'>
                            <MagicCard className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardHeader className='relative p-0'>
                                    <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                        <GraduationCap className='h-5 w-5 text-primary' />
                                        Distribusi Pengguna Berdasarkan Peran
                                    </CardTitle>
                                    <CardDescription className='mt-1.5'>{superAdmin.user_roles.description}</CardDescription>
                                </CardHeader>
                                <CardContent className='relative mt-8 p-0'>
                                    {userRoleChartData.data.length === 0 ? (
                                        <p className='text-sm text-muted-foreground'>Belum ada data pengguna untuk periode ini.</p>
                                    ) : (
                                        <ChartContainer config={userRoleChartData.config} className='mx-auto aspect-square max-h-[320px]'>
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie
                                                    data={userRoleChartData.data}
                                                    dataKey='value'
                                                    nameKey='key'
                                                    innerRadius={70}
                                                    outerRadius={120}
                                                    strokeWidth={2}
                                                    paddingAngle={2}
                                                >
                                                    <Label
                                                        content={({ viewBox }) => {
                                                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                                const total = userRoleChartData.data.reduce((sum, entry) => sum + entry.value, 0);
                                                                return (
                                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle' dominantBaseline='middle'>
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={viewBox.cy}
                                                                            className='fill-foreground text-3xl font-bold'
                                                                        >
                                                                            {total}
                                                                        </tspan>
                                                                        <tspan
                                                                            x={viewBox.cx}
                                                                            y={(viewBox.cy || 0) + 24}
                                                                            className='fill-muted-foreground text-sm'
                                                                        >
                                                                            Total Pengguna
                                                                        </tspan>
                                                                    </text>
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </MagicCard>

                            <MagicCard className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardHeader className='relative p-0'>
                                    <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                        <BookOpen className='h-5 w-5 text-primary' />
                                        Distribusi Kursus Berdasarkan Level
                                    </CardTitle>
                                    <CardDescription className='mt-1.5'>{superAdmin.course_levels.description}</CardDescription>
                                </CardHeader>
                                <CardContent className='relative mt-8 p-0'>
                                    {courseLevelChartData.length === 0 ? (
                                        <p className='text-sm text-muted-foreground'>Belum ada kursus yang tercatat untuk periode ini.</p>
                                    ) : (
                                        <ChartContainer
                                            config={courseLevelChartData.reduce((carry: ChartConfig, entry) => {
                                                carry[entry.key] = {
                                                    label: entry.label,
                                                    color: entry.color,
                                                };
                                                return carry;
                                            }, {} as ChartConfig)}
                                            className='h-[320px]'
                                        >
                                            <BarChart data={courseLevelChartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                                <CartesianGrid strokeDasharray='4 4' vertical={false} />
                                                <XAxis
                                                    dataKey='label'
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                    interval={0}
                                                    angle={-15}
                                                    dy={16}
                                                />
                                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey='value' radius={[10, 10, 0, 0]}>
                                                    {courseLevelChartData.map(
                                                        (entry: { key: string; label: string; value: number; color: string }) => (
                                                            <Cell key={`course-bar-${entry.key}`} fill={entry.color} />
                                                        ),
                                                    )}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </MagicCard>
                        </div>
                    </section>
                )}

                {instructor && (
                    <section className='space-y-4'>
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-xl font-semibold text-foreground'>Wawasan Instruktur</h2>
                                <p className='text-sm text-muted-foreground'>Lacak progres siswa dan kesehatan kursus yang Anda kelola.</p>
                            </div>
                            <Select
                                value={instructorSelectedCourseIds[0] ?? '__all__'}
                                onValueChange={(value) => {
                                    if (value === '__all__') {
                                        handleFilterChange('filter[instructor_course_ids]', undefined);
                                        return;
                                    }

                                    handleFilterChange('filter[instructor_course_ids]', value);
                                }}
                            >
                                <SelectTrigger className='w-[240px]'>
                                    <SelectValue placeholder='Semua Kursus' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='__all__'>Semua Kursus</SelectItem>
                                    {instructorCourseOptions.map((option: { value: string; label: string }) => (
                                        <SelectItem key={`instructor-course-${option.value}`} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='grid gap-6 lg:grid-cols-2'>
                            <Card className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardHeader className='relative'>
                                    <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                        <Users2 className='h-5 w-5 text-primary' />
                                        Ringkasan Populasi Siswa
                                    </CardTitle>
                                    <CardDescription>Total siswa unik dalam kursus pilihan Anda.</CardDescription>
                                </CardHeader>
                                <CardContent className='relative p-6 pt-0'>
                                    <div className='rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md'>
                                        <p className='text-xs tracking-wide text-muted-foreground uppercase'>Total Siswa Unik</p>
                                        <p className='mt-3 text-4xl font-bold text-foreground'>{instructor.unique_students}</p>
                                        <p className='mt-2 text-xs text-muted-foreground'>
                                            Dihitung berdasarkan nama siswa unik dari seluruh kursus Anda.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <MagicCard className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardHeader className='relative p-0'>
                                    <CardTitle className='flex items-center gap-2 text-lg font-bold'>
                                        <TrendingUp className='h-5 w-5 text-primary' />
                                        Progres Siswa per Kursus
                                    </CardTitle>
                                    <CardDescription className='mt-1.5'>Pembagian status belajar untuk setiap kursus.</CardDescription>
                                </CardHeader>
                                <CardContent className='relative mt-8 p-0'>
                                    {instructorCourseData.chart.length === 0 ? (
                                        <p className='text-sm text-muted-foreground'>Belum ada siswa yang terdaftar pada kursus terpilih.</p>
                                    ) : (
                                        <ChartContainer config={instructorChartConfig} className='h-[320px]'>
                                            <BarChart data={instructorCourseData.chart} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                                <CartesianGrid strokeDasharray='4 4' vertical={false} />
                                                <XAxis
                                                    dataKey='course'
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                    interval={0}
                                                    angle={-12}
                                                    dy={16}
                                                />
                                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar
                                                    dataKey='completed'
                                                    stackId='progress'
                                                    fill={instructorChartConfig.completed.color}
                                                    radius={[10, 10, 0, 0]}
                                                />
                                                <Bar dataKey='in_progress' stackId='progress' fill={instructorChartConfig.in_progress.color} />
                                                <Bar dataKey='not_started' stackId='progress' fill={instructorChartConfig.not_started.color} />
                                            </BarChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </MagicCard>
                        </div>

                        <div className='grid gap-6 lg:grid-cols-2'>
                            {instructorCourseData.summaries.length === 0 ? (
                                <Card className='rounded-3xl border border-dashed border-border/60 bg-card/60 shadow-none backdrop-blur'>
                                    <CardContent className='flex min-h-[180px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
                                        <Layers3 className='h-6 w-6 text-muted-foreground' />
                                        Belum ada data progres siswa yang bisa ditampilkan.
                                    </CardContent>
                                </Card>
                            ) : (
                                instructorCourseData.summaries.map((summary) => (
                                    <Card
                                        key={`course-summary-${summary.course_id}`}
                                        className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'
                                    >
                                        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                        <CardHeader className='relative'>
                                            <CardTitle className='flex items-center justify-between gap-2 text-lg font-bold'>
                                                <span>{summary.course_title}</span>
                                                <Badge
                                                    variant='outline'
                                                    className='rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold shadow-sm'
                                                >
                                                    {summary.total_students} siswa
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>Kondisi progres siswa di kursus ini.</CardDescription>
                                        </CardHeader>
                                        <CardContent className='relative space-y-4'>
                                            <div className='flex flex-wrap gap-3 text-xs font-semibold tracking-wide uppercase'>
                                                <span className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
                                                    <CheckCircle2 className='h-4 w-4' /> {summary.completed_count} selesai
                                                </span>
                                                <span className='flex items-center gap-2 text-sky-600 dark:text-sky-300'>
                                                    <Hourglass className='h-4 w-4' /> {summary.in_progress_count} berjalan
                                                </span>
                                                <span className='flex items-center gap-2 text-zinc-500 dark:text-zinc-300'>
                                                    <CircleDashed className='h-4 w-4' /> {summary.not_started_count} belum mulai
                                                </span>
                                            </div>
                                            <div className='space-y-2'>
                                                {summary.students.slice(0, 5).map((student: CourseStudentProgress) => (
                                                    <div
                                                        key={`student-${summary.course_id}-${student.student_id}`}
                                                        className='group/student flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:bg-background/80 hover:shadow-sm'
                                                    >
                                                        <div>
                                                            <p className='text-sm font-medium text-foreground'>{student.student_name}</p>
                                                            <p className='text-xs text-muted-foreground'>
                                                                {student.student_email ?? 'Email tidak tersedia'}
                                                            </p>
                                                        </div>
                                                        <div className='flex items-center gap-3 text-sm'>
                                                            <Badge
                                                                variant='outline'
                                                                className='rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase'
                                                            >
                                                                {student.progress}%
                                                            </Badge>
                                                            <Badge
                                                                variant='outline'
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${statusBadgeClasses[student.status] ?? ''}`}
                                                            >
                                                                {statusLabels[student.status] ?? student.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                                {summary.students.length > 5 && (
                                                    <p className='text-xs text-muted-foreground'>
                                                        Menampilkan 5 siswa terbaru dari total {summary.students.length} siswa.
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {student && (
                    <section className='space-y-4'>
                        <div className='flex flex-wrap items-center justify-between gap-4'>
                            <div>
                                <h2 className='text-xl font-semibold text-foreground'>Wawasan Siswa</h2>
                                <p className='text-sm text-muted-foreground'>Lacak progres modul dan kuis terbaru Anda.</p>
                            </div>
                            <div className='flex flex-wrap items-center gap-3'>
                                <Select
                                    value={(student.filters.selected_course_id ?? '__all__') as string}
                                    onValueChange={(value) => {
                                        if (value === '__all__') {
                                            handleFilterChange('filter[student_course_id]', undefined);
                                            return;
                                        }

                                        handleFilterChange('filter[student_course_id]', value);
                                    }}
                                >
                                    <SelectTrigger className='w-[220px]'>
                                        <SelectValue placeholder='Semua Kursus' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='__all__'>Semua Kursus</SelectItem>
                                        {studentCourseOptions.map((option) => (
                                            <SelectItem key={`student-course-${option.value}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={(student.filters.selected_status ?? '__all__') as string}
                                    onValueChange={(value) => {
                                        if (value === '__all__') {
                                            handleFilterChange('filter[student_status]', undefined);
                                            return;
                                        }

                                        handleFilterChange('filter[student_status]', value);
                                    }}
                                >
                                    <SelectTrigger className='w-[200px]'>
                                        <SelectValue placeholder='Semua Status' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='__all__'>Semua Status</SelectItem>
                                        {studentStatusOptions.map((option) => (
                                            <SelectItem key={`student-status-${option.value}`} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className='grid gap-4 md:grid-cols-3'>
                            <Card className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardContent className='relative flex flex-col items-center justify-center gap-3 p-8 text-center'>
                                    <Award className='h-8 w-8 text-emerald-500' />
                                    <p className='text-xs tracking-wide text-muted-foreground uppercase'>Modul Selesai</p>
                                    <p className='text-3xl font-bold text-foreground'>{student.completed_count}</p>
                                </CardContent>
                            </Card>
                            <Card className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-sky-500/30 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardContent className='relative flex flex-col items-center justify-center gap-3 p-8 text-center'>
                                    <Hourglass className='h-8 w-8 text-sky-500' />
                                    <p className='text-xs tracking-wide text-muted-foreground uppercase'>Sedang Berjalan</p>
                                    <p className='text-3xl font-bold text-foreground'>{student.in_progress_count}</p>
                                </CardContent>
                            </Card>
                            <Card className='group overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-zinc-500/10 via-zinc-500/5 to-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-zinc-500/30 hover:shadow-xl'>
                                <div className='absolute inset-0 bg-gradient-to-br from-zinc-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                <CardContent className='relative flex flex-col items-center justify-center gap-3 p-8 text-center'>
                                    <CircleDashed className='h-8 w-8 text-zinc-500' />
                                    <p className='text-xs tracking-wide text-muted-foreground uppercase'>Belum Dimulai</p>
                                    <p className='text-3xl font-bold text-foreground'>{student.pending_count}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className='grid gap-4 lg:grid-cols-2'>
                            {studentProgress.length === 0 ? (
                                <Card className='rounded-2xl border border-dashed border-border/60 bg-card/60 shadow-none backdrop-blur lg:col-span-2'>
                                    <CardContent className='flex min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
                                        <BookOpen className='h-6 w-6 text-muted-foreground' />
                                        Belum ada progres modul yang tercatat pada filter ini.
                                    </CardContent>
                                </Card>
                            ) : (
                                studentProgress.map((progress, index) => {
                                    const moduleTitle = progress.module_stage?.module?.title ?? 'Modul Tanpa Judul';
                                    const stageLabel =
                                        progress.module_stage?.module_content?.title ??
                                        progress.module_stage?.module_quiz?.name ??
                                        'Tahapan Tanpa Judul';
                                    const status = progress.status ?? 'pending';

                                    return (
                                        <MagicCard
                                            key={`progress-${progress.id ?? index}`}
                                            className='group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl'
                                        >
                                            <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                                            <div className='relative flex flex-col gap-4'>
                                                <div className='flex items-start justify-between gap-3'>
                                                    <div>
                                                        <h3 className='text-lg font-semibold text-foreground'>{moduleTitle}</h3>
                                                        <p className='text-sm text-muted-foreground'>{stageLabel}</p>
                                                    </div>
                                                    <Badge
                                                        variant='outline'
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${statusBadgeClasses[status] ?? ''}`}
                                                    >
                                                        {statusLabels[status] ?? status}
                                                    </Badge>
                                                </div>
                                                <div className='grid gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
                                                    <div>
                                                        <span className='font-semibold text-foreground'>Mulai</span>
                                                        <p>{formatDateTime(progress.started_at)}</p>
                                                    </div>
                                                    <div>
                                                        <span className='font-semibold text-foreground'>Selesai</span>
                                                        <p>{formatDateTime(progress.completed_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </MagicCard>
                                    );
                                })
                            )}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
