import CourseController from '@/actions/App/Http/Controllers/CourseController';
import AppLogo from '@/components/app-logo';
import InertiaMessenger from '@/components/inertia-messenger';
import { AnimatedThemeSelector } from '@/components/ui/animated-theme-selector';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';
import { Link } from '@inertiajs/react';
import { SwatchBook } from 'lucide-react';
import { type PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className='flex min-h-screen flex-col bg-background text-foreground'>
            <header className='sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur'>
                <div className='mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6'>
                    <Link href='/' className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                        <AppLogo />
                    </Link>
                    <nav className='flex items-center gap-6 text-sm font-medium'>
                        <Link href='/' className='text-muted-foreground transition hover:text-primary'>
                            Beranda
                        </Link>
                        <Link href={CourseController.explore.url()} className='text-muted-foreground transition hover:text-primary'>
                            Eksplor Kursus
                        </Link>
                        <div className='flex items-center gap-2'>
                            <Button asChild variant='ghost' className='px-4'>
                                <Link href={login()}>Masuk</Link>
                            </Button>
                            <Button asChild className='rounded-full px-4'>
                                <Link href={register()}>Daftar</Link>
                            </Button>
                        </div>
                        <div className='flex gap-2 border-l-2 pl-2'>
                            <AnimatedThemeSelector
                                triggerElement={
                                    <Button size='icon' variant='ghost'>
                                        <SwatchBook />
                                    </Button>
                                }
                            />
                            <AnimatedThemeToggler />
                        </div>
                    </nav>
                </div>
            </header>
            <main className='flex-1'>
                <InertiaMessenger />
                {children}
            </main>
        </div>
    );
}
