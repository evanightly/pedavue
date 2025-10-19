import CourseModuleContentController from '@/actions/App/Http/Controllers/CourseModuleContentController';
import InputError from '@/components/input-error';
import ModuleStagePreview from '@/components/module-stage-preview';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowUp, Clipboard, Clock, FileText, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from 'react';

type StageType = 'content' | 'quiz';

type ModuleRecord = App.Data.Module.ModuleData;
type ModuleStageRecord = App.Data.ModuleStage.ModuleStageData;
type ModuleContentRecord = App.Data.ModuleContent.ModuleContentData;
type QuizRecord = App.Data.Quiz.QuizData;
type QuizQuestionRecord = App.Data.QuizQuestion.QuizQuestionData;
type QuizQuestionOptionRecord = App.Data.QuizQuestionOption.QuizQuestionOptionData;

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

const buildEmptyOption = (isFirst = false): QuizOptionState => ({
    option_text: '',
    is_correct: isFirst,
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

const mapQuizRecordToState = (quiz: QuizRecord | null): QuizFormState => {
    if (!quiz) {
        return buildEmptyQuiz();
    }

    const questions = normalizeDataCollection<QuizQuestionRecord>(quiz.quiz_questions ?? []).map((questionRecord) => {
        const rawOptions = normalizeDataCollection<QuizQuestionOptionRecord>(questionRecord.quiz_question_options ?? []).map(
            (optionRecord, index) => ({
                option_text: optionRecord.option_text ?? '',
                is_correct: optionRecord.is_correct ?? index === 0,
                option_image: null,
                existing_option_image: optionRecord.option_image ?? null,
                option_image_url: optionRecord.option_image_url ?? null,
                remove_option_image: false,
            }),
        );

        const ensuredOptions =
            rawOptions.length >= 2
                ? rawOptions
                : [
                      ...rawOptions,
                      ...Array.from({ length: Math.max(0, 2 - rawOptions.length) }, (_, optionIndex) =>
                          buildEmptyOption(rawOptions.length === 0 && optionIndex === 0),
                      ),
                  ];

        return {
            question: questionRecord.question ?? '',
            question_image: null,
            existing_question_image: questionRecord.question_image ?? null,
            question_image_url: questionRecord.question_image_url ?? null,
            remove_question_image: false,
            is_answer_shuffled: questionRecord.is_answer_shuffled ?? false,
            options: ensuredOptions,
        } satisfies QuizQuestionState;
    });

    const ensuredQuestions = questions.length > 0 ? questions : [buildEmptyQuestion()];

    return {
        name: quiz.name ?? '',
        description: quiz.description ?? '',
        duration: quiz.duration ? String(quiz.duration) : '',
        is_question_shuffled: quiz.is_question_shuffled ?? false,
        type: quiz.type ?? 'module',
        questions: ensuredQuestions,
    } satisfies QuizFormState;
};

interface NormalizedStage {
    record: ModuleStageRecord;
    id: number | null;
    order: number;
    isQuiz: boolean;
}

function normalizeDataCollection<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (value && typeof value === 'object') {
        const data = (value as { data?: unknown }).data;

        if (Array.isArray(data)) {
            return data as T[];
        }
    }

    return [];
}

interface ModuleContentsProps {
    course: {
        id: number;
        title: string | null;
        slug: string;
    };
    module: ModuleRecord;
    abilities?: {
        manage_modules?: boolean;
    } | null;
}

type ContentState = {
    title: string;
    description: string;
    content_type: string;
    duration: string;
    content_url: string;
    file: File | null;
    remove_file?: boolean;
};

type EditableContentState = ContentState & { remove_file: boolean };

export default function CourseModuleContentsPage({ course, module, abilities = null }: ModuleContentsProps) {
    const moduleId = useMemo(() => {
        const raw = module?.id ?? null;
        return typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
    }, [module?.id]);

    const canManageModules = Boolean(abilities?.manage_modules);

    const stageRecords = useMemo(() => normalizeDataCollection<ModuleStageRecord>(module?.module_stages ?? []), [module?.module_stages]);

    const normalizedStages = useMemo<NormalizedStage[]>(() => {
        return stageRecords.map((stage, index) => {
            const idRaw = stage?.id ?? null;
            const id = typeof idRaw === 'number' ? idRaw : Number.parseInt(String(idRaw ?? ''), 10);
            const order = typeof stage?.order === 'number' && Number.isFinite(stage.order) ? stage.order : index + 1;

            return {
                record: stage,
                id: Number.isFinite(id) && id > 0 ? id : null,
                order,
                isQuiz: stage?.module_able === 'quiz',
            } satisfies NormalizedStage;
        });
    }, [stageRecords]);

    const formatMinutes = useCallback((value: unknown): string | null => {
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
    }, []);

    const form = useForm({
        type: 'content' as StageType,
        order: '',
        content: {
            title: '',
            description: '',
            content_type: '',
            duration: '',
            content_url: '',
            file: null as File | null,
        } satisfies ContentState,
        quiz: buildEmptyQuiz(),
    });

    const editForm = useForm({
        type: 'content' as StageType,
        order: '',
        content: {
            title: '',
            description: '',
            content_type: '',
            duration: '',
            content_url: '',
            file: null as File | null,
            remove_file: false,
        } satisfies EditableContentState,
        quiz: buildEmptyQuiz(),
    });

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<ModuleStageRecord | null>(null);
    const [deleteStage, setDeleteStage] = useState<ModuleStageRecord | null>(null);
    const [deletingStageId, setDeletingStageId] = useState<number | null>(null);
    const [reorderingStageId, setReorderingStageId] = useState<number | null>(null);

    const setContentField = (field: keyof ContentState, value: string | File | null) => {
        form.setData('content', {
            ...form.data.content,
            [field]: field === 'file' ? (value as File | null) : (value as string),
        });
    };

    const setQuizField = <K extends keyof QuizFormState>(field: K, value: QuizFormState[K]) => {
        form.setData('quiz', {
            ...form.data.quiz,
            [field]: value,
        });
    };

    const updateQuizQuestions = (updater: (questions: QuizQuestionState[]) => QuizQuestionState[]) => {
        form.setData('quiz', {
            ...form.data.quiz,
            questions: updater(form.data.quiz.questions),
        });
    };

    const setQuizQuestionField = <K extends keyof QuizQuestionState>(index: number, field: K, value: QuizQuestionState[K]) => {
        updateQuizQuestions((questions) =>
            questions.map((question, questionIndex) => (questionIndex === index ? { ...question, [field]: value } : question)),
        );
    };

    const handleQuizQuestionImageChange = (questionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex
                    ? {
                          ...question,
                          question_image: file ?? null,
                          remove_question_image: false,
                      }
                    : question,
            ),
        );
    };

    const handleQuizQuestionImageRemove = (questionIndex: number) => {
        updateQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex
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

    const updateQuizQuestionOptions = (questionIndex: number, updater: (options: QuizOptionState[]) => QuizOptionState[]) => {
        updateQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex ? { ...question, options: updater(question.options) } : question,
            ),
        );
    };

    const setQuizOptionField = <K extends keyof QuizOptionState>(questionIndex: number, optionIndex: number, field: K, value: QuizOptionState[K]) => {
        updateQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) => (currentIndex === optionIndex ? { ...option, [field]: value } : option)),
        );
    };

    const handleQuizOptionImageChange = (questionIndex: number, optionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) =>
                currentIndex === optionIndex
                    ? {
                          ...option,
                          option_image: file ?? null,
                          remove_option_image: false,
                      }
                    : option,
            ),
        );
    };

    const handleQuizOptionImageRemove = (questionIndex: number, optionIndex: number) => {
        updateQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) =>
                currentIndex === optionIndex
                    ? {
                          ...option,
                          option_image: null,
                          existing_option_image: null,
                          option_image_url: null,
                          remove_option_image: true,
                      }
                    : option,
            ),
        );
    };

    const addQuizQuestion = () => {
        updateQuizQuestions((questions) => [...questions, buildEmptyQuestion()]);
    };

    const removeQuizQuestion = (index: number) => {
        updateQuizQuestions((questions) => (questions.length <= 1 ? questions : questions.filter((_, questionIndex) => questionIndex !== index)));
    };

    const addQuizOption = (questionIndex: number) => {
        updateQuizQuestionOptions(questionIndex, (options) => [...options, buildEmptyOption()]);
    };

    const removeQuizOption = (questionIndex: number, optionIndex: number) => {
        updateQuizQuestionOptions(questionIndex, (options) =>
            options.length <= 2 ? options : options.filter((_, currentIndex) => currentIndex !== optionIndex),
        );
    };

    const resetContentFields = () => {
        form.setData('content', {
            title: '',
            description: '',
            content_type: '',
            duration: '',
            content_url: '',
            file: null,
        });
    };

    const handleTypeChange = (nextType: StageType) => {
        form.setData('type', nextType);

        if (nextType === 'quiz') {
            resetContentFields();
            form.setData('quiz', buildEmptyQuiz());
        } else {
            form.setData('quiz', buildEmptyQuiz());
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];
        setContentField('file', file ?? null);
    };

    const getError = useCallback(
        (field: string): string | undefined => form.errors[field as keyof typeof form.errors] as string | undefined,
        [form.errors],
    );

    const getEditError = useCallback(
        (field: string): string | undefined => editForm.errors[field as keyof typeof editForm.errors] as string | undefined,
        [editForm.errors],
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            type: data.type,
            order: data.order ? Number.parseInt(data.order, 10) : null,
            content:
                data.type === 'content'
                    ? {
                          title: data.content.title,
                          description: data.content.description,
                          content_type: data.content.content_type,
                          duration: data.content.duration ? Number.parseInt(data.content.duration, 10) : null,
                          content_url: data.content.content_url,
                          file: data.content.file,
                      }
                    : null,
            quiz: data.type === 'quiz' ? mapQuizStateToPayload(data.quiz) : null,
        }));

        // form.post(`/courses/${course.slug}/modules/${moduleId}/contents`, {
        //     forceFormData: true,
        //     preserveScroll: true,
        // });
        form.post(
            CourseModuleContentController.store.url({
                course: course.slug,
                module: moduleId,
            }),
            {
                forceFormData: true,
                preserveScroll: true,
            },
        );
    };

    const resolveStageId = (stage: ModuleStageRecord | null | undefined): number | null => {
        const raw = stage?.id ?? null;
        const value = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
        return Number.isFinite(value) && value > 0 ? value : null;
    };

    const editingStageId = useMemo(() => resolveStageId(editingStage), [editingStage]);
    const deletingStageResolvedId = useMemo(() => resolveStageId(deleteStage), [deleteStage]);

    const openEditDialog = useCallback(
        (stage: ModuleStageRecord) => {
            if (!canManageModules) {
                return;
            }

            const stageId = resolveStageId(stage);
            if (!stageId) {
                return;
            }

            const isQuiz = stage.module_able === 'quiz';
            const orderValue = typeof stage.order === 'number' && Number.isFinite(stage.order) ? String(stage.order) : '';
            const content = stage.module_content as ModuleContentRecord | null;
            const quiz = stage.module_quiz as QuizRecord | null;

            setEditingStage(stage);
            editForm.setData({
                type: isQuiz ? 'quiz' : 'content',
                order: orderValue,
                content: {
                    title: content?.title ?? '',
                    description: content?.description ?? '',
                    content_type: content?.content_type ?? '',
                    duration: content?.duration ? String(content.duration) : '',
                    content_url: content?.content_url ?? '',
                    file: null,
                    remove_file: false,
                },
                quiz: isQuiz ? mapQuizRecordToState(quiz) : buildEmptyQuiz(),
            });
            editForm.clearErrors();
            setEditDialogOpen(true);
        },
        [canManageModules, editForm],
    );

    const closeEditDialog = useCallback(() => {
        setEditDialogOpen(false);
        setEditingStage(null);
        editForm.reset();
        editForm.clearErrors();
    }, [editForm]);

    const handleEditTypeChange = (value: StageType) => {
        editForm.setData('type', value);
        if (value === 'quiz') {
            editForm.setData('content', {
                title: '',
                description: '',
                content_type: '',
                duration: '',
                content_url: '',
                file: null,
                remove_file: false,
            });
            editForm.setData('quiz', buildEmptyQuiz());
        } else {
            editForm.setData('quiz', buildEmptyQuiz());
        }
    };

    const setEditContentField = (field: keyof EditableContentState, value: string | File | boolean | null) => {
        editForm.setData('content', {
            ...editForm.data.content,
            [field]: field === 'file' ? (value as File | null) : (value as EditableContentState[keyof EditableContentState]),
        });
    };

    const setEditQuizField = <K extends keyof QuizFormState>(field: K, value: QuizFormState[K]) => {
        editForm.setData('quiz', {
            ...editForm.data.quiz,
            [field]: value,
        });
    };

    const updateEditQuizQuestions = (updater: (questions: QuizQuestionState[]) => QuizQuestionState[]) => {
        editForm.setData('quiz', {
            ...editForm.data.quiz,
            questions: updater(editForm.data.quiz.questions),
        });
    };

    const setEditQuizQuestionField = <K extends keyof QuizQuestionState>(index: number, field: K, value: QuizQuestionState[K]) => {
        updateEditQuizQuestions((questions) =>
            questions.map((question, questionIndex) => (questionIndex === index ? { ...question, [field]: value } : question)),
        );
    };

    const handleEditQuizQuestionImageChange = (questionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateEditQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex
                    ? {
                          ...question,
                          question_image: file ?? null,
                          remove_question_image: false,
                      }
                    : question,
            ),
        );
    };

    const handleEditQuizQuestionImageRemove = (questionIndex: number) => {
        updateEditQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex
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

    const updateEditQuizQuestionOptions = (questionIndex: number, updater: (options: QuizOptionState[]) => QuizOptionState[]) => {
        updateEditQuizQuestions((questions) =>
            questions.map((question, currentIndex) =>
                currentIndex === questionIndex ? { ...question, options: updater(question.options) } : question,
            ),
        );
    };

    const setEditQuizOptionField = <K extends keyof QuizOptionState>(
        questionIndex: number,
        optionIndex: number,
        field: K,
        value: QuizOptionState[K],
    ) => {
        updateEditQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) => (currentIndex === optionIndex ? { ...option, [field]: value } : option)),
        );
    };

    const handleEditQuizOptionImageChange = (questionIndex: number, optionIndex: number, event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];

        updateEditQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) =>
                currentIndex === optionIndex
                    ? {
                          ...option,
                          option_image: file ?? null,
                          remove_option_image: false,
                      }
                    : option,
            ),
        );
    };

    const handleEditQuizOptionImageRemove = (questionIndex: number, optionIndex: number) => {
        updateEditQuizQuestionOptions(questionIndex, (options) =>
            options.map((option, currentIndex) =>
                currentIndex === optionIndex
                    ? {
                          ...option,
                          option_image: null,
                          existing_option_image: null,
                          option_image_url: null,
                          remove_option_image: true,
                      }
                    : option,
            ),
        );
    };

    const addEditQuizQuestion = () => {
        updateEditQuizQuestions((questions) => [...questions, buildEmptyQuestion()]);
    };

    const removeEditQuizQuestion = (index: number) => {
        updateEditQuizQuestions((questions) => (questions.length <= 1 ? questions : questions.filter((_, questionIndex) => questionIndex !== index)));
    };

    const addEditQuizOption = (questionIndex: number) => {
        updateEditQuizQuestionOptions(questionIndex, (options) => [...options, buildEmptyOption()]);
    };

    const removeEditQuizOption = (questionIndex: number, optionIndex: number) => {
        updateEditQuizQuestionOptions(questionIndex, (options) =>
            options.length <= 2 ? options : options.filter((_, currentIndex) => currentIndex !== optionIndex),
        );
    };

    const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const [file] = event.target.files ?? [];
        setEditContentField('file', file ?? null);
        setEditContentField('remove_file', false);
    };

    const handleEditRemoveFileToggle = (checked: boolean) => {
        setEditContentField('remove_file', checked);
        if (checked) {
            setEditContentField('file', null);
        }
    };

    const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingStageId || !moduleId) {
            return;
        }

        editForm.transform((data) => ({
            _method: 'patch',
            type: data.type,
            order: data.order ? Number.parseInt(data.order, 10) : null,
            content:
                data.type === 'content'
                    ? {
                          title: data.content.title,
                          description: data.content.description,
                          content_type: data.content.content_type,
                          duration: data.content.duration ? Number.parseInt(data.content.duration, 10) : null,
                          content_url: data.content.content_url,
                          file: data.content.file,
                          remove_file: Boolean(data.content.remove_file),
                      }
                    : null,
            quiz: data.type === 'quiz' ? mapQuizStateToPayload(data.quiz) : null,
        }));

        // editForm.post(`/courses/${course.slug}/modules/${moduleId}/contents/${editingStageId}`, {
        // forceFormData: true,
        // preserveScroll: true,
        // onSuccess: closeEditDialog,
        // });

        editForm.post(
            CourseModuleContentController.update.url({
                course: course.slug,
                module: moduleId,
                stage: editingStageId,
            }),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: closeEditDialog,
            },
        );
    };

    const handleOpenDelete = (stage: ModuleStageRecord) => {
        if (!canManageModules) {
            return;
        }

        setDeleteStage(stage);
    };

    const handleCloseDelete = () => {
        setDeleteStage(null);
        setDeletingStageId(null);
    };

    const handleConfirmDelete = () => {
        if (!deletingStageResolvedId || !moduleId) {
            return;
        }

        setDeletingStageId(deletingStageResolvedId);

        // router.delete( `/courses/${course.slug}/modules/${moduleId}/contents/${deletingStageResolvedId}`, {
        //     preserveScroll: true,
        //     onFinish: handleCloseDelete,
        // });

        router.delete(
            CourseModuleContentController.destroy.url({
                course: course.slug,
                module: moduleId,
                stage: deletingStageResolvedId,
            }),
            {
                preserveScroll: true,
                onFinish: handleCloseDelete,
            },
        );
    };

    const handleMoveStage = useCallback(
        (stageId: number, direction: 'up' | 'down') => {
            if (!moduleId || normalizedStages.length < 2) {
                return;
            }

            const orderedIds = normalizedStages.map((stage) => stage.id).filter((id): id is number => Number.isFinite(id ?? NaN) && (id ?? 0) > 0);

            const currentIndex = orderedIds.findIndex((id) => id === stageId);
            if (currentIndex === -1) {
                return;
            }

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= orderedIds.length) {
                return;
            }

            const nextOrder = [...orderedIds];
            const [removed] = nextOrder.splice(currentIndex, 1);
            nextOrder.splice(targetIndex, 0, removed);

            setReorderingStageId(stageId);

            // router.patch(

            //     `/courses/${course.slug}/modules/${moduleId}/contents/reorder`,
            //     { stage_ids: nextOrder },
            //     {
            //         preserveScroll: true,
            //         onFinish: () => setReorderingStageId(null),
            //     },
            // );

            router.patch(
                CourseModuleContentController.reorder.url({
                    course: course.slug,
                    module: moduleId,
                }),
                { stage_ids: nextOrder },
                {
                    preserveScroll: true,
                    onFinish: () => setReorderingStageId(null),
                },
            );
        },
        [course.slug, moduleId, normalizedStages],
    );

    const moduleTitle = module?.title && module.title.trim().length > 0 ? module.title : `Modul ${moduleId}`;

    return (
        <AppLayout>
            <Head title={`Kelola Modul - ${moduleTitle}`} />
            <div className='mx-auto max-w-5xl space-y-10 py-10'>
                <div className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='space-y-2'>
                        <Link
                            href={`/courses/${course.slug}`}
                            className='inline-flex items-center gap-2 text-sm text-primary hover:underline'
                            preserveScroll
                        >
                            <ArrowLeft className='h-4 w-4' /> Kembali ke detail kursus
                        </Link>
                        <h1 className='text-2xl font-semibold text-foreground'>Kelola modul: {moduleTitle}</h1>
                        <p className='text-sm text-muted-foreground'>Susun materi dan kuis yang menjadi bagian dari modul ini.</p>
                    </div>
                    <div className='rounded-xl border border-dashed border-primary/40 px-4 py-3 text-sm text-primary'>
                        Kursus: <span className='font-semibold text-foreground'>{course.title ?? 'Tanpa judul'}</span>
                    </div>
                </div>

                <div className='rounded-2xl border bg-card p-6 shadow-sm'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='space-y-1'>
                            <h2 className='text-lg font-semibold text-foreground'>Daftar Konten</h2>
                            <p className='text-sm text-muted-foreground'>Pantau, ubah, dan tata ulang materi di dalam modul.</p>
                        </div>
                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                            <span className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary ring-1 ring-primary/20 ring-inset'>
                                <Layers className='h-3.5 w-3.5' /> {normalizedStages.length} konten
                            </span>
                            {module?.duration ? (
                                <span className='inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground/70 ring-1 ring-border'>
                                    <Clock className='h-3.5 w-3.5' /> {formatMinutes(module.duration) ?? `${module.duration} menit`}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <ul className='mt-6 space-y-4'>
                        {normalizedStages.length === 0 ? (
                            <li className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                                Belum ada konten atau kuis pada modul ini.
                            </li>
                        ) : (
                            normalizedStages.map(({ record: stage, id, order, isQuiz }, index) => {
                                const content = stage.module_content as ModuleContentRecord | null;
                                const quiz = stage.module_quiz as QuizRecord | null;
                                const badgeLabel = isQuiz ? 'Kuis' : 'Konten';
                                const badgeClass = isQuiz
                                    ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20'
                                    : 'bg-primary/10 text-primary ring-primary/20';
                                const title = isQuiz ? (quiz?.name ?? `Kuis ${order}`) : (content?.title ?? `Konten ${order}`);
                                const description = isQuiz ? quiz?.description : content?.description;
                                const contentType = !isQuiz ? content?.content_type : undefined;
                                const stageDurationLabel = formatMinutes(isQuiz ? (quiz?.duration ?? null) : (content?.duration ?? null));
                                const canMoveUp = id !== null && index > 0;
                                const canMoveDown = id !== null && index < normalizedStages.length - 1;

                                return (
                                    <li key={`module-stage-${id ?? index}`} className='rounded-xl border border-border/60 p-5 shadow-sm'>
                                        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                            <div className='flex items-start gap-3'>
                                                <div
                                                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                                                        isQuiz ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
                                                    }`}
                                                >
                                                    {isQuiz ? <Clipboard className='h-4 w-4' /> : <FileText className='h-4 w-4' />}
                                                </div>
                                                <div className='space-y-1'>
                                                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                                                        <span className='font-medium text-foreground'>Konten {order}</span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${badgeClass}`}
                                                        >
                                                            {badgeLabel}
                                                        </span>
                                                        {!isQuiz && contentType ? (
                                                            <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/70 ring-1 ring-border'>
                                                                {contentType}
                                                            </span>
                                                        ) : null}
                                                        {stageDurationLabel ? (
                                                            <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/70 ring-1 ring-border'>
                                                                <Clock className='h-3.5 w-3.5' />
                                                                {stageDurationLabel}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className='text-sm font-semibold text-foreground'>{title}</p>
                                                    {description ? <p className='text-xs text-muted-foreground'>{description}</p> : null}
                                                </div>
                                            </div>

                                            {canManageModules ? (
                                                <div className='flex flex-wrap items-center gap-2 text-xs'>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='icon'
                                                        aria-label='Naikkan urutan'
                                                        onClick={() => id && handleMoveStage(id, 'up')}
                                                        disabled={!canMoveUp || reorderingStageId === id}
                                                    >
                                                        <ArrowUp className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='icon'
                                                        aria-label='Turunkan urutan'
                                                        onClick={() => id && handleMoveStage(id, 'down')}
                                                        disabled={!canMoveDown || reorderingStageId === id}
                                                    >
                                                        <ArrowDown className='h-4 w-4' />
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='outline'
                                                        size='sm'
                                                        className='gap-2'
                                                        onClick={() => openEditDialog(stage)}
                                                        disabled={id === null}
                                                    >
                                                        <Pencil className='h-4 w-4' /> Ubah
                                                    </Button>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='icon'
                                                        className='text-destructive hover:text-destructive'
                                                        onClick={() => handleOpenDelete(stage)}
                                                        disabled={id === null}
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>

                                        {!isQuiz ? <ModuleStagePreview content={content} className='mt-4' /> : null}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>

                <div className='rounded-2xl border bg-card p-6 shadow-sm'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-foreground'>Tambah Konten Baru</h2>
                            <p className='text-sm text-muted-foreground'>Tambahkan materi atau kuis baru ke modul ini.</p>
                        </div>
                        <Button type='button' variant='outline' size='sm' className='gap-2' disabled>
                            <Plus className='h-4 w-4' /> Konten berikutnya
                        </Button>
                    </div>

                    {canManageModules ? (
                        <form onSubmit={handleSubmit} className='mt-6 space-y-5'>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div className='grid gap-2'>
                                    <Label>Jenis konten</Label>
                                    <Select
                                        value={form.data.type}
                                        onValueChange={(value) => handleTypeChange(value as StageType)}
                                        disabled={form.processing}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='content'>Konten</SelectItem>
                                            <SelectItem value='quiz'>Kuis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='grid gap-2'>
                                    <Label>Urutan (opsional)</Label>
                                    <Input
                                        type='number'
                                        min={1}
                                        value={form.data.order}
                                        onChange={(event) => form.setData('order', event.target.value)}
                                        placeholder={`${normalizedStages.length + 1}`}
                                        disabled={form.processing}
                                    />
                                    <InputError message={getError('order')} />
                                </div>
                            </div>

                            {form.data.type === 'content' ? (
                                <div className='grid gap-4'>
                                    <div className='grid gap-2'>
                                        <Label>Judul konten</Label>
                                        <Input
                                            value={form.data.content.title}
                                            onChange={(event) => setContentField('title', event.target.value)}
                                            placeholder='Contoh: Materi Pengenalan'
                                            disabled={form.processing}
                                        />
                                        <InputError message={getError('content.title')} />
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Deskripsi</Label>
                                        <Textarea
                                            value={form.data.content.description}
                                            onChange={(event) => setContentField('description', event.target.value)}
                                            placeholder='Ringkasan singkat konten.'
                                            rows={3}
                                            disabled={form.processing}
                                        />
                                        <InputError message={getError('content.description')} />
                                    </div>
                                    <div className='grid gap-2 sm:grid-cols-2'>
                                        <div className='grid gap-2'>
                                            <Label>Jenis konten</Label>
                                            <Input
                                                value={form.data.content.content_type}
                                                onChange={(event) => setContentField('content_type', event.target.value)}
                                                placeholder='Video, artikel, dokumen, dll.'
                                                disabled={form.processing}
                                            />
                                            <InputError message={getError('content.content_type')} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label>Durasi (menit)</Label>
                                            <Input
                                                type='number'
                                                min={1}
                                                value={form.data.content.duration}
                                                onChange={(event) => setContentField('duration', event.target.value)}
                                                placeholder='30'
                                                disabled={form.processing}
                                            />
                                            <InputError message={getError('content.duration')} />
                                            {formatMinutes(form.data.content.duration) ? (
                                                <p className='text-xs text-muted-foreground'>
                                                    Perkiraan: {formatMinutes(form.data.content.duration)}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Tautan konten</Label>
                                        <Input
                                            value={form.data.content.content_url}
                                            onChange={(event) => setContentField('content_url', event.target.value)}
                                            placeholder='https://contoh.com/materi'
                                            disabled={form.processing}
                                        />
                                        <InputError message={getError('content.content_url')} />
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Berkas pendukung (opsional)</Label>
                                        <Input type='file' onChange={handleFileChange} disabled={form.processing} />
                                        <InputError message={getError('content.file')} />
                                        {form.data.content.file ? (
                                            <p className='text-xs text-muted-foreground'>Berkas terpilih: {form.data.content.file.name}</p>
                                        ) : (
                                            <p className='text-xs text-muted-foreground'>
                                                Jika berkas diunggah, pratinjau utama akan menggunakan berkas tersebut.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-5'>
                                    <div className='grid gap-2'>
                                        <Label>Nama kuis</Label>
                                        <Input
                                            value={form.data.quiz.name}
                                            onChange={(event) => setQuizField('name', event.target.value)}
                                            placeholder='Contoh: Evaluasi Bab 1'
                                            disabled={form.processing}
                                        />
                                        <InputError message={getError('quiz.name')} />
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Deskripsi</Label>
                                        <Textarea
                                            value={form.data.quiz.description}
                                            onChange={(event) => setQuizField('description', event.target.value)}
                                            placeholder='Ringkasan singkat mengenai kuis.'
                                            rows={3}
                                            disabled={form.processing}
                                        />
                                        <InputError message={getError('quiz.description')} />
                                    </div>
                                    <div className='grid gap-4 sm:grid-cols-3'>
                                        <div className='grid gap-2'>
                                            <Label>Durasi (menit)</Label>
                                            <Input
                                                type='number'
                                                min={1}
                                                value={form.data.quiz.duration}
                                                onChange={(event) => setQuizField('duration', event.target.value)}
                                                placeholder='30'
                                                disabled={form.processing}
                                            />
                                            <InputError message={getError('quiz.duration')} />
                                        </div>
                                        <div className='flex flex-col gap-2 rounded-lg border border-dashed border-border/60 p-3'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <span className='text-sm font-medium text-foreground'>Acak urutan pertanyaan</span>
                                                <Checkbox
                                                    checked={form.data.quiz.is_question_shuffled}
                                                    onCheckedChange={(checked) => setQuizField('is_question_shuffled', Boolean(checked))}
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
                                                value={form.data.quiz.type}
                                                onChange={(event) => setQuizField('type', event.target.value)}
                                                placeholder='pre-test / post-test'
                                                disabled={form.processing}
                                            />
                                            <InputError message={getError('quiz.type')} />
                                        </div>
                                    </div>
                                    <div className='space-y-4'>
                                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                            <h3 className='text-sm font-semibold text-foreground'>Daftar pertanyaan</h3>
                                            <Button
                                                type='button'
                                                variant='outline'
                                                size='sm'
                                                onClick={addQuizQuestion}
                                                disabled={form.processing}
                                                className='gap-2'
                                            >
                                                <Plus className='h-4 w-4' /> Pertanyaan baru
                                            </Button>
                                        </div>
                                        <InputError message={getError('quiz.questions')} />
                                        {form.data.quiz.questions.map((question, questionIndex) => (
                                            <div
                                                key={`quiz-question-${questionIndex}`}
                                                className='space-y-4 rounded-xl border border-border/60 p-4 shadow-sm'
                                            >
                                                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                                    <div className='flex-1 space-y-3'>
                                                        <Label htmlFor={`quiz-question-${questionIndex}`}>Pertanyaan {questionIndex + 1}</Label>
                                                        <Textarea
                                                            id={`quiz-question-${questionIndex}`}
                                                            value={question.question}
                                                            onChange={(event) => setQuizQuestionField(questionIndex, 'question', event.target.value)}
                                                            placeholder='Tuliskan pertanyaan di sini'
                                                            rows={3}
                                                            disabled={form.processing}
                                                        />
                                                        <InputError message={getError(`quiz.questions.${questionIndex}.question`)} />
                                                        <div className='space-y-2 rounded-lg border border-dashed border-border/60 p-3'>
                                                            <Label className='text-xs font-medium text-muted-foreground'>
                                                                Gambar pertanyaan (opsional)
                                                            </Label>
                                                            <Input
                                                                type='file'
                                                                accept='image/*'
                                                                onChange={(event) => handleQuizQuestionImageChange(questionIndex, event)}
                                                                disabled={form.processing}
                                                            />
                                                            <InputError message={getError(`quiz.questions.${questionIndex}.question_image`)} />
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
                                                                    <p className='text-xs text-muted-foreground'>Gambar saat ini digunakan.</p>
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
                                                                    onClick={() => handleQuizQuestionImageRemove(questionIndex)}
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
                                                        onClick={() => removeQuizQuestion(questionIndex)}
                                                        disabled={form.processing || form.data.quiz.questions.length <= 1}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                                <div className='flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground'>
                                                    <Checkbox
                                                        checked={question.is_answer_shuffled}
                                                        onCheckedChange={(checked) =>
                                                            setQuizQuestionField(questionIndex, 'is_answer_shuffled', Boolean(checked))
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
                                                            onClick={() => addQuizOption(questionIndex)}
                                                            disabled={form.processing}
                                                            className='gap-2'
                                                        >
                                                            <Plus className='h-4 w-4' /> Jawaban baru
                                                        </Button>
                                                    </div>
                                                    <InputError message={getError(`quiz.questions.${questionIndex}.options`)} />
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={`quiz-question-${questionIndex}-option-${optionIndex}`}
                                                            className='flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4'
                                                        >
                                                            <div className='flex items-center gap-2'>
                                                                <Checkbox
                                                                    checked={option.is_correct}
                                                                    onCheckedChange={(checked) =>
                                                                        setQuizOptionField(questionIndex, optionIndex, 'is_correct', Boolean(checked))
                                                                    }
                                                                    disabled={form.processing}
                                                                />
                                                                <span className='text-xs text-muted-foreground'>Jawaban benar</span>
                                                            </div>
                                                            <div className='flex-1 space-y-3'>
                                                                <div className='space-y-2'>
                                                                    <Input
                                                                        value={option.option_text}
                                                                        onChange={(event) =>
                                                                            setQuizOptionField(
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
                                                                        message={getError(
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
                                                                            handleQuizOptionImageChange(questionIndex, optionIndex, event)
                                                                        }
                                                                        disabled={form.processing}
                                                                    />
                                                                    <InputError
                                                                        message={getError(
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
                                                                            onClick={() => handleQuizOptionImageRemove(questionIndex, optionIndex)}
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
                                                                onClick={() => removeQuizOption(questionIndex, optionIndex)}
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
                            )}

                            <div className='flex items-center justify-end border-t border-border pt-5'>
                                <Button type='submit' className='gap-2' disabled={form.processing}>
                                    {form.processing ? 'Menambahkan…' : 'Tambah konten'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <p className='mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                            Anda tidak memiliki izin untuk menambahkan konten pada modul ini.
                        </p>
                    )}
                </div>
            </div>

            <Dialog open={editDialogOpen} onOpenChange={(open) => (open ? null : closeEditDialog())}>
                <DialogContent className='max-w-3xl'>
                    <DialogHeader>
                        <DialogTitle>Perbarui Konten Modul</DialogTitle>
                        <DialogDescription>
                            Perbarui detail konten atau kuis. Jika Anda mengunggah berkas baru, pratinjau utama akan menggunakan berkas tersebut.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className='space-y-5'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='grid gap-2'>
                                <Label>Jenis konten</Label>
                                <Select
                                    value={editForm.data.type}
                                    onValueChange={(value) => handleEditTypeChange(value as StageType)}
                                    disabled={editForm.processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='content'>Konten</SelectItem>
                                        <SelectItem value='quiz'>Kuis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className='grid gap-2'>
                                <Label>Urutan</Label>
                                <Input
                                    type='number'
                                    min={1}
                                    value={editForm.data.order}
                                    onChange={(event) => editForm.setData('order', event.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={getEditError('order')} />
                            </div>
                        </div>

                        {editForm.data.type === 'content' ? (
                            <div className='grid gap-4'>
                                <div className='grid gap-2'>
                                    <Label>Judul konten</Label>
                                    <Input
                                        value={editForm.data.content.title}
                                        onChange={(event) => setEditContentField('title', event.target.value)}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={getEditError('content.title')} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label>Deskripsi</Label>
                                    <Textarea
                                        value={editForm.data.content.description}
                                        onChange={(event) => setEditContentField('description', event.target.value)}
                                        rows={3}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={getEditError('content.description')} />
                                </div>
                                <div className='grid gap-2 sm:grid-cols-2'>
                                    <div className='grid gap-2'>
                                        <Label>Jenis konten</Label>
                                        <Input
                                            value={editForm.data.content.content_type}
                                            onChange={(event) => setEditContentField('content_type', event.target.value)}
                                            disabled={editForm.processing}
                                        />
                                        <InputError message={getEditError('content.content_type')} />
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Durasi (menit)</Label>
                                        <Input
                                            type='number'
                                            min={1}
                                            value={editForm.data.content.duration}
                                            onChange={(event) => setEditContentField('duration', event.target.value)}
                                            disabled={editForm.processing}
                                        />
                                        <InputError message={getEditError('content.duration')} />
                                        {formatMinutes(editForm.data.content.duration) ? (
                                            <p className='text-xs text-muted-foreground'>
                                                Perkiraan: {formatMinutes(editForm.data.content.duration)}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <div className='grid gap-2'>
                                    <Label>Tautan konten</Label>
                                    <Input
                                        value={editForm.data.content.content_url}
                                        onChange={(event) => setEditContentField('content_url', event.target.value)}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={getEditError('content.content_url')} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label>Berkas pendukung</Label>
                                    <Input type='file' onChange={handleEditFileChange} disabled={editForm.processing} />
                                    <InputError message={getEditError('content.file')} />
                                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                        <Checkbox
                                            id='remove-file-checkbox'
                                            checked={Boolean(editForm.data.content.remove_file)}
                                            onCheckedChange={(checked) => handleEditRemoveFileToggle(Boolean(checked))}
                                            disabled={editForm.processing}
                                        />
                                        <Label htmlFor='remove-file-checkbox' className='text-xs text-muted-foreground'>
                                            Hapus berkas yang sudah diunggah
                                        </Label>
                                    </div>
                                </div>
                                {editingStage && editForm.data.type === 'content' ? (
                                    <ModuleStagePreview content={editingStage.module_content as ModuleContentRecord | null} className='mt-2' />
                                ) : null}
                            </div>
                        ) : (
                            <div className='space-y-5'>
                                <div className='grid gap-2'>
                                    <Label>Nama kuis</Label>
                                    <Input
                                        value={editForm.data.quiz.name}
                                        onChange={(event) => setEditQuizField('name', event.target.value)}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={getEditError('quiz.name')} />
                                </div>
                                <div className='grid gap-2'>
                                    <Label>Deskripsi</Label>
                                    <Textarea
                                        value={editForm.data.quiz.description}
                                        onChange={(event) => setEditQuizField('description', event.target.value)}
                                        rows={3}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={getEditError('quiz.description')} />
                                </div>
                                <div className='grid gap-4 sm:grid-cols-3'>
                                    <div className='grid gap-2'>
                                        <Label>Durasi (menit)</Label>
                                        <Input
                                            type='number'
                                            min={1}
                                            value={editForm.data.quiz.duration}
                                            onChange={(event) => setEditQuizField('duration', event.target.value)}
                                            disabled={editForm.processing}
                                        />
                                        <InputError message={getEditError('quiz.duration')} />
                                    </div>
                                    <div className='flex flex-col gap-2 rounded-lg border border-dashed border-border/60 p-3'>
                                        <div className='flex items-center justify-between gap-3'>
                                            <span className='text-sm font-medium text-foreground'>Acak urutan pertanyaan</span>
                                            <Checkbox
                                                checked={editForm.data.quiz.is_question_shuffled}
                                                onCheckedChange={(checked) => setEditQuizField('is_question_shuffled', Boolean(checked))}
                                                disabled={editForm.processing}
                                            />
                                        </div>
                                        <p className='text-xs text-muted-foreground'>
                                            Aktifkan untuk menampilkan pertanyaan dalam urutan acak bagi setiap peserta.
                                        </p>
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label>Kategori (opsional)</Label>
                                        <Input
                                            value={editForm.data.quiz.type}
                                            onChange={(event) => setEditQuizField('type', event.target.value)}
                                            disabled={editForm.processing}
                                        />
                                        <InputError message={getEditError('quiz.type')} />
                                    </div>
                                </div>
                                <div className='space-y-4'>
                                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                        <h3 className='text-sm font-semibold text-foreground'>Daftar pertanyaan</h3>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            size='sm'
                                            onClick={addEditQuizQuestion}
                                            disabled={editForm.processing}
                                            className='gap-2'
                                        >
                                            <Plus className='h-4 w-4' /> Pertanyaan baru
                                        </Button>
                                    </div>
                                    <InputError message={getEditError('quiz.questions')} />
                                    {editForm.data.quiz.questions.map((question, questionIndex) => (
                                        <div
                                            key={`edit-quiz-question-${questionIndex}`}
                                            className='space-y-4 rounded-xl border border-border/60 p-4 shadow-sm'
                                        >
                                            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                                                <div className='flex-1 space-y-3'>
                                                    <Label htmlFor={`edit-quiz-question-${questionIndex}`}>Pertanyaan {questionIndex + 1}</Label>
                                                    <Textarea
                                                        id={`edit-quiz-question-${questionIndex}`}
                                                        value={question.question}
                                                        onChange={(event) => setEditQuizQuestionField(questionIndex, 'question', event.target.value)}
                                                        rows={3}
                                                        disabled={editForm.processing}
                                                    />
                                                    <InputError message={getEditError(`quiz.questions.${questionIndex}.question`)} />
                                                    <div className='space-y-2 rounded-lg border border-dashed border-border/60 p-3'>
                                                        <Label className='text-xs font-medium text-muted-foreground'>
                                                            Gambar pertanyaan (opsional)
                                                        </Label>
                                                        <Input
                                                            type='file'
                                                            accept='image/*'
                                                            onChange={(event) => handleEditQuizQuestionImageChange(questionIndex, event)}
                                                            disabled={editForm.processing}
                                                        />
                                                        <InputError message={getEditError(`quiz.questions.${questionIndex}.question_image`)} />
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
                                                                <p className='text-xs text-muted-foreground'>Gambar saat ini digunakan.</p>
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
                                                                onClick={() => handleEditQuizQuestionImageRemove(questionIndex)}
                                                                disabled={editForm.processing}
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
                                                    onClick={() => removeEditQuizQuestion(questionIndex)}
                                                    disabled={editForm.processing || editForm.data.quiz.questions.length <= 1}
                                                >
                                                    Hapus
                                                </Button>
                                            </div>
                                            <div className='flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground'>
                                                <Checkbox
                                                    checked={question.is_answer_shuffled}
                                                    onCheckedChange={(checked) =>
                                                        setEditQuizQuestionField(questionIndex, 'is_answer_shuffled', Boolean(checked))
                                                    }
                                                    disabled={editForm.processing}
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
                                                        onClick={() => addEditQuizOption(questionIndex)}
                                                        disabled={editForm.processing}
                                                        className='gap-2'
                                                    >
                                                        <Plus className='h-4 w-4' /> Jawaban baru
                                                    </Button>
                                                </div>
                                                <InputError message={getEditError(`quiz.questions.${questionIndex}.options`)} />
                                                {question.options.map((option, optionIndex) => (
                                                    <div
                                                        key={`edit-quiz-question-${questionIndex}-option-${optionIndex}`}
                                                        className='flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-start sm:gap-4'
                                                    >
                                                        <div className='flex items-center gap-2'>
                                                            <Checkbox
                                                                checked={option.is_correct}
                                                                onCheckedChange={(checked) =>
                                                                    setEditQuizOptionField(questionIndex, optionIndex, 'is_correct', Boolean(checked))
                                                                }
                                                                disabled={editForm.processing}
                                                            />
                                                            <span className='text-xs text-muted-foreground'>Jawaban benar</span>
                                                        </div>
                                                        <div className='flex-1 space-y-3'>
                                                            <div className='space-y-2'>
                                                                <Input
                                                                    value={option.option_text}
                                                                    onChange={(event) =>
                                                                        setEditQuizOptionField(
                                                                            questionIndex,
                                                                            optionIndex,
                                                                            'option_text',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                    disabled={editForm.processing}
                                                                />
                                                                <InputError
                                                                    message={getEditError(
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
                                                                        handleEditQuizOptionImageChange(questionIndex, optionIndex, event)
                                                                    }
                                                                    disabled={editForm.processing}
                                                                />
                                                                <InputError
                                                                    message={getEditError(
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
                                                                        <p className='text-xs text-muted-foreground'>Gambar saat ini digunakan.</p>
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
                                                                        onClick={() => handleEditQuizOptionImageRemove(questionIndex, optionIndex)}
                                                                        disabled={editForm.processing}
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
                                                            onClick={() => removeEditQuizOption(questionIndex, optionIndex)}
                                                            disabled={editForm.processing || question.options.length <= 2}
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
                        )}

                        <DialogFooter>
                            <Button type='button' variant='outline' onClick={closeEditDialog} disabled={editForm.processing}>
                                Batal
                            </Button>
                            <Button type='submit' disabled={editForm.processing}>
                                {editForm.processing ? 'Menyimpan…' : 'Simpan perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteStage !== null} onOpenChange={(open) => (!open ? handleCloseDelete() : undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus konten modul</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus konten beserta materi yang melekat. Anda tetap dapat menambahkan konten baru sewaktu-waktu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingStageId !== null}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deletingStageId !== null}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            {deletingStageId !== null ? 'Menghapus…' : 'Hapus konten'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
