import QuizImportController from '@/actions/App/Http/Controllers/QuizImportController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface QuizImportPageProps {
    quiz: App.Data.Quiz.QuizData;
    templateUrl: string;
    existingQuestionCount: number;
    step: 'form' | 'preview';
    preview?: App.Data.QuizImport.QuizImportPreviewData;
}

type ModeOption = 'append' | 'replace';

type ImportFormState = {
    file: File | null;
};

type ConfirmFormState = {
    token: string;
    mode: ModeOption;
};

export default function QuizImportPage({ quiz, templateUrl, existingQuestionCount, step, preview }: QuizImportPageProps) {
    const quizId = useMemo(() => (typeof quiz.id === 'number' ? quiz.id : Number(quiz.id ?? 0)), [quiz.id]);

    const uploadForm = useForm<ImportFormState>({
        file: null,
    });

    const confirmForm = useForm<ConfirmFormState>({
        token: preview?.token ?? '',
        mode: preview && preview.existing_count > 0 ? 'append' : 'replace',
    });

    const [mode, setMode] = useState<ModeOption>(confirmForm.data.mode);
    const { errors } = usePage().props as { errors: Record<string, string | string[]> };

    const serverErrorGroups = useMemo(() => {
        const general = new Set<string>();
        const detailed = new Set<string>();

        Object.entries(errors).forEach(([key, value]) => {
            if (!value) {
                return;
            }

            const list = Array.isArray(value) ? value : [value];
            list.forEach((message) => {
                if (typeof message !== 'string') {
                    return;
                }

                const trimmed = message.trim();
                if (trimmed === '') {
                    return;
                }

                if (key.startsWith('rows.')) {
                    detailed.add(trimmed);
                } else {
                    general.add(trimmed);
                }
            });
        });

        return {
            general: Array.from(general),
            detailed: Array.from(detailed),
        };
    }, [errors]);

    useEffect(() => {
        if (!preview?.token) {
            return;
        }

        const defaultMode: ModeOption = preview.existing_count > 0 ? 'append' : 'replace';
        confirmForm.setData({
            token: preview.token,
            mode: defaultMode,
        });
        setMode(defaultMode);
    }, [preview?.token, preview?.existing_count]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        if (!file) {
            uploadForm.setData('file', null);
            return;
        }

        if (file.size > MAX_EXCEL_FILE_SIZE) {
            uploadForm.setData('file', null);
            uploadForm.setError('file', 'Ukuran berkas melebihi 10 MB. Kecilkan gambar di dalam Excel lalu pilih ulang berkas Anda.');
            event.target.value = '';

            return;
        }

        uploadForm.clearErrors('file');
        uploadForm.setData('file', file);
    };

    const handleUploadSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!uploadForm.data.file) {
            uploadForm.setError('file', 'Pilih berkas Excel terlebih dahulu.');

            return;
        }

        uploadForm.post(QuizImportController.preview.url({ quiz: quizId }), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleConfirm = () => {
        confirmForm.setData('token', preview?.token ?? confirmForm.data.token);
        confirmForm.setData('mode', mode);
        confirmForm.post(QuizImportController.confirm.url({ quiz: quizId }), {
            preserveScroll: true,
        });
    };

    const handleBack = () => {
        router.visit(QuizImportController.show.url({ quiz: quizId }), {
            preserveScroll: true,
        });
    };

    const hasExistingQuestions = (preview?.existing_count ?? existingQuestionCount) > 0;

    return (
        <AppLayout>
            <Head title={`Impor Kuis - ${quiz.name ?? 'Tanpa Judul'}`} />
            <div className='mx-auto w-full max-w-5xl space-y-6 py-10'>
                <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
                    <div className='space-y-2'>
                        <h1 className='text-2xl font-semibold text-foreground'>Impor Pertanyaan Kuis</h1>
                        <p className='text-sm text-muted-foreground'>
                            Unggah templat Excel untuk menambahkan atau mengganti pertanyaan pada kuis ini.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                        <Button asChild variant='outline'>
                            <Link href={templateUrl}>Unduh template Excel</Link>
                        </Button>
                        <Button asChild variant='secondary'>
                            <Link href={QuizImportController.show.url({ quiz: quizId })}>Muat ulang halaman</Link>
                        </Button>
                    </div>
                </div>

                {step === 'form' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Langkah 1 · Unggah berkas</CardTitle>
                            <CardDescription>
                                Template mendukung gambar pertanyaan dan opsi. Jika Anda mengunduhnya dari halaman ini, file akan otomatis memuat
                                pertanyaan yang saat ini dimiliki kuis sehingga Anda bisa melakukan suntingan massal sebelum mengunggah kembali.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='mb-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground'>
                                <p>
                                    Kuis saat ini memiliki <span className='font-semibold text-foreground'>{existingQuestionCount}</span> pertanyaan.{' '}
                                    Anda dapat memilih untuk menambahkan pertanyaan baru atau mengganti seluruh pertanyaan ketika tahap pratinjau
                                    muncul.
                                </p>
                            </div>

                            {(serverErrorGroups.general.length > 0 || serverErrorGroups.detailed.length > 0) && (
                                <Alert variant='destructive'>
                                    <AlertTitle>Impor tidak dapat diproses</AlertTitle>
                                    <AlertDescription className='space-y-3'>
                                        {serverErrorGroups.general.length > 0 && (
                                            <ul className='list-inside list-disc space-y-1'>
                                                {serverErrorGroups.general.map((message) => (
                                                    <li key={message}>{message}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {serverErrorGroups.detailed.length > 0 && (
                                            <div className='space-y-2'>
                                                <p className='text-sm font-semibold text-foreground'>Detail kesalahan per baris</p>
                                                <ul className='list-inside list-disc space-y-1'>
                                                    {serverErrorGroups.detailed.map((message) => (
                                                        <li key={message}>{message}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground'>
                                <p className='mb-2 text-sm font-semibold text-foreground'>Panduan menyusun template</p>
                                <ul className='list-inside list-disc space-y-1'>
                                    <li>
                                        Kolom dengan tanda <span className='font-semibold'>*</span> wajib diisi minimal menggunakan teks atau gambar.
                                    </li>
                                    <li>
                                        Isi kolom <span className='font-semibold'>Jawaban Benar</span> dengan huruf (A, B, C, ...) atau angka (1, 2,
                                        3, ...) sesuai urutan opsi yang benar. Pisahkan lebih dari satu jawaban menggunakan tanda garis miring (/)
                                        jika diperlukan.
                                    </li>
                                    <li>Setiap pertanyaan harus memiliki minimal dua opsi yang berisi teks atau gambar.</li>
                                    <li>
                                        Untuk menambahkan gambar pertanyaan atau opsi, gunakan menu{' '}
                                        <span className='font-semibold'>Insert → Pictures</span>, kemudian pilih pengaturan{' '}
                                        <span className='font-semibold'>Move and size with cells</span> agar gambar mengikuti baris yang sesuai.
                                    </li>
                                    <li>Gunakan gambar berformat JPG, PNG, GIF, BMP, atau WEBP dengan ukuran maksimum 5 MB per gambar.</li>
                                </ul>
                            </div>

                            <form onSubmit={handleUploadSubmit} className='space-y-5'>
                                <div className='space-y-2'>
                                    <Label htmlFor='quiz-import-file'>Berkas Excel</Label>
                                    <Input
                                        id='quiz-import-file'
                                        type='file'
                                        accept='.xlsx,.xls'
                                        onChange={handleFileChange}
                                        disabled={uploadForm.processing}
                                    />
                                    <p className='text-xs text-muted-foreground'>Format .xlsx dianjurkan. Setiap gambar maksimal 5 MB.</p>
                                    {uploadForm.errors.file ? (
                                        <p className='text-sm text-destructive'>{uploadForm.errors.file}</p>
                                    ) : errors.file ? (
                                        <p className='text-sm text-destructive'>
                                            {Array.isArray(errors.file) ? errors.file.join(', ') : errors.file}
                                        </p>
                                    ) : null}
                                </div>
                                <div className='flex items-center justify-between border-t border-border pt-4'>
                                    <p className='text-sm text-muted-foreground'>
                                        Setelah unggah, Anda akan melihat pratinjau sebelum menyimpan perubahan.
                                    </p>
                                    <Button type='submit' disabled={uploadForm.processing}>
                                        {uploadForm.processing ? 'Mengunggah…' : 'Lanjutkan ke pratinjau'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'preview' && preview && (
                    <div className='space-y-6'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Langkah 2 · Tinjau hasil impor</CardTitle>
                                <CardDescription>
                                    Periksa ringkasan berikut sebelum menyimpan ke kuis. Anda dapat memilih untuk menambahkan ke pertanyaan yang ada
                                    atau menggantinya seluruhnya.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-5'>
                                <div className='grid gap-4 sm:grid-cols-3'>
                                    <SummaryTile
                                        title='Pertanyaan baru'
                                        value={preview.imported_count.toString()}
                                        description='Jumlah pertanyaan dari berkas impor.'
                                    />
                                    <SummaryTile
                                        title='Pertanyaan saat ini'
                                        value={preview.existing_count.toString()}
                                        description='Pertanyaan yang sudah ada pada kuis ini.'
                                    />
                                    <SummaryTile
                                        title='Mode impor'
                                        value={mode === 'append' ? 'Gabungkan' : 'Ganti semua'}
                                        description={
                                            mode === 'append'
                                                ? 'Pertanyaan baru ditambahkan di akhir daftar.'
                                                : 'Pertanyaan lama akan diganti sepenuhnya.'
                                        }
                                    />
                                </div>

                                {preview.warnings.length > 0 && (
                                    <Alert variant='destructive'>
                                        <AlertTitle>Perhatian</AlertTitle>
                                        <AlertDescription>
                                            <ul className='list-inside list-disc space-y-1'>
                                                {preview.warnings.map((warning, warningIndex) => (
                                                    <li key={`warning-${warningIndex}`}>{warning}</li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className='space-y-3'>
                                    <Label>Pilih tindakan saat menyimpan</Label>
                                    <ToggleGroup
                                        type='single'
                                        value={mode}
                                        onValueChange={(value) => {
                                            if (value === 'append' || value === 'replace') {
                                                setMode(value);
                                                confirmForm.setData('mode', value);
                                            }
                                        }}
                                        className='w-full justify-start'
                                    >
                                        <ToggleGroupItem
                                            value='append'
                                            className={cn('flex-1 justify-center', mode === 'append' && 'ring-2 ring-primary')}
                                        >
                                            Gabungkan dengan pertanyaan yang ada
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            value='replace'
                                            disabled={!hasExistingQuestions}
                                            className={cn('flex-1 justify-center', mode === 'replace' && 'ring-2 ring-primary')}
                                        >
                                            Ganti semua pertanyaan saat ini
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                    {!hasExistingQuestions && (
                                        <p className='text-xs text-muted-foreground'>
                                            Kuis belum memiliki pertanyaan, sehingga opsi ganti otomatis dipilih.
                                        </p>
                                    )}
                                </div>

                                <div className='grid gap-6 lg:grid-cols-2'>
                                    <QuestionPreviewSection
                                        title='Pertanyaan dari berkas'
                                        description='Daftar pertanyaan yang akan ditambahkan.'
                                        badgeLabel='Baru'
                                        items={preview.incomingQuestions}
                                        emptyMessage='Tidak ada pertanyaan terdeteksi pada berkas.'
                                    />
                                    <QuestionPreviewSection
                                        title='Pertanyaan saat ini'
                                        description='Pertanyaan yang sudah ada sebelum impor.'
                                        badgeLabel='Saat ini'
                                        items={preview.existingQuestions ?? []}
                                        emptyMessage='Kuis ini belum memiliki pertanyaan.'
                                    />
                                </div>

                                <div className='flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between'>
                                    <div className='text-sm text-muted-foreground'>Pastikan semua data sudah sesuai sebelum melanjutkan.</div>
                                    <div className='flex gap-2'>
                                        <Button type='button' variant='ghost' onClick={handleBack} disabled={confirmForm.processing}>
                                            Kembali
                                        </Button>
                                        <Button type='button' onClick={handleConfirm} disabled={confirmForm.processing}>
                                            {confirmForm.processing ? 'Mengimpor…' : 'Simpan ke kuis'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

interface SummaryTileProps {
    title: string;
    value: string;
    description: string;
}

function SummaryTile({ title, value, description }: SummaryTileProps) {
    return (
        <div className='rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='mt-1 text-2xl font-semibold text-foreground'>{value}</p>
            <p className='mt-2 text-xs text-muted-foreground'>{description}</p>
        </div>
    );
}

interface QuestionPreviewSectionProps {
    title: string;
    description: string;
    badgeLabel: string;
    items: App.Data.QuizImport.QuizImportQuestionPreviewData[];
    emptyMessage: string;
}

function QuestionPreviewSection({ title, description, badgeLabel, items, emptyMessage }: QuestionPreviewSectionProps) {
    return (
        <Card className='h-full'>
            <CardHeader>
                <CardTitle className='text-lg'>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>{emptyMessage}</p>
                ) : (
                    <ScrollArea className='h-[32rem] pr-4'>
                        <div className='space-y-4'>
                            {items.map((question) => (
                                <div key={question.label} className='rounded-lg border border-border/60 p-4 shadow-sm'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-sm font-semibold text-foreground'>{question.label}</p>
                                            <p className='text-sm text-muted-foreground'>{question.question ?? 'Tanpa teks pertanyaan'}</p>
                                        </div>
                                        <Badge variant='outline'>{badgeLabel}</Badge>
                                    </div>
                                    {question.has_image && question.image_preview ? (
                                        <img
                                            src={question.image_preview}
                                            alt={`Pratinjau ${question.label}`}
                                            className='mt-3 h-32 w-32 rounded-md border border-border/60 object-cover'
                                        />
                                    ) : null}
                                    <div className='mt-4 space-y-2'>
                                        {question.options.items?.map((option: App.Data.QuizImport.QuizImportOptionPreviewData) => (
                                            <div
                                                key={`${question.label}-${option.label}`}
                                                className='rounded-md border border-border/40 bg-muted/40 p-3 text-sm'
                                            >
                                                <div className='flex items-center justify-between gap-3'>
                                                    <span className='font-medium text-foreground'>{option.label}</span>
                                                    {option.is_correct ? (
                                                        <Badge variant='default'>Benar</Badge>
                                                    ) : (
                                                        <Badge variant='secondary'>Alternatif</Badge>
                                                    )}
                                                </div>
                                                <p className='mt-1 text-sm text-muted-foreground'>{option.option_text ?? 'Tanpa teks jawaban'}</p>
                                                {option.has_image && option.image_preview ? (
                                                    <img
                                                        src={option.image_preview}
                                                        alt={`Pratinjau ${option.label}`}
                                                        className='mt-3 h-24 w-24 rounded border border-border/60 object-cover'
                                                    />
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
