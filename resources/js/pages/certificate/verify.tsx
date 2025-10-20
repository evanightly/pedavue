import GuestLayout from '@/layouts/guest-layout';
import { Head } from '@inertiajs/react';

interface VerificationPageProps {
    course: {
        id: number;
        title: string;
        slug: string;
    };
    participant: {
        id: number | null;
        name: string | null;
        email: string | null;
    };
    enrollment: {
        id: number;
        completed_at: string | null;
        completed_at_label: string | null;
    };
    certificate: {
        certification_enabled: boolean;
    };
}

export default function CertificateVerify({ course, participant, enrollment, certificate }: VerificationPageProps) {
    return (
        <GuestLayout>
            <Head title={`Verifikasi Sertifikat - ${course.title}`} />

            <section className='mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8'>
                <div className='rounded-3xl border border-border/60 bg-card/90 p-8 shadow-xl backdrop-blur'>
                    <header className='space-y-3 text-center'>
                        <p className='text-sm font-semibold tracking-[0.3em] text-primary uppercase'>Sertifikat Terverifikasi</p>
                        <h1 className='text-3xl font-bold text-foreground sm:text-4xl'>Verifikasi Sertifikat</h1>
                        <p className='text-sm text-muted-foreground'>Sertifikat ini telah diverifikasi dan terdaftar pada sistem PedaVue.</p>
                    </header>

                    <div className='mt-10 grid gap-6 sm:grid-cols-2'>
                        <div className='rounded-2xl border border-border/40 bg-background/70 p-6 shadow-sm'>
                            <h2 className='text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase'>Informasi Kursus</h2>
                            <p className='mt-3 text-xl font-semibold text-foreground'>{course.title}</p>
                            <p className='text-sm text-muted-foreground'>Slug: {course.slug}</p>
                        </div>

                        <div className='rounded-2xl border border-border/40 bg-background/70 p-6 shadow-sm'>
                            <h2 className='text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase'>Peserta</h2>
                            <p className='mt-3 text-xl font-semibold text-foreground'>{participant.name ?? 'Peserta'}</p>
                            <p className='text-sm text-muted-foreground'>{participant.email ?? 'Email tidak tersedia'}</p>
                        </div>

                        <div className='rounded-2xl border border-border/40 bg-background/70 p-6 shadow-sm'>
                            <h2 className='text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase'>Tanggal Penyelesaian</h2>
                            <p className='mt-3 text-xl font-semibold text-foreground'>{enrollment.completed_at_label ?? 'Tanggal tidak tersedia'}</p>
                            <p className='text-sm text-muted-foreground'>ID Enrol: {enrollment.id}</p>
                        </div>

                        <div className='rounded-2xl border border-border/40 bg-background/70 p-6 shadow-sm'>
                            <h2 className='text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase'>Status Sertifikat</h2>
                            <p className='mt-3 text-xl font-semibold text-foreground'>
                                {certificate.certification_enabled ? 'Sertifikat Aktif' : 'Sertifikat Dinonaktifkan'}
                            </p>
                            <p className='text-sm text-muted-foreground'>Sertifikat ini telah dikeluarkan oleh PedaVue.</p>
                        </div>
                    </div>
                </div>

                <div className='grid gap-6 rounded-3xl border border-border/60 bg-card/90 p-8 shadow-xl backdrop-blur sm:grid-cols-2'>
                    <div className='rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-primary'>
                        <h3 className='text-lg font-semibold'>Apa Selanjutnya?</h3>
                        <p className='mt-3 text-sm text-primary/80'>Simpan halaman ini sebagai bukti bahwa sertifikat telah diverifikasi.</p>
                    </div>
                    <div className='rounded-2xl border border-border/40 bg-background/70 p-6 text-sm text-muted-foreground shadow-sm'>
                        Jika Anda memerlukan bantuan tambahan atau menemukan kesalahan, hubungi tim dukungan PedaVue.
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
