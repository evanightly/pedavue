import CourseCertificateController from '@/actions/App/Http/Controllers/CourseCertificateController';
import WorkspaceModuleStageController from '@/actions/App/Http/Controllers/WorkspaceModuleStageController';
import ModuleStagePreview from '@/components/module-stage-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import axios, { isAxiosError } from 'axios';
import {
    AlertTriangle,
    Award,
    BookOpen,
    CheckCircle2,
    CheckSquare,
    Circle,
    CircleDot,
    Clock,
    Flame,
    History,
    Loader2,
    Lock,
    PlayCircle,
    RotateCcw,
    Square,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface StageProgressMeta {
    id?: number | null;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
    deadline_at?: string | null;
    server_now?: string | null;
    quiz_result_id?: number | null;
    score?: number | null;
    attempt?: number | null;
    earned_points?: number | null;
    total_points?: number | null;
    read_only?: boolean;
    answers?: Record<number, number[]>;
    result?: {
        score: number;
        correct: number;
        total: number;
        auto_submitted?: boolean;
    } | null;
    attempt_history?: Array<{
        attempt: number;
        score: number;
        correct: number;
        total: number;
        earned_points: number;
        total_points: number;
        auto_submitted?: boolean;
        finished_at?: string | null;
    }>;
}

type AttemptHistoryEntry = NonNullable<StageProgressMeta['attempt_history']>[number];

interface StageSummary {
    id: number;
    module_id: number;
    order: number;
    type: string | null;
    title: string;
    description?: string | null;
    duration_minutes?: number | null;
    duration_label?: string | null;
    status: string;
    locked: boolean;
    current: boolean;
    progress: StageProgressMeta | null;
    quiz?: {
        id: number;
        name: string;
        question_count: number;
        duration_minutes?: number | null;
        duration_label?: string | null;
        is_question_shuffled: boolean;
    } | null;
    content?: {
        id: number;
        title?: string | null;
        content_type?: string | null;
        content_url?: string | null;
        file_url?: string | null;
        duration_minutes?: number | null;
        duration_label?: string | null;
    } | null;
}

interface ModuleSummary {
    id: number;
    title: string;
    description?: string | null;
    order: number;
    locked: boolean;
    completed: boolean;
    stages: StageSummary[];
    completed_stage_count: number;
    total_stage_count: number;
}

interface QuizPointsStats {
    earned: number;
    total: number;
    required: number;
}

interface CertificateStats {
    enabled: boolean;
    required_points: number;
    eligible: boolean;
}

interface StatsPayload {
    completed_stages: number;
    total_stages: number;
    progress_percentage: number;
    quiz_points?: QuizPointsStats | null;
    certificate?: CertificateStats | null;
}

interface EnrollmentPayload {
    id: number;
    progress: number;
    progress_label?: string | null;
    completed_at?: string | null;
}

interface QuizOptionPayload {
    id: number;
    text: string;
    image_url?: string | null;
}

interface QuizQuestionPayload {
    id: number;
    question: string;
    question_image_url?: string | null;
    selection_mode: 'single' | 'multiple';
    options: QuizOptionPayload[];
}

interface QuizPayload {
    id: number;
    name: string;
    description?: string | null;
    duration_minutes?: number | null;
    duration_label?: string | null;
    questions: QuizQuestionPayload[];
}

interface StageDetailPayload {
    stage: StageSummary;
    quiz?: QuizPayload | null;
    progress?: StageProgressMeta | null;
    modules?: ModuleSummary[] | null;
    stats?: StatsPayload | null;
    currentStageId?: number | null;
    enrollment?: EnrollmentPayload | null;
}

interface StageUpdatePayload {
    modules?: ModuleSummary[];
    stats?: StatsPayload;
    currentStageId?: number | null;
    stage?: StageSummary | null;
    quiz?: QuizPayload | null;
    progress?: StageProgressMeta | null;
    result?: {
        score: number;
        correct: number;
        total: number;
        auto_submitted?: boolean;
    } | null;
    enrollment?: EnrollmentPayload | null;
}

interface WorkspaceCoursePageProps {
    course: {
        id: number;
        title: string;
        description?: string | null;
        slug: string;
        thumbnail_url?: string | null;
        certification_enabled?: boolean;
        certificate_template_url?: string | null;
    };
    enrollment: EnrollmentPayload;
    modules: ModuleSummary[];
    stats: StatsPayload;
    currentStageId?: number | null;
}

type AnswerMap = Record<number, number[]>;

type StageAction = 'complete' | 'submit' | 'autosubmit';

const ANSWER_AUTOSAVE_DELAY = 1500;

function normalizeAnswersMap(answers: AnswerMap): AnswerMap {
    const normalized: AnswerMap = {};

    Object.entries(answers).forEach(([questionId, optionIds]) => {
        const parsedQuestionId = Number.parseInt(questionId, 10);

        if (!Number.isFinite(parsedQuestionId) || parsedQuestionId <= 0) {
            return;
        }

        const sanitized = Array.from(new Set(optionIds.map(Number)))
            .filter((value) => Number.isFinite(value) && value > 0)
            .sort((a, b) => a - b);

        normalized[parsedQuestionId] = sanitized;
    });

    return normalized;
}

function answersAreEqual(left: AnswerMap, right: AnswerMap): boolean {
    const leftKeys = Object.keys(left)
        .map((value) => Number.parseInt(value, 10))
        .sort((a, b) => a - b);
    const rightKeys = Object.keys(right)
        .map((value) => Number.parseInt(value, 10))
        .sort((a, b) => a - b);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    for (let index = 0; index < leftKeys.length; index++) {
        if (leftKeys[index] !== rightKeys[index]) {
            return false;
        }

        const leftValues = left[leftKeys[index]] ?? [];
        const rightValues = right[rightKeys[index]] ?? [];

        if (leftValues.length !== rightValues.length) {
            return false;
        }

        for (let innerIndex = 0; innerIndex < leftValues.length; innerIndex++) {
            if (leftValues[innerIndex] !== rightValues[innerIndex]) {
                return false;
            }
        }
    }

    return true;
}

function mapAnswersFromResponse(input?: Record<number | string, number[] | null>): AnswerMap {
    if (!input) {
        return {};
    }

    const mapped: AnswerMap = {};

    Object.entries(input).forEach(([questionId, optionIds]) => {
        const parsedQuestionId = Number.parseInt(questionId, 10);

        if (!Number.isFinite(parsedQuestionId) || parsedQuestionId <= 0) {
            return;
        }

        if (!Array.isArray(optionIds)) {
            mapped[parsedQuestionId] = [];

            return;
        }

        mapped[parsedQuestionId] = optionIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
    });

    return normalizeAnswersMap(mapped);
}

function resolveStageTypeLabel(type: string | null): string {
    if (type === 'content') {
        return 'Materi';
    }

    if (type === 'quiz') {
        return 'Kuis';
    }

    return 'Tahap';
}

function formatStageStatus(status: string): string {
    switch (status) {
        case 'completed':
            return 'Selesai';
        case 'in_progress':
            return 'Sedang berlangsung';
        default:
            return 'Belum dimulai';
    }
}

function formatCountdown(seconds: number): string {
    const clamped = Math.max(0, seconds);
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const secs = clamped % 60;

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const iconClass = 'h-4 w-4';

export default function WorkspaceCourseShowPage({
    course,
    enrollment: initialEnrollment,
    modules: initialModules,
    stats: initialStats,
    currentStageId: initialCurrentStageId = null,
}: WorkspaceCoursePageProps) {
    const courseSlug = course.slug;

    const [modules, setModules] = useState<ModuleSummary[]>(initialModules);
    const [stats, setStats] = useState<StatsPayload>(initialStats);
    const [enrollment, setEnrollment] = useState<EnrollmentPayload>(initialEnrollment);
    const [currentStageId, setCurrentStageId] = useState<number | null>(initialCurrentStageId ?? null);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const [stageDetail, setStageDetail] = useState<{ stage: StageSummary; quiz?: QuizPayload | null; progress?: StageProgressMeta | null } | null>(
        null,
    );
    const [isStageLoading, setIsStageLoading] = useState(false);
    const [isCompletingStage, setIsCompletingStage] = useState(false);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [isReattemptingQuiz, setIsReattemptingQuiz] = useState(false);
    const [isSavingAnswers, setIsSavingAnswers] = useState(false);
    const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
    const [lastAction, setLastAction] = useState<StageAction | null>(null);
    const [answers, setAnswers] = useState<AnswerMap>({});

    const numberFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
    const dateTimeFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
            }),
        [],
    );
    const quizPoints = stats?.quiz_points ?? null;
    const earnedPoints = Math.max(0, quizPoints?.earned ?? 0);
    const totalQuizPoints = quizPoints?.total;
    const certificateStats = stats?.certificate ?? null;
    const certificateRequiredPoints = Math.max(0, certificateStats?.required_points ?? quizPoints?.required ?? 0);
    const certificateFeatureEnabled = certificateStats?.enabled ?? Boolean(course.certification_enabled);
    const certificateEnabled = Boolean(course.certification_enabled && course.certificate_template_url && certificateFeatureEnabled);
    const progressComplete = Boolean(enrollment.completed_at);
    const meetsPointRequirement = certificateStats?.eligible ?? true;
    const certificateReady = certificateEnabled && progressComplete && meetsPointRequirement;
    const certificateBlockedByPoints = certificateEnabled && progressComplete && !meetsPointRequirement && certificateRequiredPoints > 0;

    const certificateHelperText = useMemo(() => {
        if (!certificateEnabled) {
            return 'Instruktur belum mengaktifkan sertifikat untuk kursus ini.';
        }

        if (certificateReady) {
            return 'Selamat! Sertifikat siap diunduh.';
        }

        if (!progressComplete) {
            return 'Selesaikan seluruh tahap untuk membuka sertifikat.';
        }

        if (certificateBlockedByPoints) {
            const formattedRequired = numberFormatter.format(certificateRequiredPoints);
            const formattedEarned = numberFormatter.format(earnedPoints);
            const hasTotal = typeof totalQuizPoints === 'number' && Number.isFinite(totalQuizPoints) && totalQuizPoints > 0;

            if (hasTotal) {
                const formattedTotal = numberFormatter.format(totalQuizPoints);

                return `Kamu membutuhkan minimal ${formattedRequired} poin kuis untuk membuka sertifikat. Saat ini kamu baru mengumpulkan ${formattedEarned} poin dari total ${formattedTotal} poin.`;
            }

            return `Kamu membutuhkan minimal ${formattedRequired} poin kuis untuk membuka sertifikat. Saat ini kamu baru mengumpulkan ${formattedEarned} poin.`;
        }

        return 'Sertifikat belum tersedia.';
    }, [
        certificateBlockedByPoints,
        certificateEnabled,
        certificateReady,
        certificateRequiredPoints,
        earnedPoints,
        numberFormatter,
        progressComplete,
        totalQuizPoints,
    ]);

    const autosaveTimeoutRef = useRef<number | null>(null);
    const lastSavedAnswersRef = useRef<AnswerMap>({});
    const countdownIntervalRef = useRef<number | null>(null);
    const serverOffsetRef = useRef<number>(0);
    const initialStageLoadedRef = useRef(false);
    const autoSubmitTriggeredRef = useRef(false);

    const findStageSummary = useCallback(
        (stageId: number): StageSummary | null => {
            for (const module of modules) {
                const stage = module.stages.find((item) => item.id === stageId);

                if (stage) {
                    return stage;
                }
            }

            return null;
        },
        [modules],
    );

    const determineInitialStageId = useMemo(() => {
        if (initialCurrentStageId) {
            return initialCurrentStageId;
        }

        for (const module of initialModules) {
            const unlockedStage = module.stages.find((stage) => !stage.locked);

            if (unlockedStage) {
                return unlockedStage.id;
            }
        }

        const firstStage = initialModules.flatMap((module) => module.stages)[0];

        return firstStage ? firstStage.id : null;
    }, [initialCurrentStageId, initialModules]);

    const applyOverviewUpdate = useCallback((payload: StageUpdatePayload): void => {
        if (payload.modules) {
            setModules(payload.modules);
        }

        if (payload.stats) {
            setStats(payload.stats);
            setEnrollment((previous) => ({
                ...previous,
                progress: payload.stats?.progress_percentage ?? previous.progress,
                progress_label: `${payload.stats?.progress_percentage ?? previous.progress}%`,
                completed_at:
                    payload.stats && payload.stats.progress_percentage >= 100
                        ? (previous.completed_at ?? new Date().toISOString())
                        : (payload.enrollment?.completed_at ?? previous.completed_at ?? null),
            }));
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'currentStageId')) {
            setCurrentStageId(payload.currentStageId ?? null);
        }

        if (payload.enrollment) {
            setEnrollment(payload.enrollment);
        }

        if (payload.stage) {
            setModules((previous) =>
                previous.map((module) => {
                    if (module.id !== payload.stage?.module_id) {
                        return module;
                    }

                    return {
                        ...module,
                        stages: module.stages.map((stage) => (stage.id === payload.stage?.id ? payload.stage! : stage)),
                    };
                }),
            );

            setStageDetail((previous) => {
                if (!previous || previous.stage.id !== payload.stage?.id) {
                    return previous;
                }

                return {
                    stage: payload.stage,
                    quiz: payload.quiz ?? previous.quiz,
                    progress: payload.progress ?? previous.progress,
                };
            });
        }
    }, []);

    const clearCountdown = useCallback((): void => {
        if (countdownIntervalRef.current !== null) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const initialiseCountdown = useCallback(
        (progress: StageProgressMeta | null | undefined): void => {
            clearCountdown();
            autoSubmitTriggeredRef.current = false;

            if (!progress || !progress.deadline_at || progress.read_only) {
                setCountdownSeconds(null);
                return;
            }

            const deadline = new Date(progress.deadline_at).getTime();
            const serverNow = progress.server_now ? new Date(progress.server_now).getTime() : Date.now();
            serverOffsetRef.current = Date.now() - serverNow;

            const tick = () => {
                const now = Date.now() - serverOffsetRef.current;
                const remainingMs = deadline - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);

                if (remainingSeconds <= 0) {
                    setCountdownSeconds(0);

                    if (!autoSubmitTriggeredRef.current) {
                        autoSubmitTriggeredRef.current = true;
                        handleSubmitQuiz(true).catch(() => {
                            /* handled via toast */
                        });
                    }

                    clearCountdown();

                    return;
                }

                setCountdownSeconds(remainingSeconds);
            };

            tick();
            countdownIntervalRef.current = window.setInterval(tick, 1000);
        },
        [clearCountdown],
    );

    const handleStageDetailResponse = useCallback(
        (data: StageDetailPayload): void => {
            const quizAnswers = mapAnswersFromResponse(data.progress?.answers ?? data.progress?.answers);
            setStageDetail({ stage: data.stage, quiz: data.quiz ?? null, progress: data.progress ?? null });
            setAnswers(quizAnswers);
            lastSavedAnswersRef.current = quizAnswers;
            setLastAction(null);
            initialiseCountdown(data.progress ?? null);

            applyOverviewUpdate({
                modules: data.modules ?? undefined,
                stats: data.stats ?? undefined,
                currentStageId: data.currentStageId ?? undefined,
                enrollment: data.enrollment ?? undefined,
                stage: data.stage,
                quiz: data.quiz ?? undefined,
                progress: data.progress ?? undefined,
            });
        },
        [applyOverviewUpdate, initialiseCountdown],
    );

    const fetchStageDetail = useCallback(
        async (stage: StageSummary): Promise<void> => {
            setIsStageLoading(true);

            try {
                const response = await axios.get<StageDetailPayload>(
                    WorkspaceModuleStageController.show.url({ course: courseSlug, module: stage.module_id, module_stage: stage.id }),
                );

                handleStageDetailResponse(response.data);
            } catch (error) {
                toast.error('Gagal memuat detail tahap.');
            } finally {
                setIsStageLoading(false);
            }
        },
        [courseSlug, handleStageDetailResponse],
    );

    const handleDownloadCertificate = useCallback(async (): Promise<void> => {
        if (!certificateEnabled || !certificateReady) {
            return;
        }

        setIsDownloadingCertificate(true);

        try {
            const response = await axios.get(CourseCertificateController.download.url({ course: courseSlug }), { responseType: 'blob' });

            const blob = new Blob([response.data], {
                type: typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : 'application/octet-stream',
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;

            const disposition = response.headers['content-disposition'];
            let filename = `${courseSlug}-certificate`;

            if (typeof disposition === 'string') {
                const match = disposition.match(/filename="?([^";]+)"?/i);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Sertifikat berhasil diunduh.');
        } catch (error) {
            let message = 'Gagal mengunduh sertifikat. Silakan coba lagi.';

            if (isAxiosError(error) && error.response) {
                const responseData = error.response.data;

                if (responseData instanceof Blob) {
                    try {
                        const text = await responseData.text();

                        if (text.trim() !== '') {
                            try {
                                const parsed = JSON.parse(text);

                                if (typeof parsed?.message === 'string' && parsed.message.trim() !== '') {
                                    message = parsed.message;
                                }
                            } catch {
                                message = text;
                            }
                        }
                    } catch {
                        /* ignore blob parse errors */
                    }
                } else if (typeof responseData?.message === 'string' && responseData.message.trim() !== '') {
                    message = responseData.message;
                }
            }

            toast.error(message);
        } finally {
            setIsDownloadingCertificate(false);
        }
    }, [certificateEnabled, certificateReady, courseSlug]);

    const handleSelectStage = useCallback(
        async (stageId: number): Promise<void> => {
            if (stageId === selectedStageId && stageDetail) {
                return;
            }

            const stage = findStageSummary(stageId);

            if (!stage) {
                toast.error('Tahap tidak ditemukan.');
                return;
            }

            if (stage.locked) {
                toast.warning('Selesaikan tahap sebelumnya terlebih dahulu.');
                return;
            }

            setSelectedStageId(stageId);
            await fetchStageDetail(stage);
        },
        [fetchStageDetail, findStageSummary, selectedStageId, stageDetail],
    );

    useEffect(() => {
        if (initialStageLoadedRef.current) {
            return;
        }

        if (determineInitialStageId !== null) {
            initialStageLoadedRef.current = true;
            handleSelectStage(determineInitialStageId).catch(() => {
                /* handled inside */
            });
        }
    }, [determineInitialStageId, handleSelectStage]);

    const persistAnswers = useCallback(
        async (showFeedback = false): Promise<void> => {
            if (!stageDetail?.quiz || stageDetail.progress?.read_only) {
                return;
            }

            const normalizedAnswers = normalizeAnswersMap(answers);

            if (answersAreEqual(normalizedAnswers, lastSavedAnswersRef.current)) {
                if (showFeedback) {
                    toast.info('Tidak ada perubahan jawaban yang perlu disimpan.');
                }

                return;
            }

            setIsSavingAnswers(true);

            try {
                await axios.post(
                    WorkspaceModuleStageController.saveQuizProgress.url({
                        course: courseSlug,
                        module: stageDetail.stage.module_id,
                        module_stage: stageDetail.stage.id,
                    }),
                    {
                        answers: normalizedAnswers,
                    },
                );

                lastSavedAnswersRef.current = normalizedAnswers;

                if (showFeedback) {
                    toast.success('Jawaban sementara tersimpan.');
                }
            } catch (error) {
                toast.error('Gagal menyimpan jawaban. Silakan coba lagi.');
            } finally {
                setIsSavingAnswers(false);
            }
        },
        [answers, courseSlug, stageDetail],
    );

    useEffect(() => {
        if (!stageDetail?.quiz || stageDetail.progress?.read_only) {
            return;
        }

        if (autosaveTimeoutRef.current !== null) {
            window.clearTimeout(autosaveTimeoutRef.current);
        }

        autosaveTimeoutRef.current = window.setTimeout(() => {
            persistAnswers().catch(() => {
                /* handled inside */
            });
        }, ANSWER_AUTOSAVE_DELAY);

        return () => {
            if (autosaveTimeoutRef.current !== null) {
                window.clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
        };
    }, [answers, persistAnswers, stageDetail?.progress?.read_only, stageDetail?.quiz?.id]);

    useEffect(() => () => clearCountdown(), [clearCountdown]);

    const handleCompleteStage = useCallback(async (): Promise<void> => {
        if (!stageDetail) {
            return;
        }

        if (stageDetail.stage.type !== 'content') {
            return;
        }

        if (stageDetail.stage.progress?.status === 'completed') {
            toast.info('Tahap ini sudah selesai.');
            return;
        }

        setIsCompletingStage(true);

        try {
            const response = await axios.post<StageUpdatePayload>(
                WorkspaceModuleStageController.complete.url({
                    course: courseSlug,
                    module: stageDetail.stage.module_id,
                    module_stage: stageDetail.stage.id,
                }),
            );

            applyOverviewUpdate(response.data);

            if (response.data.stage) {
                setStageDetail((previous) =>
                    previous && previous.stage.id === response.data.stage?.id
                        ? {
                              stage: response.data.stage!,
                              quiz: previous.quiz,
                              progress: response.data.progress ?? previous.progress,
                          }
                        : previous,
                );
            }

            toast.success('Tahap berhasil ditandai selesai.');
        } catch (error) {
            toast.error('Gagal menandai tahap sebagai selesai.');
        } finally {
            setIsCompletingStage(false);
        }
    }, [applyOverviewUpdate, courseSlug, stageDetail]);

    const handleSubmitQuiz = useCallback(
        async (autoSubmit = false): Promise<void> => {
            if (!stageDetail?.quiz) {
                return;
            }

            if (stageDetail.progress?.read_only) {
                return;
            }

            if (!autoSubmit) {
                await persistAnswers(true);
            }

            setIsSubmittingQuiz(true);
            setLastAction(autoSubmit ? 'autosubmit' : 'submit');

            try {
                const response = await axios.post<StageUpdatePayload>(
                    WorkspaceModuleStageController.submitQuiz.url({
                        course: courseSlug,
                        module: stageDetail.stage.module_id,
                        module_stage: stageDetail.stage.id,
                    }),
                    {
                        answers: normalizeAnswersMap(answers),
                        auto_submit: autoSubmit,
                    },
                );

                applyOverviewUpdate(response.data);

                if (response.data.stage) {
                    setStageDetail({
                        stage: response.data.stage,
                        quiz: response.data.quiz ?? stageDetail.quiz,
                        progress: response.data.progress ?? stageDetail.progress,
                    });
                }

                if (response.data.progress?.result) {
                    const message = autoSubmit ? 'Waktu habis. Kuis diserahkan otomatis.' : 'Jawaban kuis berhasil dikirim.';
                    toast.success(message);
                }

                lastSavedAnswersRef.current = normalizeAnswersMap(answers);
                initialiseCountdown(response.data.progress ?? null);
            } catch (error) {
                toast.error('Gagal mengirim kuis. Silakan coba lagi.');
            } finally {
                setIsSubmittingQuiz(false);
            }
        },
        [answers, applyOverviewUpdate, courseSlug, initialiseCountdown, persistAnswers, stageDetail],
    );

    const handleReattemptQuiz = useCallback(async (): Promise<void> => {
        if (!stageDetail?.quiz) {
            return;
        }

        setIsReattemptingQuiz(true);

        try {
            const response = await axios.post<StageDetailPayload>(
                WorkspaceModuleStageController.reattemptQuiz.url({
                    course: courseSlug,
                    module: stageDetail.stage.module_id,
                    module_stage: stageDetail.stage.id,
                }),
            );

            handleStageDetailResponse(response.data);
            const attemptLabel = response.data.progress?.attempt ?? 1;
            toast.success(`Percobaan ke-${attemptLabel} dimulai. Selamat mencoba!`);
        } catch (error) {
            toast.error('Gagal memulai percobaan baru. Silakan coba lagi.');
        } finally {
            setIsReattemptingQuiz(false);
        }
    }, [courseSlug, handleStageDetailResponse, stageDetail]);

    const handleToggleOption = useCallback((questionId: number, optionId: number, mode: 'single' | 'multiple') => {
        setAnswers((previous) => {
            const current = previous[questionId] ?? [];
            let next: number[] = [];

            if (mode === 'single') {
                next = current.includes(optionId) ? [] : [optionId];
            } else {
                next = current.includes(optionId) ? current.filter((value) => value !== optionId) : [...current, optionId];
            }

            return {
                ...previous,
                [questionId]: next,
            };
        });
    }, []);

    const handleManualSave = useCallback(() => {
        persistAnswers(true).catch(() => {
            /* handled inside */
        });
    }, [persistAnswers]);

    const renderStageBadge = (stage: StageSummary) => {
        if (stage.locked) {
            return (
                <Badge variant='outline' className='flex items-center gap-1 text-muted-foreground'>
                    <Lock className={iconClass} />
                    Terkunci
                </Badge>
            );
        }

        if (stage.status === 'completed') {
            return (
                <Badge variant='secondary' className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400'>
                    <CheckCircle2 className={iconClass} />
                    Selesai
                </Badge>
            );
        }

        if (stage.status === 'in_progress') {
            return (
                <Badge variant='outline' className='flex items-center gap-1 text-primary'>
                    <Flame className={iconClass} />
                    Sedang berlangsung
                </Badge>
            );
        }

        return (
            <Badge variant='outline' className='flex items-center gap-1'>
                <Circle className={iconClass} />
                Belum dimulai
            </Badge>
        );
    };

    const renderModuleList = () => (
        <Card className='h-full overflow-hidden border-dashed'>
            <CardHeader className='space-y-2'>
                <CardTitle className='text-lg font-semibold'>Struktur Kursus</CardTitle>
                <p className='text-sm text-muted-foreground'>Ikuti urutan modul dan tahap sesuai urutan untuk membuka materi berikutnya.</p>
            </CardHeader>
            <CardContent className='pt-0'>
                <ScrollArea className='h-[600px] pr-2'>
                    <div className='space-y-6'>
                        {modules.map((module) => (
                            <div key={module.id} className='space-y-3'>
                                <div>
                                    <div className='flex items-start justify-between gap-3'>
                                        <h3 className='text-base leading-tight font-semibold'>{module.title}</h3>
                                        {module.completed ? (
                                            <Badge variant='secondary' className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400'>
                                                <CheckCircle2 className={iconClass} />
                                                Modul selesai
                                            </Badge>
                                        ) : module.locked ? (
                                            <Badge variant='outline' className='flex items-center gap-1 text-muted-foreground'>
                                                <Lock className={iconClass} />
                                                Terkunci
                                            </Badge>
                                        ) : null}
                                    </div>
                                    {module.description ? <p className='mt-1 text-sm text-muted-foreground'>{module.description}</p> : null}
                                    <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                                        <Clock className='h-3.5 w-3.5' />
                                        {module.completed_stage_count} dari {module.total_stage_count} tahap
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    {module.stages.map((stage) => {
                                        const isSelected = selectedStageId === stage.id;

                                        return (
                                            <button
                                                key={stage.id}
                                                type='button'
                                                onClick={() => handleSelectStage(stage.id)}
                                                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                                    isSelected ? 'border-primary bg-primary/5 shadow' : 'border-border hover:border-primary/50'
                                                } ${stage.locked ? 'cursor-not-allowed opacity-70' : ''}`}
                                            >
                                                <div className='flex items-start justify-between gap-3'>
                                                    <div className='space-y-1'>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-sm font-semibold'>{stage.title}</span>
                                                            <Badge variant='outline' className='text-xs font-medium'>
                                                                {resolveStageTypeLabel(stage.type)}
                                                            </Badge>
                                                            {stage.type === 'quiz' && stage.quiz?.duration_label ? (
                                                                <Badge variant='outline' className='text-xs text-primary'>
                                                                    <Clock className='mr-1 h-3 w-3' />
                                                                    {stage.quiz.duration_label}
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        {stage.description ? (
                                                            <p className='text-xs text-muted-foreground'>{stage.description}</p>
                                                        ) : null}
                                                        <div className='flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground'>
                                                            {stage.duration_label ? (
                                                                <span className='flex items-center gap-1'>
                                                                    <Clock className='h-3 w-3' />
                                                                    {stage.duration_label}
                                                                </span>
                                                            ) : null}
                                                            {stage.type === 'quiz' && typeof stage.quiz?.question_count === 'number' ? (
                                                                <span>{stage.quiz.question_count} soal</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    {renderStageBadge(stage)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <Separator className='my-4' />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );

    const renderContentStage = (stage: StageSummary) => {
        const progressStatus = stage.progress?.status ?? 'pending';
        const isCompleted = progressStatus === 'completed';
        const content = stage.content;

        return (
            <div className='space-y-6'>
                <Card className='border-dashed'>
                    <CardHeader className='gap-2'>
                        <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                            <BookOpen className='h-4 w-4 text-primary' />
                            Materi
                        </div>
                        <CardTitle className='text-2xl font-semibold'>{stage.title}</CardTitle>
                        {stage.description ? <p className='text-sm text-muted-foreground'>{stage.description}</p> : null}
                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                            <Badge variant='outline' className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                {stage.duration_label ?? 'Durasi fleksibel'}
                            </Badge>
                            <Badge variant='outline' className='flex items-center gap-1'>
                                {formatStageStatus(progressStatus)}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {content ? (
                            <ModuleStagePreview content={content} className='w-full' />
                        ) : (
                            <div className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                                Materi belum tersedia untuk tahap ini.
                            </div>
                        )}
                        <Button onClick={handleCompleteStage} disabled={isCompleted || isCompletingStage} className='w-full justify-center gap-2'>
                            {isCompletingStage ? <Loader2 className='h-4 w-4 animate-spin' /> : <CheckCircle2 className='h-4 w-4' />}
                            {isCompleted ? 'Tahap sudah selesai' : 'Tandai materi selesai'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderQuizStage = (stage: StageSummary, quiz: QuizPayload, progress: StageProgressMeta | null | undefined) => {
        const readOnly = Boolean(progress?.read_only);
        const result = progress?.result ?? null;
        const attemptNumber = progress?.attempt ?? 1;
        const rawHistory = progress?.attempt_history;
        const attemptHistory: AttemptHistoryEntry[] = Array.isArray(rawHistory) ? rawHistory : [];
        const hasHistory = attemptHistory.length > 0;
        const sortedHistory = [...attemptHistory].sort((left, right) => right.attempt - left.attempt);
        const attemptStatusText = readOnly
            ? `Kuis selesai pada percobaan ke-${attemptNumber}. Kamu dapat mencoba lagi untuk memperbaiki hasil.`
            : `Kamu sedang menjalani percobaan ke-${attemptNumber}. Pastikan semua jawaban tepat sebelum mengirim.`;
        const renderReattemptButton = () => (
            <Button type='button' onClick={handleReattemptQuiz} disabled={isReattemptingQuiz} className='gap-2'>
                {isReattemptingQuiz ? <Loader2 className='h-4 w-4 animate-spin' /> : <RotateCcw className='h-4 w-4' />}
                Mulai percobaan baru
            </Button>
        );

        return (
            <div className='space-y-6'>
                <Card className='border-dashed'>
                    <CardHeader className='gap-2'>
                        <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                            <AlertTriangle className='h-4 w-4 text-primary' />
                            Kuis Modul
                        </div>
                        <CardTitle className='text-2xl font-semibold'>{quiz.name}</CardTitle>
                        {quiz.description ? <p className='text-sm text-muted-foreground'>{quiz.description}</p> : null}
                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                            <Badge variant='outline' className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                {quiz.duration_label ?? 'Tanpa batas waktu'}
                            </Badge>
                            <Badge variant='outline'>{quiz.questions.length} soal</Badge>
                            <Badge variant='outline'>{formatStageStatus(stage.progress?.status ?? 'pending')}</Badge>
                        </div>
                        {countdownSeconds !== null ? (
                            <div className='mt-2 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400'>
                                <Clock className='h-4 w-4' />
                                Sisa waktu: <span className='font-semibold'>{formatCountdown(countdownSeconds)}</span>
                            </div>
                        ) : null}
                        {result ? (
                            <div className='mt-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary-foreground'>
                                <div className='flex items-center gap-2 text-primary'>
                                    <CheckCircle2 className='h-4 w-4' />
                                    Nilai akhir: <span className='font-semibold'>{result.score}</span>
                                </div>
                                <p className='text-xs text-primary/80'>
                                    {result.correct} benar dari {result.total} soal.
                                    {result.auto_submitted ? ' Sistem mengirim jawaban saat waktu habis.' : ''}
                                </p>
                            </div>
                        ) : null}
                    </CardHeader>
                    <CardContent className='space-y-4 border-t border-dashed pt-4'>
                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                                <History className='h-4 w-4 text-primary' />
                                Percobaan ke-{attemptNumber}
                            </div>
                            <p className='text-xs text-muted-foreground'>{attemptStatusText}</p>
                        </div>
                        {hasHistory ? (
                            <div className='space-y-2'>
                                <div className='text-xs font-semibold tracking-wide text-muted-foreground uppercase'>Riwayat percobaan</div>
                                <div className='space-y-2'>
                                    {sortedHistory.map((entry) => {
                                        const finishedLabel = entry.finished_at ? dateTimeFormatter.format(new Date(entry.finished_at)) : null;

                                        return (
                                            <div
                                                key={`attempt-${entry.attempt}`}
                                                className='rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm'
                                            >
                                                <div className='flex flex-wrap items-center justify-between gap-2'>
                                                    <span className='font-medium'>Percobaan ke-{entry.attempt}</span>
                                                    <Badge variant='outline' className='flex items-center gap-1 text-xs'>
                                                        <CheckCircle2 className='h-3 w-3 text-primary' />
                                                        Skor {entry.score}
                                                    </Badge>
                                                </div>
                                                <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                                                    <span>
                                                        {entry.correct} benar dari {entry.total} soal
                                                    </span>
                                                    {entry.total_points > 0 ? (
                                                        <span>
                                                            {entry.earned_points}/{entry.total_points} poin
                                                        </span>
                                                    ) : null}
                                                    {finishedLabel ? <span>Selesai {finishedLabel}</span> : null}
                                                    {entry.auto_submitted ? (
                                                        <span className='flex items-center gap-1 text-amber-600 dark:text-amber-400'>
                                                            <AlertTriangle className='h-3 w-3' />
                                                            Dikirim otomatis
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                        {readOnly ? <div className='pt-2'>{renderReattemptButton()}</div> : null}
                    </CardContent>
                </Card>

                <div className='space-y-4'>
                    {quiz.questions.map((question, index) => {
                        const selectedOptions = answers[question.id] ?? [];
                        const isMultiple = question.selection_mode === 'multiple';

                        return (
                            <Card key={question.id} className='border-dashed'>
                                <CardHeader className='gap-2'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <CardTitle className='text-base font-semibold'>
                                            {index + 1}. {question.question}
                                        </CardTitle>
                                        <Badge variant='outline' className='text-xs'>
                                            {isMultiple ? 'Pilih beberapa jawaban' : 'Pilih satu jawaban'}
                                        </Badge>
                                    </div>
                                    {question.question_image_url ? (
                                        <img
                                            src={question.question_image_url}
                                            alt={`Gambar pertanyaan ${index + 1}`}
                                            className='mt-2 w-full rounded-lg border object-contain'
                                        />
                                    ) : null}
                                </CardHeader>
                                <CardContent className='space-y-2'>
                                    {question.options.map((option) => {
                                        const isSelected = selectedOptions.includes(option.id);

                                        return (
                                            <button
                                                key={option.id}
                                                type='button'
                                                disabled={readOnly}
                                                onClick={() => handleToggleOption(question.id, option.id, question.selection_mode)}
                                                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                                    isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                                                } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <div className='flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-background'>
                                                        {isMultiple ? (
                                                            isSelected ? (
                                                                <CheckSquare className='h-4 w-4 text-primary' />
                                                            ) : (
                                                                <Square className='h-4 w-4 text-muted-foreground' />
                                                            )
                                                        ) : isSelected ? (
                                                            <CircleDot className='h-4 w-4 text-primary' />
                                                        ) : (
                                                            <Circle className='h-4 w-4 text-muted-foreground' />
                                                        )}
                                                    </div>
                                                    <div className='flex-1 space-y-2'>
                                                        <p className='text-sm font-medium'>{option.text}</p>
                                                        {option.image_url ? (
                                                            <img
                                                                src={option.image_url}
                                                                alt='Gambar opsi'
                                                                className='w-full rounded-lg border object-contain'
                                                            />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    {readOnly ? (
                        renderReattemptButton()
                    ) : (
                        <>
                            <Button variant='outline' onClick={handleManualSave} disabled={isSavingAnswers || isSubmittingQuiz} className='gap-2'>
                                {isSavingAnswers ? <Loader2 className='h-4 w-4 animate-spin' /> : <Flame className='h-4 w-4' />}
                                Simpan jawaban sementara
                            </Button>
                            <Button onClick={() => handleSubmitQuiz(false)} disabled={isSubmittingQuiz} className='gap-2'>
                                {isSubmittingQuiz && lastAction !== 'autosubmit' ? (
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                    <CheckCircle2 className='h-4 w-4' />
                                )}
                                Kirim jawaban
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderStageDetail = () => {
        if (isStageLoading && !stageDetail) {
            return (
                <div className='space-y-4'>
                    <Skeleton className='h-40 w-full rounded-xl' />
                    <Skeleton className='h-24 w-full rounded-xl' />
                </div>
            );
        }

        if (!stageDetail) {
            return (
                <Card className='border-dashed'>
                    <CardHeader>
                        <CardTitle className='text-lg font-semibold'>Pilih tahap untuk mulai belajar</CardTitle>
                        <p className='text-sm text-muted-foreground'>Pilih salah satu tahap di panel kiri untuk melihat materi atau kuis.</p>
                    </CardHeader>
                </Card>
            );
        }

        const { stage, quiz, progress } = stageDetail;

        if (stage.type === 'quiz' && quiz) {
            return renderQuizStage(stage, quiz, progress);
        }

        return renderContentStage(stage);
    };

    return (
        <AppLayout>
            <Head title={`Workspace ${course.title}`} />
            <div className='mx-auto flex max-w-[1200px] flex-col gap-6 py-8'>
                <Card className='border-dashed'>
                    <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                        <div className='space-y-2'>
                            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                                <PlayCircle className='h-4 w-4 text-primary' />
                                Ruang Belajar Kursus
                            </div>
                            <CardTitle className='text-3xl font-semibold'>{course.title}</CardTitle>
                            {course.description ? <p className='text-sm text-muted-foreground'>{course.description}</p> : null}
                        </div>
                        <div className='w-full max-w-sm space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4'>
                            <div className='flex items-center justify-between text-sm font-medium text-primary'>
                                <span>Progres belajar</span>
                                <span>{enrollment.progress_label ?? `${enrollment.progress}%`}</span>
                            </div>
                            <Progress value={enrollment.progress} />
                            <Button
                                type='button'
                                className='w-full justify-center gap-2'
                                onClick={handleDownloadCertificate}
                                disabled={!certificateEnabled || !certificateReady || isDownloadingCertificate}
                            >
                                {isDownloadingCertificate ? <Loader2 className='h-4 w-4 animate-spin' /> : <Award className='h-4 w-4' />}
                                Unduh sertifikat
                            </Button>
                            <p className='text-xs text-muted-foreground'>{certificateHelperText}</p>
                        </div>
                    </CardHeader>
                </Card>

                <div className='grid gap-6 lg:grid-cols-[360px,1fr]'>
                    {renderModuleList()}
                    <div>{renderStageDetail()}</div>
                </div>
            </div>
        </AppLayout>
    );
}
