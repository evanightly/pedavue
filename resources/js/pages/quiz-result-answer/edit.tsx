// import AnswerController from '@/actions/App/Http/Controllers/AnswerController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
// import QuestionController from '@/actions/App/Http/Controllers/QuestionController';
import QuizResultAnswerController from '@/actions/App/Http/Controllers/QuizResultAnswerController';
import QuizResultController from '@/actions/App/Http/Controllers/QuizResultController';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export type QuizResultAnswerRecord = App.Data.QuizResultAnswer.QuizResultAnswerData;

export type QuizResultAnswerCollection = PaginationMeta & {
    data: App.Data.QuizResultAnswer.QuizResultAnswerData[];
};

interface QuizResultAnswerEditProps {
    record: QuizResultAnswerRecord;
}

export default function QuizResultAnswerEdit({ record }: QuizResultAnswerEditProps) {
    const normalizeFieldValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (_error) {
                return '';
            }
        }

        return String(value);
    };

    const normalizeSelectorItems = (payload: unknown): Array<Record<string, unknown>> => {
        if (Array.isArray(payload)) {
            return payload as Array<Record<string, unknown>>;
        }

        if (payload && typeof payload === 'object') {
            const record = payload as Record<string, unknown>;
            const candidateKeys = ['data', 'records', 'items', 'results'];

            for (const key of candidateKeys) {
                const value = record[key];

                if (Array.isArray(value)) {
                    return value as Array<Record<string, unknown>>;
                }

                if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).data)) {
                    return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
                }
            }

            for (const value of Object.values(record)) {
                if (Array.isArray(value)) {
                    return value as Array<Record<string, unknown>>;
                }

                if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).data)) {
                    return (value as Record<string, unknown>).data as Array<Record<string, unknown>>;
                }
            }
        }

        return [];
    };

    const mapQuizResultSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
        if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
            const data = (response as Record<string, unknown>).data;
            const normalized = normalizeSelectorItems(data);

            if (normalized.length > 0) {
                return normalized;
            }
        }

        const fallback = normalizeSelectorItems(response);

        if (fallback.length > 0) {
            return fallback;
        }

        return [];
    };

    const mapQuestionSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
        if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
            const data = (response as Record<string, unknown>).data;
            const normalized = normalizeSelectorItems(data);

            if (normalized.length > 0) {
                return normalized;
            }
        }

        const fallback = normalizeSelectorItems(response);

        if (fallback.length > 0) {
            return fallback;
        }

        return [];
    };

    const mapAnswerSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
        if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
            const data = (response as Record<string, unknown>).data;
            const normalized = normalizeSelectorItems(data);

            if (normalized.length > 0) {
                return normalized;
            }
        }

        const fallback = normalizeSelectorItems(response);

        if (fallback.length > 0) {
            return fallback;
        }

        return [];
    };

    const fetchQuizResultOptions = async ({ search }: { search?: string }) => {
        const params: Record<string, unknown> = {};

        if (search && search.trim().length > 0) {
            params['filter[search]'] = search.trim();
        }

        const response = await axios.get(QuizResultController.index().url, { params });

        return response;
    };

    // const fetchQuestionOptions = async ({ search }: { search?: string }) => {
    //   const params: Record<string, unknown> = {};

    //   if (search && search.trim().length > 0) {
    //     params['filter[search]'] = search.trim();
    //   }

    //   const response = await axios.get(QuestionController.index().url, { params });

    //   return response;
    // };

    // const fetchAnswerOptions = async ({ search }: { search?: string }) => {
    //   const params: Record<string, unknown> = {};

    //   if (search && search.trim().length > 0) {
    //     params['filter[search]'] = search.trim();
    //   }

    //   const response = await axios.get(AnswerController.index().url, { params });

    //   return response;
    // };

    const [quizResultId, setQuizResultId] = useState<number | string | null>(() => {
        const direct = record?.quiz_result_id;

        if (typeof direct === 'number' || typeof direct === 'string') {
            return direct;
        }

        const related = record?.quiz_result;

        if (related && typeof related === 'object' && 'id' in related) {
            return (related as { id?: number | string }).id ?? null;
        }

        return null;
    });
    const [questionId, setQuestionId] = useState<number | string | null>(() => {
        const direct = record?.question_id;

        if (typeof direct === 'number' || typeof direct === 'string') {
            return direct;
        }

        const related = record?.question;

        if (related && typeof related === 'object' && 'id' in related) {
            return (related as { id?: number | string }).id ?? null;
        }

        return null;
    });
    const [answerId, setAnswerId] = useState<number | string | null>(() => {
        const direct = record?.answer_id;

        if (typeof direct === 'number' || typeof direct === 'string') {
            return direct;
        }

        const related = record?.answer;

        if (related && typeof related === 'object' && 'id' in related) {
            return (related as { id?: number | string }).id ?? null;
        }

        return null;
    });

    return (
        <AppLayout>
            <Head title='Edit Quiz Result Answer' />
            <Form
                {...QuizResultAnswerController.update.form(record.id)}
                transform={(data) => ({
                    ...data,
                    quiz_result_id: (() => {
                        if (quizResultId === null) {
                            return null;
                        }

                        if (typeof quizResultId === 'number') {
                            return quizResultId;
                        }

                        const numeric = Number.parseInt(String(quizResultId), 10);
                        return Number.isNaN(numeric) ? null : numeric;
                    })(),
                    question_id: (() => {
                        if (questionId === null) {
                            return null;
                        }

                        if (typeof questionId === 'number') {
                            return questionId;
                        }

                        const numeric = Number.parseInt(String(questionId), 10);
                        return Number.isNaN(numeric) ? null : numeric;
                    })(),
                    answer_id: (() => {
                        if (answerId === null) {
                            return null;
                        }

                        if (typeof answerId === 'number') {
                            return answerId;
                        }

                        const numeric = Number.parseInt(String(answerId), 10);
                        return Number.isNaN(numeric) ? null : numeric;
                    })(),
                })}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Edit Quiz Result Answer</h1>
                            <p className='text-sm text-muted-foreground'>Provide the necessary information below and submit when you're ready.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='user_answer_text'>User Answer Text</Label>
                                <Textarea
                                    id='user_answer_text'
                                    name='user_answer_text'
                                    rows={4}
                                    defaultValue={normalizeFieldValue(record.user_answer_text) as string}
                                />
                                <InputError message={errors.user_answer_text} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='started_at'>Started At</Label>
                                <Input
                                    id='started_at'
                                    name='started_at'
                                    type='datetime-local'
                                    defaultValue={normalizeFieldValue(record.started_at)}
                                />
                                <InputError message={errors.started_at} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='finished_at'>Finished At</Label>
                                <Input
                                    id='finished_at'
                                    name='finished_at'
                                    type='datetime-local'
                                    defaultValue={normalizeFieldValue(record.finished_at)}
                                />
                                <InputError message={errors.finished_at} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='quiz_result_id'>Quiz Result</Label>
                                <GenericDataSelector<Record<string, unknown>>
                                    id='quiz_result-selector'
                                    placeholder={`Select Quiz Result`}
                                    fetchData={fetchQuizResultOptions}
                                    dataMapper={mapQuizResultSelectorResponse}
                                    selectedDataId={quizResultId}
                                    setSelectedData={(value) => setQuizResultId(value)}
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.quiz_result_id} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='question_id'>Question</Label>
                                <GenericDataSelector<Record<string, unknown>>
                                    id='question-selector'
                                    placeholder={`Select Question`}
                                    fetchData={fetchQuestionOptions}
                                    dataMapper={mapQuestionSelectorResponse}
                                    selectedDataId={questionId}
                                    setSelectedData={(value) => setQuestionId(value)}
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.question_id} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='answer_id'>Answer</Label>
                                <GenericDataSelector<Record<string, unknown>>
                                    id='answer-selector'
                                    placeholder={`Select Answer`}
                                    fetchData={fetchAnswerOptions}
                                    dataMapper={mapAnswerSelectorResponse}
                                    selectedDataId={answerId}
                                    setSelectedData={(value) => setAnswerId(value)}
                                    nullable
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.answer_id} />
                            </div>
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
