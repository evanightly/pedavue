import CourseController from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type PaginationMeta } from '@/components/ui/data-table-types';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import GuestLayout from '@/layouts/guest-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Compass, GraduationCap, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface ExploreCoursesProps {
    courses: CourseCollection;
    filters?: {
        search?: string;
        per_page?: number;
    } | null;
}

const gradientVariants = [
    {
        bg: 'from-primary/30 via-primary/10 to-transparent',
        overlay: 'from-primary/50 via-primary/20 to-transparent',
        border: 'border-primary/30',
        shadow: 'shadow-primary/20',
    },
    {
        bg: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
        overlay: 'from-emerald-500/50 via-emerald-500/20 to-transparent',
        border: 'border-emerald-500/30',
        shadow: 'shadow-emerald-500/20',
    },
    {
        bg: 'from-sky-500/30 via-sky-500/10 to-transparent',
        overlay: 'from-sky-500/50 via-sky-500/20 to-transparent',
        border: 'border-sky-500/30',
        shadow: 'shadow-sky-500/20',
    },
    {
        bg: 'from-fuchsia-500/30 via-fuchsia-500/10 to-transparent',
        overlay: 'from-fuchsia-500/50 via-fuchsia-500/20 to-transparent',
        border: 'border-fuchsia-500/30',
        shadow: 'shadow-fuchsia-500/20',
    },
    {
        bg: 'from-amber-500/30 via-amber-500/10 to-transparent',
        overlay: 'from-amber-500/50 via-amber-500/20 to-transparent',
        border: 'border-amber-500/30',
        shadow: 'shadow-amber-500/20',
    },
    {
        bg: 'from-purple-500/30 via-purple-500/10 to-transparent',
        overlay: 'from-purple-500/50 via-purple-500/20 to-transparent',
        border: 'border-purple-500/30',
        shadow: 'shadow-purple-500/20',
    },
];

function stripHtml(value: string | null | undefined, length: number = 140): string {
    if (!value) {
        return '';
    }

    const plain = value.replace(/<[^>]*>/g, '').trim();

    if (plain.length <= length) {
        return plain;
    }

    return plain.slice(0, length).trimEnd() + '…';
}

export default function ExploreCourses({ courses, filters = null }: ExploreCoursesProps) {
    const page = usePage<{ auth: { user: App.Data.User.UserData | null } }>();
    const authUser = page.props.auth?.user ?? null;
    const isGuest = authUser === null;
    const initialSearch = typeof filters?.search === 'string' ? filters.search : '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            CourseController.explore.url({
                query: {
                    search: searchTerm || undefined,
                },
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handlePageNavigate = (url: string | null) => {
        if (!url) {
            return;
        }

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const cards = useMemo(() => courses.data ?? [], [courses.data]);

    const content = (
        <>
            <Head title='Eksplor Kursus' />

            {/* Hero Header with Gradient Background */}
            <div className='relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/10'>
                <div className='absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:3rem_3rem]' />

                <div className='relative container mx-auto px-6 py-16 lg:py-24'>
                    <div className='mx-auto max-w-4xl text-center'>
                        <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur'>
                            <Sparkles className='h-4 w-4' />
                            Jelajahi Kursus
                        </div>
                        <h1 className='mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl'>
                            Temukan Kursus{' '}
                            <span className='bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent'>
                                Terbaikmu
                            </span>
                        </h1>
                        <p className='mt-6 text-lg text-muted-foreground md:text-xl'>
                            {isGuest
                                ? 'Telusuri kursus berkualitas dan daftar untuk memulai perjalanan pembelajaranmu.'
                                : 'Jelajahi kursus baru dan tingkatkan keahlianmu dengan materi pembelajaran terkini.'}
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className='mt-10'>
                            <div className='relative mx-auto max-w-2xl'>
                                <div className='pointer-events-none absolute inset-y-0 left-4 flex items-center'>
                                    <Search className='h-5 w-5 text-muted-foreground' />
                                </div>
                                <Input
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder='Cari kursus berdasarkan judul, deskripsi, atau topik...'
                                    className='h-14 rounded-2xl border-border/50 bg-background/80 pr-32 pl-12 text-base shadow-lg backdrop-blur focus-visible:ring-2 focus-visible:ring-primary/40'
                                />
                                <div className='absolute inset-y-0 right-2 flex items-center'>
                                    <Button type='submit' size='sm' className='h-10 gap-2 rounded-xl px-6 shadow-lg'>
                                        <Search className='h-4 w-4' />
                                        Cari
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Stats */}
                        <div className='mt-12 flex flex-wrap items-center justify-center gap-8'>
                            <div className='flex items-center gap-3'>
                                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80'>
                                    <GraduationCap className='h-6 w-6 text-primary-foreground' />
                                </div>
                                <div className='text-left'>
                                    <div className='text-2xl font-bold text-foreground'>{courses.total}</div>
                                    <div className='text-sm text-muted-foreground'>Kursus Tersedia</div>
                                </div>
                            </div>
                            <div className='flex items-center gap-3'>
                                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600'>
                                    <TrendingUp className='h-6 w-6 text-white' />
                                </div>
                                <div className='text-left'>
                                    <div className='text-2xl font-bold text-foreground'>100%</div>
                                    <div className='text-sm text-muted-foreground'>Gratis Akses</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container mx-auto flex flex-col gap-8 px-6 py-12'>
                {cards.length === 0 ? (
                    <div className='flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-card/50 px-8 py-24 text-center backdrop-blur'>
                        <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50'>
                            <Compass className='h-10 w-10 text-muted-foreground/60' />
                        </div>
                        <div className='space-y-2'>
                            <h2 className='text-2xl font-bold text-foreground'>Tidak ada kursus ditemukan</h2>
                            <p className='max-w-md text-muted-foreground'>
                                Coba ubah kata kunci pencarian atau muat ulang untuk melihat semua kursus yang tersedia.
                            </p>
                        </div>
                        <Button
                            variant='outline'
                            size='lg'
                            onClick={() => handlePageNavigate(CourseController.explore.url())}
                            className='mt-4 rounded-xl'
                        >
                            Muat ulang daftar
                        </Button>
                    </div>
                ) : (
                    <div className='grid gap-8 sm:grid-cols-2 xl:grid-cols-3'>
                        {cards.map((course, index) => {
                            const variant = gradientVariants[index % gradientVariants.length];
                            const instructorCount = Array.isArray(course.course_instructors) ? course.course_instructors.length : 0;
                            const courseSlug = typeof course.slug === 'string' ? course.slug : String(course.slug ?? index);
                            const excerpt = stripHtml(course.description, 120);
                            const thumbnailUrl = course.thumbnail
                                ? course.thumbnail.startsWith('http')
                                    ? course.thumbnail
                                    : `/storage/${course.thumbnail}`
                                : null;

                            return (
                                <Link
                                    key={`explore-course-${courseSlug}`}
                                    href={CourseController.show.url({ course: courseSlug })}
                                    className='group relative block'
                                >
                                    <div
                                        className={`relative overflow-hidden rounded-3xl border ${variant.border} bg-card shadow-2xl ${variant.shadow} hover:shadow-3xl transition-all duration-300 hover:-translate-y-2`}
                                    >
                                        {/* Thumbnail Section with Dark Overlay */}
                                        <div className='relative h-56 overflow-hidden bg-gradient-to-br from-background/50 to-background'>
                                            {thumbnailUrl ? (
                                                <>
                                                    {/* Base Image Layer */}
                                                    <div className='absolute inset-0'>
                                                        <img
                                                            src={thumbnailUrl}
                                                            alt={course.title || 'Course'}
                                                            className='h-full w-full object-cover opacity-60 transition-all duration-500 group-hover:scale-110 group-hover:opacity-80'
                                                        />
                                                    </div>

                                                    {/* Dark Gradient Overlays - Multiple Layers */}
                                                    <div className='absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent' />
                                                    <div
                                                        className={`absolute inset-0 bg-gradient-to-br ${variant.overlay} opacity-60 transition-opacity group-hover:opacity-80`}
                                                    />
                                                    <div className='absolute inset-0 bg-gradient-to-tr from-background/50 via-transparent to-background/30' />

                                                    {/* Subtle Pattern Overlay */}
                                                    <div
                                                        className='absolute inset-0 opacity-10'
                                                        style={{
                                                            backgroundImage:
                                                                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                                                            backgroundSize: '20px 20px',
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    {/* Fallback Gradient Background */}
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${variant.bg}`} />
                                                    <div className='absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent' />
                                                    <div className='absolute inset-0 flex items-center justify-center'>
                                                        <GraduationCap className='h-16 w-16 text-muted-foreground/20' />
                                                    </div>
                                                </>
                                            )}

                                            {/* Badges on Thumbnail */}
                                            <div className='absolute top-4 right-4 left-4 z-10 flex flex-wrap gap-2'>
                                                {course.level ? (
                                                    <Badge
                                                        variant='secondary'
                                                        className='border-border/50 bg-background/90 shadow-lg backdrop-blur-md'
                                                    >
                                                        {course.level}
                                                    </Badge>
                                                ) : null}
                                                {course.certification_enabled ? (
                                                    <Badge className='border-amber-400/50 bg-amber-500/90 text-white shadow-lg backdrop-blur-md'>
                                                        ✨ Bersertifikat
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className='relative space-y-4 p-6'>
                                            {/* Title */}
                                            <h2 className='line-clamp-2 text-xl leading-tight font-bold text-foreground transition-colors group-hover:text-primary'>
                                                {course.title ?? 'Tanpa judul'}
                                            </h2>

                                            {/* Description */}
                                            {excerpt ? <p className='line-clamp-3 text-sm text-muted-foreground'>{excerpt}</p> : null}

                                            {/* Meta Information */}
                                            <div className='flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground'>
                                                <div className='flex items-center gap-1.5'>
                                                    <Clock className='h-4 w-4' />
                                                    <span>{course.duration_formatted ?? 'Fleksibel'}</span>
                                                </div>
                                                <div className='flex items-center gap-1.5'>
                                                    <Users className='h-4 w-4' />
                                                    <span>{instructorCount} instruktur</span>
                                                </div>
                                            </div>

                                            {/* View Button */}
                                            <Button
                                                variant='ghost'
                                                className='w-full gap-2 rounded-xl border border-border/50 bg-muted/50 transition-all group-hover:border-primary/50 group-hover:bg-primary/5 hover:bg-muted'
                                            >
                                                <span>Lihat Detail</span>
                                                <Sparkles className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {cards.length > 0 && (
                    <div className='flex flex-col items-center gap-6 rounded-3xl border border-border/50 bg-card/80 px-6 py-8 shadow-xl backdrop-blur md:flex-row md:justify-between'>
                        <div className='text-sm text-muted-foreground'>
                            Menampilkan <span className='font-semibold text-foreground'>{courses.from}</span>
                            {' - '}
                            <span className='font-semibold text-foreground'>{courses.to}</span>
                            {' dari '}
                            <span className='text-lg font-bold text-primary'>{courses.total}</span>
                            {' kursus'}
                        </div>
                        <div className='flex items-center gap-3'>
                            <Button
                                variant='outline'
                                size='lg'
                                className='rounded-xl'
                                disabled={!courses.prev_page_url}
                                onClick={() => handlePageNavigate(courses.prev_page_url)}
                            >
                                ← Sebelumnya
                            </Button>
                            <div className='hidden items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-4 py-2 md:flex'>
                                <span className='text-sm font-medium'>Halaman</span>
                                <span className='text-lg font-bold text-primary'>{courses.current_page}</span>
                                <span className='text-sm text-muted-foreground'>/ {courses.last_page}</span>
                            </div>
                            <Button
                                variant='outline'
                                size='lg'
                                className='rounded-xl'
                                disabled={!courses.next_page_url}
                                onClick={() => handlePageNavigate(courses.next_page_url)}
                            >
                                Berikutnya →
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    if (isGuest) {
        return <GuestLayout>{content}</GuestLayout>;
    }

    return <AppLayout>{content}</AppLayout>;
}
