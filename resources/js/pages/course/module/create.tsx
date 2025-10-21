import CourseController from '@/actions/App/Http/Controllers/CourseController';
import CourseModuleController from '@/actions/App/Http/Controllers/CourseModuleController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Layers, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from 'react';

interface QuizOption {
    id: number;
    name: string | null;
    duration?: number | null;
}

type StageType = 'content' | 'quiz';
type QuizMode = 'new' | 'existing';

interface QuizOptionState {
    option_text: string;
    is_correct: boolean;
    option_image: File | null;
    existing_option_image: string | null;
    option_image_url: string | null;
    remove_option_image: boolean;
}

interface QuizQuestionState {
    question: string;
    is_answer_shuffled: boolean;
    question_image: File | null;
    existing_question_image: string | null;
    question_image_url: string | null;
    remove_question_image: boolean;
    options: QuizOptionState[];
}

interface QuizFormState {
    name: string;
    description: string;
    duration: string;
    is_question_shuffled: boolean;
    type: string;
    questions: QuizQuestionState[];
}

interface StageDraft {
    id: string;
    type: StageType;
    order: number;
    quizMode: QuizMode;
    content: {
        title: string;
        description: string;
        content_type: string;
        duration: string;
        content_url: string;
        file: File | null;
    };
    quiz_id: string;
    quiz: QuizFormState;
}

const buildEmptyOption = (markCorrect = false): QuizOptionState => ({
    option_text: '',
    is_correct: markCorrect,
    option_image: null,
    existing_option_image: null,
    option_image_url: null,
    remove_option_image: false,
});

const buildEmptyQuestion = (): QuizQuestionState => ({
    question: '',
    is_answer_shuffled: false,
    question_image: null,
    existing_question_image: null,
    question_image_url: null,
    remove_question_image: false,
    options: [buildEmptyOption(true), buildEmptyOption()],
});

const buildEmptyQuiz = (): QuizFormState => ({
    name: '',
    description: '',
    duration: '',
    is_question_shuffled: false,
    type: 'module',
    questions: [buildEmptyQuestion()],
});

const mapQuizStateToPayload = (quiz: QuizFormState) => ({
    name: quiz.name,
    description: quiz.description.trim() === '' ? null : quiz.description,
    duration: quiz.duration ? Number.parseInt(quiz.duration, 10) : null,
    is_question_shuffled: quiz.is_question_shuffled,
    type: quiz.type.trim() === '' ? null : quiz.type,
    questions: quiz.questions.map((question, questionIndex) => ({
        question: question.question,
        question_image: question.question_image,
        existing_question_image: question.existing_question_image,
        remove_question_image: question.remove_question_image,
        is_answer_shuffled: question.is_answer_shuffled,
        order: questionIndex + 1,
        options: question.options.map((option, optionIndex) => ({
            option_text: option.option_text,
            is_correct: option.is_correct,
            order: optionIndex + 1,
            option_image: option.option_image,
            existing_option_image: option.existing_option_image,
            remove_option_image: option.remove_option_image,
        })),
    })),
});

interface ModuleCreateProps {
    course: {
        id: number;
        title: string | null;
        slug: string;
    };
    quizzes: QuizOption[];
}

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024;
const MAX_STAGE_FILE_SIZE = 20 * 1024 * 1024;

function generateStageId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `stage-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createStageDraft(type: StageType, order: number): StageDraft {
    return {
        id: generateStageId(),
        type,
        order,
        quizMode: type === 'quiz' ? 'new' : 'existing',
        content: {
            title: '',
            description: '',
            content_type: '',
            duration: '',
            content_url: '',
            file: null,
        },
        quiz_id: '',
        quiz: buildEmptyQuiz(),
    };
}

export default function CourseModuleCreate({ course, quizzes }: ModuleCreateProps) {
    const [stages, setStages] = useState<StageDraft[]>([createStageDraft('content', 1)]);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [stageFileErrors, setStageFileErrors] = useState<Record<string, string>>({});

    const quizOptions = useMemo(() => quizzes ?? [], [quizzes]);

    const form = useForm({
        title: '',
        description: '',
        duration: '',
        order: '',
        thumbnail: null as File | null,
    });

    const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        if (file && file.size > MAX_THUMBNAIL_SIZE) {
            form.setError('thumbnail', 'Ukuran gambar maksimal 2 MB. Pilih berkas lain.');
            event.target.value = '';
            setThumbnailPreview(null);
            form.setData('thumbnail', null);

            return;
        }

        form.clearErrors('thumbnail');
        form.setData('thumbnail', file ?? null);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setThumbnailPreview(typeof reader.result === 'string' ? reader.result : null);
            };
            reader.readAsDataURL(file);
        } else {
            setThumbnailPreview(null);
        }
    };

    const setStageFileError = (stageId: string, message: string | null) => {
        setStageFileErrors((current) => {
            const next = { ...current };

            if (message === null) {
                delete next[stageId];
            } else {
                next[stageId] = message;
            }

            return next;
        });
    };

    const handleStageTypeChange = (stageId: string, nextType: StageType) => {
        if (nextType !== 'content') {
            setStageFileError(stageId, null);
        }

        setStages((current) =>
            current.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          type: nextType,
                          quizMode: nextType === 'quiz' ? 'new' : stage.quizMode,
                          quiz_id: '',
                          quiz: nextType === 'quiz' ? buildEmptyQuiz() : stage.quiz,
                          content:
                              nextType === 'content'
                                  ? {
                                        title: '',
                                        description: '',
                                        content_type: '',
                                        duration: '',
                                        content_url: '',
                                        file: null,
                                    }
                                  : stage.content,
                      }
                    : stage,
            ),
        );
    };

    const handleStageOrderChange = (stageId: string, value: string) => {
        setStages((current) =>
            current.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          order: Number.isNaN(Number.parseInt(value, 10)) ? stage.order : Number.parseInt(value, 10),
                      }
                    : stage,
            ),
        );
    };

    const handleQuizSelection = (stageId: string, value: string) => {
        setStages((current) =>
            current.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          quiz_id: value,
                      }
                    : stage,
            ),
        );
    };

    const handleContentFieldChange = (stageId: string, field: keyof StageDraft['content'], value: string | File | null) => {
        setStages((current) =>
            current.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          content: {
                              ...stage.content,
                              [field]: field === 'file' ? (value as File | null) : (value as string),
                          },
                      }
                    : stage,
            ),
        );
    };

    const handleQuizModeChange = (stageId: string, mode: QuizMode) => {
        setStages((current) =>
            current.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          quizMode: mode,
                          quiz_id: mode === 'existing' ? stage.quiz_id : '',
                          quiz: mode === 'new' ? buildEmptyQuiz() : stage.quiz,
                      }
                    : stage,
            ),
        );
    };

    const updateStageQuiz = (stageId: string, updater: (quiz: QuizFormState) => QuizFormState) => {
        setStages((current) => current.map((stage) => (stage.id === stageId ? { ...stage, quiz: updater(stage.quiz) } : stage)));
    };

    const handleQuizFieldChange = <K extends keyof QuizFormState>(stageId: string, field: K, value: QuizFormState[K]) => {
        updateStageQuiz(stageId, (quiz) => ({ ...quiz, [field]: value }));
    };

    const updateStageQuizQuestions = (stageId: string, updater: (questions: QuizQuestionState[]) => QuizQuestionState[]) => {
        updateStageQuiz(stageId, (quiz) => ({ ...quiz, questions: updater(quiz.questions) }));
    };

    const handleQuizQuestionFieldChange = <K extends keyof QuizQuestionState>(
        stageId: string,
        questionIndex: number,
        field: K,
        value: QuizQuestionState[K],
    ) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, index) => (index === questionIndex ? { ...question, [field]: value } : question)),
        );
    };

    const handleQuizQuestionImageChange = (stageId: string, questionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, index) =>
                index === questionIndex
                    ? {
                          ...question,
                          question_image: file ?? null,
                          remove_question_image: false,
                      }
                    : question,
            ),
        );
    };

    const handleQuizQuestionImageRemove = (stageId: string, questionIndex: number) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, index) =>
                index === questionIndex
                    ? {
                          ...question,
                          question_image: null,
                          existing_question_image: null,
                          question_image_url: null,
                          remove_question_image: true,
                      }
                    : question,
            ),
        );
    };

    const handleQuizOptionFieldChange = <K extends keyof QuizOptionState>(
        stageId: string,
        questionIndex: number,
        optionIndex: number,
        field: K,
        value: QuizOptionState[K],
    ) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, qIndex) =>
                qIndex === questionIndex
                    ? {
                          ...question,
                          options: question.options.map((option, oIndex) => (oIndex === optionIndex ? { ...option, [field]: value } : option)),
                      }
                    : question,
            ),
        );
    };

    const handleQuizOptionImageChange = (stageId: string, questionIndex: number, optionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, qIndex) =>
                qIndex === questionIndex
                    ? {
                          ...question,
                          options: question.options.map((option, oIndex) =>
                              oIndex === optionIndex
                                  ? {
                                        ...option,
                                        option_image: file ?? null,
                                        remove_option_image: false,
                                    }
                                  : option,
                          ),
                      }
                    : question,
            ),
        );
    };

    const handleQuizOptionImageRemove = (stageId: string, questionIndex: number, optionIndex: number) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, qIndex) =>
                qIndex === questionIndex
                    ? {
                          ...question,
                          options: question.options.map((option, oIndex) =>
                              oIndex === optionIndex
                                  ? {
                                        ...option,
                                        option_image: null,
                                        existing_option_image: null,
                                        option_image_url: null,
                                        remove_option_image: true,
                                    }
                                  : option,
                          ),
                      }
                    : question,
            ),
        );
    };

    const addQuizQuestion = (stageId: string) => {
        updateStageQuizQuestions(stageId, (questions) => [...questions, buildEmptyQuestion()]);
    };

    const removeQuizQuestion = (stageId: string, questionIndex: number) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.length <= 1 ? questions : questions.filter((_, index) => index !== questionIndex),
        );
    };

    const addQuizOption = (stageId: string, questionIndex: number) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, index) =>
                index === questionIndex ? { ...question, options: [...question.options, buildEmptyOption()] } : question,
            ),
        );
    };

    const removeQuizOption = (stageId: string, questionIndex: number, optionIndex: number) => {
        updateStageQuizQuestions(stageId, (questions) =>
            questions.map((question, qIndex) =>
                qIndex === questionIndex
                    ? {
                          ...question,
                          options: question.options.length <= 2 ? question.options : question.options.filter((_, oIndex) => oIndex !== optionIndex),
                      }
                    : question,
            ),
        );
    };

    const addStage = (type: StageType) => {
        setStages((current) => {
            const nextOrder = current.length + 1;
            return [...current, createStageDraft(type, nextOrder)];
        });
    };

    const removeStage = (stageId: string) => {
        setStageFileError(stageId, null);

        setStages((current) => {
            if (current.length === 1) {
                return current;
            }

            return current
                .filter((stage) => stage.id !== stageId)
                .map((stage, index) => ({
                    ...stage,
                    order: index + 1,
                }));
        });
    };

    const getStageError = useCallback(
        (index: number, field: string): string | undefined => {
            const key = `stages.${index}.${field}`;
            return form.errors[key as keyof typeof form.errors] as string | undefined;
        },
        [form.errors],
    );

    const formatMinutes = useCallback((value: number | string | null | undefined): string | null => {
        if (value === null || value === undefined) {
            return null;
        }

        const numeric = typeof value === 'number' ? value : Number.parseInt(value, 10);

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
    }, []);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            duration: data.duration ? Number.parseInt(data.duration, 10) : null,
            order: data.order ? Number.parseInt(data.order, 10) : null,
            stages: stages.map((stage, index) => ({
                type: stage.type,
                order: Number.isFinite(stage.order) && stage.order > 0 ? stage.order : index + 1,
                quiz_id:
                    stage.type === 'quiz' && stage.quizMode === 'existing'
                        ? stage.quiz_id && stage.quiz_id !== ''
                            ? Number.parseInt(stage.quiz_id, 10)
                            : null
                        : null,
                quiz: stage.type === 'quiz' && stage.quizMode === 'new' ? mapQuizStateToPayload(stage.quiz) : null,
                content:
                    stage.type === 'content'
                        ? {
                              title: stage.content.title,
                              description: stage.content.description,
                              content_type: stage.content.content_type,
                              duration: stage.content.duration ? Number.parseInt(stage.content.duration, 10) : null,
                              content_url: stage.content.content_url,
                              file: stage.content.file,
                          }
                        : null,
            })),
        }));

        form.post(CourseModuleController.store.url({ course: course.slug }), {
            preserveScroll: true,
        });
    };

    const moduleTitle = form.data.title.trim().length > 0 ? form.data.title : (course.title ?? 'Kursus');
    const errorBag = form.errors as Record<string, string>;

    return (
        <AppLayout>
            <Head title={`Tambah Modul - ${moduleTitle}`} />
            <div className='mx-auto max-w-4xl space-y-8 py-10'>
                <div className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='space-y-2'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Link
                                href={CourseController.show.url({ course: course.slug })}
                                className='inline-flex items-center gap-1 text-primary hover:underline'
                            >
                                <ArrowLeft className='h-4 w-4' /> Kembali ke detail kursus
                            </Link>
                        </div>
                        <h1 className='text-2xl font-semibold text-foreground'>Tambah Modul Pembelajaran</h1>
                        <p className='text-sm text-muted-foreground'>Susun materi atau kuis yang akan diikuti peserta secara terstruktur.</p>
                    </div>
                    <div className='rounded-xl border border-dashed border-primary/40 px-4 py-3 text-sm text-primary'>
                        Kursus: <span className='font-semibold text-foreground'>{course.title ?? 'Tanpa judul'}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='space-y-8'>
                    <div className='rounded-2xl border bg-card p-6 shadow-sm'>
                        <h2 className='text-lg font-semibold text-foreground'>Informasi modul</h2>
                        <p className='text-sm text-muted-foreground'>Berikan detail dasar yang membantu peserta memahami modul ini.</p>
                        <div className='mt-6 grid gap-5'>
                            <div className='grid gap-2'>
                                <Label htmlFor='module-title'>Judul modul</Label>
                                <Input
                                    id='module-title'
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    placeholder='Contoh: Dasar-dasar Pemrograman'
                                    required
                                    disabled={form.processing}
                                />
                                <InputError message={form.errors.title} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='module-description'>Deskripsi</Label>
                                <Textarea
                                    id='module-description'
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    placeholder='Ringkasan singkat materi yang akan dipelajari dalam modul ini.'
                                    rows={4}
                                    disabled={form.processing}
                                />
                                <InputError message={form.errors.description} />
                            </div>
                            <div className='grid gap-2 sm:grid-cols-2'>
                                <div className='grid gap-2'>
                                    <Label htmlFor='module-duration'>Durasi (menit)</Label>
                                    <Input
                                        id='module-duration'
                                        type='number'
                                        min={1}
                                        value={form.data.duration}
                                        onChange={(event) => form.setData('duration', event.target.value)}
                                        placeholder='120'
                                        disabled={form.processing}
                                    />
                                    <InputError message={form.errors.duration} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor='module-order'>Urutan modul (opsional)</Label>
                                    <Input
                                        id='module-order'
                                        type='number'
                                        min={1}
                                        value={form.data.order}
                                        onChange={(event) => form.setData('order', event.target.value)}
                                        placeholder='1'
                                        disabled={form.processing}
                                    />
                                    <InputError message={form.errors.order} />
                                </div>
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='module-thumbnail'>Gambar sampul (opsional)</Label>
                                <Input
                                    id='module-thumbnail'
                                    type='file'
                                    accept='image/*'
                                    onChange={handleThumbnailChange}
                                    disabled={form.processing}
                                />
                                <InputError message={form.errors.thumbnail} />
                                {thumbnailPreview ? (
                                    <img
                                        src={thumbnailPreview}
                                        alt='Pratinjau thumbnail modul'
                                        className='mt-3 h-32 w-32 rounded-lg object-cover shadow'
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className='rounded-2xl border bg-card p-6 shadow-sm'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div>
                                <h2 className='text-lg font-semibold text-foreground'>Konten modul</h2>
                                <p className='text-sm text-muted-foreground'>Tambahkan urutan materi atau kuis yang harus diselesaikan peserta.</p>
                            </div>
                            <div className='flex gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    className='gap-2'
                                    onClick={() => addStage('content')}
                                    disabled={form.processing}
                                >
                                    <FileText className='h-4 w-4' /> Konten baru
                                </Button>
                                <Button type='button' size='sm' className='gap-2' onClick={() => addStage('quiz')} disabled={form.processing}>
                                    <Layers className='h-4 w-4' /> Kuis baru
                                </Button>
                            </div>
                        </div>
                        <div className='mt-6 space-y-5'>
                            {stages.map((stage, index) => {
                                const stageTitle = stage.type === 'quiz' ? `Konten ${index + 1} · Kuis` : `Konten ${index + 1} · Materi`;

                                return (
                                    <div key={stage.id} className='rounded-xl border border-border/60 p-5 shadow-sm'>
                                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                            <div className='space-y-1'>
                                                <h3 className='text-base font-semibold text-foreground'>{stageTitle}</h3>
                                                <p className='text-xs text-muted-foreground'>Atur urutan dan detail untuk konten ini.</p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div className='grid gap-1 text-sm'>
                                                    <Label htmlFor={`stage-order-${stage.id}`} className='text-xs text-muted-foreground'>
                                                        Urutan
                                                    </Label>
                                                    <Input
                                                        id={`stage-order-${stage.id}`}
                                                        type='number'
                                                        min={1}
                                                        value={stage.order}
                                                        onChange={(event) => handleStageOrderChange(stage.id, event.target.value)}
                                                        disabled={form.processing}
                                                        className='w-24'
                                                    />
                                                </div>
                                                <div className='grid gap-1 text-sm'>
                                                    <Label className='text-xs text-muted-foreground'>Jenis konten</Label>
                                                    <Select
                                                        value={stage.type}
                                                        onValueChange={(value) => handleStageTypeChange(stage.id, value as StageType)}
                                                        disabled={form.processing}
                                                    >
                                                        <SelectTrigger className='w-36'>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value='content'>Konten</SelectItem>
                                                            <SelectItem value='quiz'>Kuis</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button
                                                    type='button'
                                                    variant='ghost'
                                                    className='text-destructive hover:text-destructive'
                                                    size='icon'
                                                    onClick={() => removeStage(stage.id)}
                                                    disabled={form.processing || stages.length === 1}
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </div>

                                        {stage.type === 'content' ? (
                                            <div className='mt-4 grid gap-4'>
                                                <div className='grid gap-2'>
                                                    <Label>Judul konten</Label>
                                                    <Input
                                                        value={stage.content.title}
                                                        onChange={(event) => handleContentFieldChange(stage.id, 'title', event.target.value)}
                                                        placeholder='Contoh: Pengenalan HTML'
                                                        disabled={form.processing}
                                                    />
                                                    <InputError message={getStageError(index, 'content.title')} />
                                                </div>
                                                <div className='grid gap-2'>
                                                    <Label>Deskripsi</Label>
                                                    <Textarea
                                                        value={stage.content.description}
                                                        onChange={(event) => handleContentFieldChange(stage.id, 'description', event.target.value)}
                                                        placeholder='Gambaran singkat materi atau instruksi konten.'
                                                        rows={3}
                                                        disabled={form.processing}
                                                    />
                                                    <InputError message={getStageError(index, 'content.description')} />
                                                </div>
                                                <div className='grid gap-2 sm:grid-cols-2'>
                                                    <div className='grid gap-2'>
                                                        <Label>Jenis konten</Label>
                                                        <Input
                                                            value={stage.content.content_type}
                                                            onChange={(event) =>
                                                                handleContentFieldChange(stage.id, 'content_type', event.target.value)
                                                            }
                                                            placeholder='Video, artikel, dokumen, dll.'
                                                            disabled={form.processing}
                                                        />
                                                        <InputError message={getStageError(index, 'content.content_type')} />
                                                    </div>
                                                    <div className='grid gap-2'>
                                                        <Label>Durasi (menit)</Label>
                                                        <Input
                                                            type='number'
                                                            min={1}
                                                            value={stage.content.duration}
                                                            onChange={(event) => handleContentFieldChange(stage.id, 'duration', event.target.value)}
                                                            placeholder='30'
                                                            disabled={form.processing}
                                                        />
                                                        <InputError message={getStageError(index, 'content.duration')} />
                                                        {formatMinutes(stage.content.duration) ? (
                                                            <p className='text-xs text-muted-foreground'>
                                                                Perkiraan: {formatMinutes(stage.content.duration)}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div className='grid gap-2'>
                                                    <Label>Tautan konten</Label>
                                                    <Input
                                                        value={stage.content.content_url}
                                                        onChange={(event) => handleContentFieldChange(stage.id, 'content_url', event.target.value)}
                                                        placeholder='https://contoh.com/materi'
                                                        disabled={form.processing}
                                                    />
                                                    <InputError message={getStageError(index, 'content.content_url')} />
                                                </div>
                                                <div className='grid gap-2'>
                                                    <Label>Berkas pendukung (opsional)</Label>
                                                    <Input
                                                        type='file'
                                                        onChange={(event) => {
                                                            const [file] = event.target.files ?? [];

                                                            if (file && file.size > MAX_STAGE_FILE_SIZE) {
                                                                setStageFileError(stage.id, 'Ukuran berkas maksimal 20 MB. Pilih berkas lain.');
                                                                handleContentFieldChange(stage.id, 'file', null);
                                                                event.target.value = '';

                                                                return;
                                                            }

                                                            setStageFileError(stage.id, null);
                                                            handleContentFieldChange(stage.id, 'file', file ?? null);
                                                        }}
                                                        disabled={form.processing}
                                                    />
                                                    <InputError message={getStageError(index, 'content.file') ?? stageFileErrors[stage.id]} />
                                                    {stage.content.file ? (
                                                        <p className='text-xs text-muted-foreground'>Berkas terpilih: {stage.content.file.name}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='mt-4 space-y-5'>
                                                <div className='grid gap-4 sm:grid-cols-2'>
                                                    <div className='grid gap-2'>
                                                        <Label>Jenis kuis</Label>
                                                        <Select
                                                            value={stage.quizMode}
                                                            onValueChange={(value) => handleQuizModeChange(stage.id, value as QuizMode)}
                                                            disabled={form.processing}
                                                        >
                                                            <SelectTrigger className='w-full'>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value='new'>Buat kuis baru</SelectItem>
                                                                <SelectItem value='existing'>Gunakan kuis yang ada</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {stage.quizMode === 'existing' ? (
                                                        <div className='grid gap-2'>
                                                            <Label>Pilih kuis</Label>
                                                            <Select
                                                                value={stage.quiz_id}
                                                                onValueChange={(value) => handleQuizSelection(stage.id, value)}
                                                                disabled={form.processing || quizOptions.length === 0}
                                                            >
                                                                <SelectTrigger className='w-full'>
                                                                    <SelectValue placeholder='Pilih kuis yang tersedia' />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {quizOptions.length === 0 ? (
                                                                        <SelectItem value='' disabled>
                                                                            Tidak ada kuis tersedia
                                                                        </SelectItem>
                                                                    ) : (
                                                                        quizOptions.map((quiz) => (
                                                                            <SelectItem key={`quiz-option-${quiz.id}`} value={String(quiz.id)}>
                                                                                {quiz.name ?? `Kuis ${quiz.id}`}
                                                                                {quiz.duration
                                                                                    ? ` · ${formatMinutes(quiz.duration) ?? `${quiz.duration} menit`}`
                                                                                    : ''}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <InputError message={getStageError(index, 'quiz_id')} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                                {stage.quizMode === 'new' ? (
                                                    <div className='space-y-5'>
                                                        <div className='grid gap-2'>
                                                            <Label>Nama kuis</Label>
                                                            <Input
                                                                value={stage.quiz.name}
                                                                onChange={(event) => handleQuizFieldChange(stage.id, 'name', event.target.value)}
                                                                placeholder='Contoh: Evaluasi Bab 1'
                                                                disabled={form.processing}
                                                            />
                                                            <InputError message={getStageError(index, 'quiz.name')} />
                                                        </div>
                                                        <div className='grid gap-2'>
                                                            <Label>Deskripsi</Label>
                                                            <Textarea
                                                                value={stage.quiz.description}
                                                                onChange={(event) =>
                                                                    handleQuizFieldChange(stage.id, 'description', event.target.value)
                                                                }
                                                                placeholder='Ringkasan singkat mengenai kuis.'
                                                                rows={3}
                                                                disabled={form.processing}
                                                            />
                                                            <InputError message={getStageError(index, 'quiz.description')} />
                                                        </div>
                                                        <div className='grid gap-4 sm:grid-cols-3'>
                                                            <div className='grid gap-2'>
                                                                <Label>Durasi (menit)</Label>
                                                                <Input
                                                                    type='number'
                                                                    min={1}
                                                                    value={stage.quiz.duration}
                                                                    onChange={(event) =>
                                                                        handleQuizFieldChange(stage.id, 'duration', event.target.value)
                                                                    }
                                                                    placeholder='30'
                                                                    disabled={form.processing}
                                                                />
                                                                <InputError message={getStageError(index, 'quiz.duration')} />
                                                            </div>
                                                            <div className='flex flex-col gap-2 rounded-lg border border-dashed border-border/60 p-3'>
                                                                <div className='flex items-center justify-between gap-3'>
                                                                    <span className='text-sm font-medium text-foreground'>
                                                                        Acak urutan pertanyaan
                                                                    </span>
                                                                    <Checkbox
                                                                        checked={stage.quiz.is_question_shuffled}
                                                                        onCheckedChange={(checked) =>
                                                                            handleQuizFieldChange(stage.id, 'is_question_shuffled', Boolean(checked))
                                                                        }
                                                                        disabled={form.processing}
                                                                    />
                                                                </div>
                                                                <p className='text-xs text-muted-foreground'>
                                                                    Aktifkan untuk menampilkan pertanyaan dalam urutan acak bagi setiap peserta.
                                                                </p>
                                                            </div>
                                                            <div className='grid gap-2'>
                                                                <Label>Kategori (opsional)</Label>
                                                                <Input
                                                                    value={stage.quiz.type}
                                                                    onChange={(event) => handleQuizFieldChange(stage.id, 'type', event.target.value)}
                                                                    placeholder='pre-test / post-test'
                                                                    disabled={form.processing}
                                                                />
                                                                <InputError message={getStageError(index, 'quiz.type')} />
                                                            </div>
                                                        </div>
                                                        <div className='space-y-4'>
                                                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                                                <h4 className='text-sm font-semibold text-foreground'>Daftar pertanyaan</h4>
                                                                <Button
                                                                    type='button'
                                                                    variant='outline'
                                                                    size='sm'
                                                                    onClick={() => addQuizQuestion(stage.id)}
                                                                    disabled={form.processing}
                                                                    className='gap-2'
                                                                >
                                                                    <Plus className='h-4 w-4' /> Pertanyaan baru
                                                                </Button>
                                                            </div>
                                                            <InputError message={getStageError(index, 'quiz.questions')} />
                                                            {stage.quiz.questions.map((question, questionIndex) => (
                                                                <div
                                                                    key={`stage-${stage.id}-question-${questionIndex}`}
                                                                    className='space-y-4 rounded-xl border border-border/60 p-4 shadow-sm'
                                                                >
                                                                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                                                        <div className='flex-1 space-y-3'>
                                                                            <Label htmlFor={`stage-${stage.id}-question-${questionIndex}`}>
                                                                                Pertanyaan {questionIndex + 1}
                                                                            </Label>
                                                                            <Textarea
                                                                                id={`stage-${stage.id}-question-${questionIndex}`}
                                                                                value={question.question}
                                                                                onChange={(event) =>
                                                                                    handleQuizQuestionFieldChange(
                                                                                        stage.id,
                                                                                        questionIndex,
                                                                                        'question',
                                                                                        event.target.value,
                                                                                    )
                                                                                }
                                                                                placeholder='Tuliskan pertanyaan di sini'
                                                                                rows={3}
                                                                                disabled={form.processing}
                                                                            />
                                                                            <InputError
                                                                                message={getStageError(
                                                                                    index,
                                                                                    `quiz.questions.${questionIndex}.question`,
                                                                                )}
                                                                            />
                                                                            <div className='space-y-2 rounded-lg border border-dashed border-border/60 p-3'>
                                                                                <Label className='text-xs font-medium text-muted-foreground'>
                                                                                    Gambar pertanyaan (opsional)
                                                                                </Label>
                                                                                <Input
                                                                                    type='file'
                                                                                    accept='image/*'
                                                                                    onChange={(event) =>
                                                                                        handleQuizQuestionImageChange(stage.id, questionIndex, event)
                                                                                    }
                                                                                    disabled={form.processing}
                                                                                />
                                                                                <InputError
                                                                                    message={getStageError(
                                                                                        index,
                                                                                        `quiz.questions.${questionIndex}.question_image`,
                                                                                    )}
                                                                                />
                                                                                {question.question_image ? (
                                                                                    <p className='text-xs text-muted-foreground'>
                                                                                        Berkas terpilih: {question.question_image.name}
                                                                                    </p>
                                                                                ) : question.question_image_url ? (
                                                                                    <div className='flex flex-col gap-2'>
                                                                                        <img
                                                                                            src={question.question_image_url}
                                                                                            alt={`Pratinjau pertanyaan ${questionIndex + 1}`}
                                                                                            className='h-28 w-28 rounded-md border border-border/60 object-cover'
                                                                                        />
                                                                                        <p className='text-xs text-muted-foreground'>
                                                                                            Gambar saat ini digunakan.
                                                                                        </p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className='text-xs text-muted-foreground'>
                                                                                        Format JPG, PNG, atau WEBP. Maksimal 2 MB.
                                                                                    </p>
                                                                                )}
                                                                                {(question.question_image || question.question_image_url) && (
                                                                                    <Button
                                                                                        type='button'
                                                                                        variant='ghost'
                                                                                        size='sm'
                                                                                        className='text-destructive hover:text-destructive'
                                                                                        onClick={() =>
                                                                                            handleQuizQuestionImageRemove(stage.id, questionIndex)
                                                                                        }
                                                                                        disabled={form.processing}
                                                                                    >
                                                                                        Hapus gambar
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            type='button'
                                                                            variant='ghost'
                                                                            size='sm'
                                                                            className='text-destructive hover:text-destructive'
                                                                            onClick={() => removeQuizQuestion(stage.id, questionIndex)}
                                                                            disabled={form.processing || stage.quiz.questions.length <= 1}
                                                                        >
                                                                            Hapus
                                                                        </Button>
                                                                    </div>
                                                                    <div className='flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground'>
                                                                        <Checkbox
                                                                            checked={question.is_answer_shuffled}
                                                                            onCheckedChange={(checked) =>
                                                                                handleQuizQuestionFieldChange(
                                                                                    stage.id,
                                                                                    questionIndex,
                                                                                    'is_answer_shuffled',
                                                                                    Boolean(checked),
                                                                                )
                                                                            }
                                                                            disabled={form.processing}
                                                                        />
                                                                        <span>Acak jawaban untuk pertanyaan ini</span>
                                                                    </div>
                                                                    <div className='space-y-3'>
                                                                        <div className='flex items-center justify-between'>
                                                                            <Label className='text-sm font-medium'>Daftar jawaban</Label>
                                                                            <Button
                                                                                type='button'
                                                                                variant='ghost'
                                                                                size='sm'
                                                                                onClick={() => addQuizOption(stage.id, questionIndex)}
                                                                                disabled={form.processing}
                                                                                className='gap-2'
                                                                            >
                                                                                <Plus className='h-4 w-4' /> Jawaban baru
                                                                            </Button>
                                                                        </div>
                                                                        <InputError
                                                                            message={getStageError(index, `quiz.questions.${questionIndex}.options`)}
                                                                        />
                                                                        {question.options.map((option, optionIndex) => (
                                                                            <div
                                                                                key={`stage-${stage.id}-question-${questionIndex}-option-${optionIndex}`}
                                                                                className='flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4'
                                                                            >
                                                                                <div className='flex items-center gap-2'>
                                                                                    <Checkbox
                                                                                        checked={option.is_correct}
                                                                                        onCheckedChange={(checked) =>
                                                                                            handleQuizOptionFieldChange(
                                                                                                stage.id,
                                                                                                questionIndex,
                                                                                                optionIndex,
                                                                                                'is_correct',
                                                                                                Boolean(checked),
                                                                                            )
                                                                                        }
                                                                                        disabled={form.processing}
                                                                                    />
                                                                                    <span className='text-xs text-muted-foreground'>
                                                                                        Jawaban benar
                                                                                    </span>
                                                                                </div>
                                                                                <div className='flex-1 space-y-3'>
                                                                                    <div className='space-y-2'>
                                                                                        <Input
                                                                                            value={option.option_text}
                                                                                            onChange={(event) =>
                                                                                                handleQuizOptionFieldChange(
                                                                                                    stage.id,
                                                                                                    questionIndex,
                                                                                                    optionIndex,
                                                                                                    'option_text',
                                                                                                    event.target.value,
                                                                                                )
                                                                                            }
                                                                                            placeholder={`Jawaban ${optionIndex + 1}`}
                                                                                            disabled={form.processing}
                                                                                        />
                                                                                        <InputError
                                                                                            message={getStageError(
                                                                                                index,
                                                                                                `quiz.questions.${questionIndex}.options.${optionIndex}.option_text`,
                                                                                            )}
                                                                                        />
                                                                                    </div>
                                                                                    <div className='space-y-2'>
                                                                                        <Label className='text-xs font-medium text-muted-foreground'>
                                                                                            Gambar pendukung (opsional)
                                                                                        </Label>
                                                                                        <Input
                                                                                            type='file'
                                                                                            accept='image/*'
                                                                                            onChange={(event) =>
                                                                                                handleQuizOptionImageChange(
                                                                                                    stage.id,
                                                                                                    questionIndex,
                                                                                                    optionIndex,
                                                                                                    event,
                                                                                                )
                                                                                            }
                                                                                            disabled={form.processing}
                                                                                        />
                                                                                        <InputError
                                                                                            message={getStageError(
                                                                                                index,
                                                                                                `quiz.questions.${questionIndex}.options.${optionIndex}.option_image`,
                                                                                            )}
                                                                                        />
                                                                                        {option.option_image ? (
                                                                                            <p className='text-xs text-muted-foreground'>
                                                                                                Berkas terpilih: {option.option_image.name}
                                                                                            </p>
                                                                                        ) : option.option_image_url ? (
                                                                                            <div className='flex flex-col gap-2'>
                                                                                                <img
                                                                                                    src={option.option_image_url}
                                                                                                    alt={`Pratinjau jawaban ${optionIndex + 1}`}
                                                                                                    className='h-24 w-24 rounded-md border border-border/60 object-cover'
                                                                                                />
                                                                                                <p className='text-xs text-muted-foreground'>
                                                                                                    Gambar saat ini digunakan.
                                                                                                </p>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <p className='text-xs text-muted-foreground'>
                                                                                                Format JPG, PNG, atau WEBP. Maksimal 2 MB.
                                                                                            </p>
                                                                                        )}
                                                                                        {(option.option_image || option.option_image_url) && (
                                                                                            <Button
                                                                                                type='button'
                                                                                                variant='ghost'
                                                                                                size='sm'
                                                                                                className='self-start text-destructive hover:text-destructive'
                                                                                                onClick={() =>
                                                                                                    handleQuizOptionImageRemove(
                                                                                                        stage.id,
                                                                                                        questionIndex,
                                                                                                        optionIndex,
                                                                                                    )
                                                                                                }
                                                                                                disabled={form.processing}
                                                                                            >
                                                                                                Hapus gambar
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    type='button'
                                                                                    variant='ghost'
                                                                                    size='sm'
                                                                                    className='text-destructive hover:text-destructive'
                                                                                    onClick={() =>
                                                                                        removeQuizOption(stage.id, questionIndex, optionIndex)
                                                                                    }
                                                                                    disabled={form.processing || question.options.length <= 2}
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <InputError message={errorBag.stages} />
                    </div>

                    <div className='flex items-center justify-between border-t border-border pt-6'>
                        <div className='text-sm text-muted-foreground'>
                            Perubahan disimpan ke dalam kursus <span className='font-medium text-foreground'>{course.title ?? 'tanpa judul'}</span>{' '}
                            setelah Anda menekan "Simpan Modul".
                        </div>
                        <Button type='submit' className='gap-2' disabled={form.processing}>
                            {form.processing ? 'Menyimpan…' : 'Simpan Modul'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
