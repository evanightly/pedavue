import CourseController from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type PaginationMeta } from '@/components/ui/data-table-types';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Clock, Compass, GraduationCap, Users } from 'lucide-react';
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
    'from-primary/25 via-primary/5 to-background',
    'from-emerald-500/20 via-background/40 to-background',
    'from-sky-500/25 via-background/40 to-background',
    'from-fuchsia-500/20 via-background/40 to-background',
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

    return (
        <AppLayout>
            <Head title='Eksplor Kursus' />
            <div className='container mx-auto flex flex-col gap-8 py-8'>
                <header className='flex flex-col gap-6 rounded-3xl border bg-card/90 px-6 py-8 shadow-2xl backdrop-blur sm:px-10'>
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                        <div className='space-y-2'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                                <Compass className='h-3.5 w-3.5' />
                                Jelajahi Kursus
                            </div>
                            <h1 className='text-3xl font-bold tracking-tight text-foreground md:text-4xl'>Temukan Kursus yang Tepat</h1>
                            <p className='max-w-2xl text-sm text-muted-foreground'>
                                {isGuest
                                    ? 'Telusuri kursus yang tersedia dan buat akun untuk mengirim permintaan pendaftaran.'
                                    : 'Lihat daftar kursus yang belum Anda ikuti dan ajukan permintaan pendaftaran dengan sekali klik.'}
                            </p>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                            Total kursus tersedia: <span className='font-semibold text-foreground'>{courses.total}</span>
                        </div>
                    </div>
                    <form onSubmit={handleSearchSubmit} className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                        <Input
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder='Cari berdasarkan judul atau deskripsi kursus...'
                            className='h-11 flex-1 rounded-xl border-border bg-background/80 focus-visible:ring-2 focus-visible:ring-primary/40'
                        />
                        <Button type='submit' className='h-11 rounded-xl px-6'>
                            Cari Kursus
                        </Button>
                    </form>
                </header>

                {cards.length === 0 ? (
                    <div className='flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-card/80 px-8 py-16 text-center shadow-inner'>
                        <Compass className='h-12 w-12 text-muted-foreground/60' />
                        <h2 className='text-xl font-semibold text-foreground'>Semua kursus telah Anda jelajahi</h2>
                        <p className='max-w-md text-sm text-muted-foreground'>
                            Kami akan memberi tahu Anda ketika kursus baru tersedia. Coba ubah kata kunci pencarian untuk menemukan opsi lain.
                        </p>
                        <Button variant='outline' onClick={() => handlePageNavigate(CourseController.explore.url())}>
                            Muat ulang daftar
                        </Button>
                    </div>
                ) : (
                    <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                        {cards.map((course, index) => {
                            const gradientClass = gradientVariants[index % gradientVariants.length];
                            const instructorCount = Array.isArray(course.course_instructors) ? course.course_instructors.length : 0;
                            const courseSlug = typeof course.slug === 'string' ? course.slug : String(course.slug ?? index);
                            const excerpt = stripHtml(course.description, 150);

                            return (
                                <div
                                    key={`explore-course-${courseSlug}`}
                                    className='group relative overflow-hidden rounded-3xl border border-border/50 bg-card/90 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl'
                                >
                                    <div
                                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-80 transition group-hover:opacity-90`}
                                    />
                                    <div className='relative flex h-full flex-col justify-between p-6 lg:p-7'>
                                        <div className='space-y-4'>
                                            <div className='flex flex-wrap items-center gap-2'>
                                                {course.level ? (
                                                    <Badge
                                                        variant='outline'
                                                        className='border border-white/40 bg-white/20 text-xs font-medium text-white uppercase shadow-sm backdrop-blur'
                                                    >
                                                        {course.level}
                                                    </Badge>
                                                ) : null}
                                                {course.certification_enabled ? (
                                                    <Badge
                                                        variant='outline'
                                                        className='border border-amber-300/60 bg-amber-200/30 text-xs font-medium text-amber-900 shadow-sm backdrop-blur'
                                                    >
                                                        Bersertifikat
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <h2 className='text-2xl leading-tight font-semibold text-white drop-shadow-lg'>
                                                {course.title ?? 'Tanpa judul'}
                                            </h2>
                                            {excerpt ? <p className='text-sm text-white/80'>{excerpt}</p> : null}
                                        </div>
                                        <div className='mt-6 flex flex-col gap-4'>
                                            <div className='grid grid-cols-2 gap-3 text-xs text-white/90'>
                                                <div className='flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur'>
                                                    <Clock className='h-4 w-4' />
                                                    <span>{course.duration_formatted ?? 'Durasi fleksibel'}</span>
                                                </div>
                                                <div className='flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur'>
                                                    <Users className='h-4 w-4' />
                                                    <span>{instructorCount} instruktur</span>
                                                </div>
                                                <div className='flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur'>
                                                    <GraduationCap className='h-4 w-4' />
                                                    <span>ID #{course.id}</span>
                                                </div>
                                                <div className='flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur'>
                                                    <Compass className='h-4 w-4' />
                                                    <span>Klik untuk detail</span>
                                                </div>
                                            </div>
                                            <Button
                                                asChild
                                                className='h-11 rounded-2xl border border-white/20 bg-white/90 text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-white'
                                            >
                                                <Link href={CourseController.show.url({ course: courseSlug })}>Lihat detail</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className='flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/90 px-4 py-3 shadow-inner md:px-6'>
                    <div className='text-sm text-muted-foreground'>
                        Menampilkan <span className='font-semibold text-foreground'>{courses.from}</span> -{' '}
                        <span className='font-semibold text-foreground'>{courses.to}</span> dari{' '}
                        <span className='font-semibold text-foreground'>{courses.total}</span> kursus.
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            className='rounded-xl'
                            disabled={!courses.prev_page_url}
                            onClick={() => handlePageNavigate(courses.prev_page_url)}
                        >
                            Sebelumnya
                        </Button>
                        <Button
                            variant='outline'
                            className='rounded-xl'
                            disabled={!courses.next_page_url}
                            onClick={() => handlePageNavigate(courses.next_page_url)}
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
