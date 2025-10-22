import QuizController from '@/actions/App/Http/Controllers/QuizController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useMemo } from 'react';

interface QuizShowPageProps {
    quiz: App.Data.Quiz.QuizData;
    templateUrl: string;
    importUrl: string;
    questionsCount: number;
}

type QuizQuestionRecord = App.Data.QuizQuestion.QuizQuestionData;
type QuizOptionRecord = App.Data.QuizQuestionOption.QuizQuestionOptionData;

type DataCollection<T> = { data: T[] } | T[] | null | undefined;

const optionLabel = (index: number) => String.fromCharCode(65 + index);

const normalizeDataCollection = <T,>(value: DataCollection<T>): T[] => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
        return ((value as { data?: unknown }).data ?? []) as T[];
    }

    return [];
};

const formatDuration = (value: unknown): string | null => {
    const numeric = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

    if (!Number.isFinite(numeric) || numeric <= 0) {
        return null;
    }

    const hours = Math.floor(numeric / 60);
    const minutes = numeric % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours} jam ${minutes} menit`;
    }

    if (hours > 0) {
        return `${hours} jam`;
    }

    return `${minutes} menit`;
};

export default function QuizShowPage({ quiz, templateUrl, importUrl, questionsCount }: QuizShowPageProps) {
    const questions = useMemo(() => normalizeDataCollection<QuizQuestionRecord>(quiz.quiz_questions ?? []), [quiz.quiz_questions]);

    const resolvedQuestions = questions.length > 0 ? questions : [];
    const hasQuestions = resolvedQuestions.length > 0;

    return (
        <AppLayout>
            <Head title={`Detail Kuis - ${quiz.name ?? 'Tanpa Judul'}`} />
            <div className='mx-auto w-full max-w-5xl space-y-6 py-10'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <ArrowLeft className='h-4 w-4' />
                            <Link href={QuizController.index().url} className='hover:text-foreground'>
                                Kembali ke daftar kuis
                            </Link>
                        </div>
                        <h1 className='text-3xl font-semibold text-foreground'>{quiz.name ?? 'Tanpa Judul'}</h1>
                        <p className='text-sm text-muted-foreground'>Tinjau detail kuis dan daftar pertanyaan yang tersedia.</p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                        <Button asChild variant='outline'>
                            <a href={templateUrl} target='_blank' rel='noreferrer' className='flex items-center gap-2'>
                                <Download className='h-4 w-4' /> Unduh template
                            </a>
                        </Button>
                        <Button asChild>
                            <Link href={importUrl} className='flex items-center gap-2'>
                                <Upload className='h-4 w-4' /> Impor pertanyaan
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ringkasan kuis</CardTitle>
                        <CardDescription>Informasi umum mengenai kuis ini.</CardDescription>
                    </CardHeader>
                    <CardContent className='grid gap-6 md:grid-cols-3'>
                        <SummaryTile
                            icon={Clock}
                            title='Durasi'
                            value={formatDuration(quiz.duration) ?? 'Tidak diatur'}
                            description='Durasi pengerjaan kuis untuk peserta.'
                        />
                        <SummaryTile
                            icon={FileSpreadsheet}
                            title='Jumlah pertanyaan'
                            value={String(questionsCount)}
                            description='Total pertanyaan yang dimiliki kuis.'
                        />
                        <SummaryTile
                            icon={Upload}
                            title='Status pengacakan'
                            value={quiz.is_question_shuffled ? 'Diacak' : 'Urutan tetap'}
                            description='Menentukan apakah pertanyaan akan ditampilkan secara acak.'
                        />
                    </CardContent>
                </Card>

                {quiz.description ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Deskripsi</CardTitle>
                            <CardDescription>Penjelasan singkat mengenai tujuan kuis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm leading-relaxed text-foreground'>{quiz.description}</p>
                        </CardContent>
                    </Card>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar pertanyaan</CardTitle>
                        <CardDescription>
                            {hasQuestions
                                ? 'Pertanyaan-pertanyaan berikut akan ditampilkan kepada peserta kuis.'
                                : 'Kuis ini belum memiliki pertanyaan. Gunakan tombol impor atau tambahkan pertanyaan secara manual.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {hasQuestions ? (
                            resolvedQuestions.map((question, index) => {
                                const options = normalizeDataCollection<QuizOptionRecord>(question.quiz_question_options ?? []);

                                return (
                                    <div key={question.id ?? index} className='space-y-4 rounded-xl border border-border/60 p-4 shadow-sm'>
                                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                            <div className='space-y-2'>
                                                <h3 className='text-base font-semibold text-foreground'>Pertanyaan {index + 1}</h3>
                                                <p className='text-sm text-foreground'>{question.question ?? 'Pertanyaan belum diisi.'}</p>
                                            </div>
                                            {question.question_image_url ? (
                                                <img
                                                    src={question.question_image_url}
                                                    alt={`Gambar pertanyaan ${index + 1}`}
                                                    className='h-24 w-24 rounded-md border border-border/60 object-cover'
                                                />
                                            ) : null}
                                        </div>
                                        <div className='space-y-3'>
                                            <p className='text-sm font-medium text-foreground'>Pilihan jawaban</p>
                                            <div className='grid gap-3 sm:grid-cols-2'>
                                                {options.map((option, optionIndex) => {
                                                    const isCorrect = Boolean(option.is_correct);
                                                    const optionImage = option.option_image_url;

                                                    return (
                                                        <div
                                                            key={option.id ?? `${question.id}-${optionIndex}`}
                                                            className={cn(
                                                                'flex h-full flex-col gap-3 rounded-lg border border-border/60 p-3 transition-shadow',
                                                                isCorrect ? 'border-success bg-success/5 shadow-sm' : 'bg-muted/30',
                                                            )}
                                                        >
                                                            <div className='flex items-center justify-between gap-2'>
                                                                <span className='text-sm font-semibold text-foreground'>
                                                                    Jawaban {optionLabel(optionIndex)}
                                                                </span>
                                                                {isCorrect ? <Badge variant='success'>Benar</Badge> : null}
                                                            </div>
                                                            <p className='text-sm text-muted-foreground'>
                                                                {option.option_text && option.option_text.trim() !== ''
                                                                    ? option.option_text
                                                                    : 'Belum ada teks jawaban.'}
                                                            </p>
                                                            {optionImage ? (
                                                                <img
                                                                    src={optionImage}
                                                                    alt={`Gambar jawaban ${optionLabel(optionIndex)}`}
                                                                    className='h-20 w-full rounded-md border border-border/50 object-cover'
                                                                />
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className='rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground'>
                                Belum ada pertanyaan yang terdaftar untuk kuis ini.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface SummaryTileProps {
    icon: typeof Clock;
    title: string;
    value: string;
    description: string;
}

function SummaryTile({ icon: Icon, title, value, description }: SummaryTileProps) {
    return (
        <div className='flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Icon className='h-5 w-5' />
            </div>
            <div className='space-y-1'>
                <p className='text-sm font-semibold text-foreground'>{title}</p>
                <p className='text-xl font-bold text-foreground'>{value}</p>
                <p className='text-xs text-muted-foreground'>{description}</p>
            </div>
        </div>
    );
}
