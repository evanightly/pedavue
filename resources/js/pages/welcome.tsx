import CourseController from '@/actions/App/Http/Controllers/CourseController';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import { AnimatedThemeSelector } from '@/components/ui/animated-theme-selector';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { MagicCard } from '@/components/ui/magic-card';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Award, BookOpen, GraduationCap, LayoutDashboard, Sparkles, SwatchBook, TrendingUp, Users, Zap } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = auth?.user !== null;

    return (
        <>
            <Head title='Selamat Datang - PedaVue'>
                <link rel='preconnect' href='https://fonts.bunny.net' />
                <link href='https://fonts.bunny.net/css?family=instrument-sans:400,500,600' rel='stylesheet' />
            </Head>

            {/* Hero Section with Animated Background */}
            <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10'>
                {/* Animated Grid Background */}
                <div className='absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:4rem_4rem]' />

                {/* Floating Orbs */}
                <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                    <div className='absolute top-1/4 -left-4 h-72 w-72 animate-pulse rounded-full bg-primary/20 blur-3xl' />
                    <div className='animation-delay-2000 absolute top-1/3 right-1/4 h-96 w-96 animate-pulse rounded-full bg-emerald-500/10 blur-3xl' />
                    <div className='animation-delay-4000 absolute bottom-1/4 left-1/3 h-80 w-80 animate-pulse rounded-full bg-sky-500/10 blur-3xl' />
                </div>

                {/* Navigation */}
                <nav className='relative z-10 flex items-center justify-between px-6 py-6 lg:px-12'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                            <GraduationCap className='h-7 w-7 text-primary-foreground' />
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold tracking-tight text-foreground'>PedaVue</h1>
                            <p className='text-xs text-muted-foreground'>Platform Pembelajaran Modern</p>
                        </div>
                    </div>

                    <div className='flex items-center gap-3'>
                        <div className='flex gap-4 border-r-2 pr-4'>
                            <AnimatedThemeSelector
                                triggerElement={
                                    <Button size='icon' variant='ghost'>
                                        <SwatchBook />
                                    </Button>
                                }
                            />
                            <AnimatedThemeToggler />
                        </div>
                        {isAuthenticated ? (
                            <div className='flex flex-wrap items-center gap-2'>
                                <Button asChild variant='secondary' className='gap-2 rounded-xl shadow-lg'>
                                    <Link href={DashboardController.index.url()}>
                                        <LayoutDashboard className='h-4 w-4' />
                                        Dasbor
                                    </Link>
                                </Button>
                                <Button asChild variant='default' className='gap-2 rounded-xl shadow-lg'>
                                    <Link href={CourseController.explore.url()}>
                                        <Sparkles className='h-4 w-4' />
                                        Eksplor Kursus
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button asChild variant='ghost' className='rounded-xl'>
                                    <Link href={login()}>Masuk</Link>
                                </Button>
                                <Button asChild variant='default' className='gap-2 rounded-xl shadow-lg'>
                                    <Link href={register()}>
                                        Daftar Sekarang
                                        <ArrowRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero Content */}
                <div className='relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 lg:px-12 lg:pt-32'>
                    <div className='grid gap-12 lg:grid-cols-2 lg:gap-16'>
                        <div className='flex flex-col justify-center space-y-8'>
                            <div className='inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur'>
                                <Sparkles className='h-4 w-4' />
                                Platform E-Learning Terdepan
                            </div>

                            <div className='space-y-6'>
                                <h1 className='text-5xl leading-tight font-bold tracking-tight text-foreground lg:text-7xl'>
                                    Wujudkan{' '}
                                    <span className='bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent'>
                                        Potensi
                                    </span>{' '}
                                    Terbaikmu
                                </h1>
                                <p className='text-lg text-muted-foreground lg:text-xl'>
                                    Bergabunglah dengan ribuan pelajar dalam perjalanan transformasi pembelajaran digital. Akses kursus berkualitas,
                                    dapatkan sertifikasi, dan raih kesuksesan kariermu.
                                </p>
                            </div>

                            <div className='flex flex-col gap-4 sm:flex-row'>
                                {isAuthenticated ? (
                                    <>
                                        <Button asChild size='lg' className='gap-2 text-base shadow-xl'>
                                            <Link href={CourseController.explore.url()}>
                                                Mulai Belajar
                                                <ArrowRight className='h-5 w-5' />
                                            </Link>
                                        </Button>
                                        <Button asChild size='lg' variant='outline' className='gap-2 text-base'>
                                            <Link href={DashboardController.index.url()}>
                                                Ke Dasbor
                                                <LayoutDashboard className='h-5 w-5' />
                                            </Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button asChild size='lg' className='gap-2 text-base shadow-xl'>
                                            <Link href={register()}>
                                                Mulai Gratis
                                                <ArrowRight className='h-5 w-5' />
                                            </Link>
                                        </Button>
                                        <Button asChild size='lg' variant='outline' className='text-base'>
                                            <Link href={CourseController.explore.url()}>Jelajahi Kursus</Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Stats */}
                            <div className='grid grid-cols-3 gap-6 pt-8'>
                                <div className='space-y-1'>
                                    <div className='text-3xl font-bold text-foreground'>100+</div>
                                    <div className='text-sm text-muted-foreground'>Kursus Tersedia</div>
                                </div>
                                <div className='space-y-1'>
                                    <div className='text-3xl font-bold text-foreground'>5K+</div>
                                    <div className='text-sm text-muted-foreground'>Peserta Aktif</div>
                                </div>
                                <div className='space-y-1'>
                                    <div className='text-3xl font-bold text-foreground'>98%</div>
                                    <div className='text-sm text-muted-foreground'>Kepuasan</div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Cards */}
                        <div className='grid gap-6'>
                            <MagicCard className='group hover:shadow-3xl relative flex overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur transition-all hover:-translate-y-1'>
                                <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                                <div className='relative flex h-full flex-col justify-center space-y-4 p-8'>
                                    <div className='flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80'>
                                        <BookOpen className='h-7 w-7 text-primary-foreground' />
                                    </div>
                                    <h3 className='text-2xl font-semibold text-foreground'>Pembelajaran Interaktif</h3>
                                    <p className='text-muted-foreground'>
                                        Materi berkualitas dengan video HD, kuis interaktif, dan latihan praktis untuk pengalaman belajar optimal.
                                    </p>
                                </div>
                            </MagicCard>

                            <div className='grid gap-6 sm:grid-cols-2'>
                                <MagicCard
                                    childrenClassName='h-full'
                                    className='group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-xl backdrop-blur transition-all hover:-translate-y-1 hover:shadow-2xl'
                                >
                                    <div className='absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                                    <div className='relative flex h-full flex-1 flex-col justify-center space-y-3 p-6'>
                                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600'>
                                            <Award className='h-6 w-6 text-white' />
                                        </div>
                                        <h3 className='text-lg font-semibold text-foreground'>Sertifikat Resmi</h3>
                                        <p className='text-sm text-muted-foreground'>Dapatkan sertifikat yang diakui industri.</p>
                                    </div>
                                </MagicCard>

                                <MagicCard
                                    childrenClassName='h-full'
                                    className='group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-xl backdrop-blur transition-all hover:-translate-y-1 hover:shadow-2xl'
                                >
                                    <div className='absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
                                    <div className='relative flex h-full flex-1 flex-col justify-center space-y-3 p-6'>
                                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600'>
                                            <Users className='h-6 w-6 text-white' />
                                        </div>
                                        <h3 className='text-lg font-semibold text-foreground'>Instruktur Expert</h3>
                                        <p className='text-sm text-muted-foreground'>Belajar dari praktisi berpengalaman.</p>
                                    </div>
                                </MagicCard>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className='relative z-10 border-t border-border/50 bg-card/30 py-24 backdrop-blur'>
                    <div className='mx-auto max-w-7xl px-6 lg:px-12'>
                        <div className='text-center'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary'>
                                <Zap className='h-4 w-4' />
                                Kenapa Memilih PedaVue?
                            </div>
                            <h2 className='mt-6 text-4xl font-bold text-foreground lg:text-5xl'>Fitur Unggulan Kami</h2>
                        </div>

                        <div className='mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                            {[
                                {
                                    icon: BookOpen,
                                    title: 'Materi Lengkap',
                                    description: 'Akses ke perpustakaan materi pembelajaran yang komprehensif dan selalu diperbarui.',
                                    color: 'from-primary to-primary/80',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Progress Tracking',
                                    description: 'Pantau kemajuan belajarmu dengan dashboard analitik yang detail dan mudah dipahami.',
                                    color: 'from-emerald-500 to-emerald-600',
                                },
                                {
                                    icon: Award,
                                    title: 'Sertifikasi Digital',
                                    description: 'Raih sertifikat digital yang terverifikasi dan dapat dibagikan ke profesional network.',
                                    color: 'from-amber-500 to-amber-600',
                                },
                                {
                                    icon: Users,
                                    title: 'Komunitas Aktif',
                                    description: 'Bergabung dengan komunitas pelajar dan instruktur untuk diskusi dan networking.',
                                    color: 'from-sky-500 to-sky-600',
                                },
                                {
                                    icon: Zap,
                                    title: 'Belajar Fleksibel',
                                    description: 'Belajar kapan saja, di mana saja dengan akses lifetime ke semua materi kursus.',
                                    color: 'from-purple-500 to-purple-600',
                                },
                                {
                                    icon: Sparkles,
                                    title: 'Konten Premium',
                                    description: 'Nikmati konten eksklusif dengan kualitas production-grade dari para ahli.',
                                    color: 'from-pink-500 to-pink-600',
                                },
                            ].map((feature, index) => (
                                <MagicCard
                                    key={index}
                                    className='group relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl'
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-5`}
                                    />
                                    <div className='relative space-y-4 p-8'>
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                                            <feature.icon className='h-7 w-7 text-white' />
                                        </div>
                                        <h3 className='text-xl font-semibold text-foreground'>{feature.title}</h3>
                                        <p className='text-muted-foreground'>{feature.description}</p>
                                    </div>
                                </MagicCard>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className='relative z-10 py-24'>
                    <div className='mx-auto max-w-4xl px-6 text-center lg:px-12'>
                        <MagicCard className='relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card p-12 shadow-2xl backdrop-blur lg:p-16'>
                            <div className='absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:2rem_2rem]' />
                            <div className='relative space-y-6'>
                                <h2 className='text-4xl font-bold text-foreground lg:text-5xl'>Siap Memulai Perjalananmu?</h2>
                                <p className='text-lg text-muted-foreground'>
                                    Bergabunglah dengan ribuan pelajar yang telah merasakan transformasi pembelajaran bersama PedaVue.
                                </p>
                                <div className='flex flex-col justify-center gap-4 pt-4 sm:flex-row'>
                                    {isAuthenticated ? (
                                        <Button asChild size='lg' className='gap-2 text-base shadow-xl'>
                                            <Link href={CourseController.explore.url()}>
                                                Eksplor Kursus
                                                <ArrowRight className='h-5 w-5' />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button asChild size='lg' className='gap-2 text-base shadow-xl'>
                                                <Link href={register()}>
                                                    Daftar Gratis
                                                    <ArrowRight className='h-5 w-5' />
                                                </Link>
                                            </Button>
                                            <Button asChild size='lg' variant='outline' className='text-base backdrop-blur'>
                                                <Link href={CourseController.explore.url()}>Lihat Kursus</Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </MagicCard>
                    </div>
                </div>

                {/* Footer */}
                <footer className='relative z-10 border-t border-border/50 bg-card/30 py-12 backdrop-blur'>
                    <div className='mx-auto max-w-7xl px-6 lg:px-12'>
                        <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
                            <div className='flex items-center gap-3'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80'>
                                    <GraduationCap className='h-6 w-6 text-primary-foreground' />
                                </div>
                                <span className='text-lg font-semibold text-foreground'>PedaVue</span>
                            </div>
                            <p className='text-sm text-muted-foreground'>© 2025 PedaVue. Platform Pembelajaran Modern Indonesia.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
