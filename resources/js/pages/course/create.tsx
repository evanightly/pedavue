// import CertificateController from '@/actions/App/Http/Controllers/CertificateController';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
// import EnrollmentController from '@/actions/App/Http/Controllers/EnrollmentController';
// import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
// import QuizController from '@/actions/App/Http/Controllers/QuizController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseCreateProps {}

export default function CourseCreate() {
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

    const mapInstructorSelectorResponse = (response: any): App.Data.User.UserData[] => {
        return response.data.users.data;
    };

    // const mapModulesSelectorResponse = (response: unknown): App.Data.Module.ModuleData[] => {
    //     return response.data.modules.data;
    // };

    // const mapQuizzesSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
    //     return response.data.quizzes.data;
    // };

    // const mapEnrollmentsSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
    //     return response.data.enrollments.data;
    // };

    // const mapCertificatesSelectorResponse = (response: unknown): Array<Record<string, unknown>> => {
    //     return response.data.certificates.data;
    // };

    const fetchUserOptions = async ({ search }: { search?: string }) => {
        const params: Record<string, unknown> = {};

        if (search && search.trim().length > 0) {
            params['filter[search]'] = search.trim();
        }

        const response = await axios.get(UserController.index().url, { params });

        return response;
    };

    // const fetchModuleOptions = async ({ search }: { search?: string }) => {
    //     const params: Record<string, unknown> = {};

    //     if (search && search.trim().length > 0) {
    //         params['filter[search]'] = search.trim();
    //     }

    //     const response = await axios.get(ModuleController.index().url, { params });

    //     return response;
    // };

    // const fetchQuizOptions = async ({ search }: { search?: string }) => {
    //     const params: Record<string, unknown> = {};

    //     if (search && search.trim().length > 0) {
    //         params['filter[search]'] = search.trim();
    //     }

    //     const response = await axios.get(QuizController.index().url, { params });

    //     return response;
    // };

    // const fetchEnrollmentOptions = async ({ search }: { search?: string }) => {
    //     const params: Record<string, unknown> = {};

    //     if (search && search.trim().length > 0) {
    //         params['filter[search]'] = search.trim();
    //     }

    //     const response = await axios.get(EnrollmentController.index().url, { params });

    //     return response;
    // };

    // const fetchCertificateOptions = async ({ search }: { search?: string }) => {
    //     const params: Record<string, unknown> = {};

    //     if (search && search.trim().length > 0) {
    //         params['filter[search]'] = search.trim();
    //     }

    //     const response = await axios.get(CertificateController.index().url, { params });

    //     return response;
    // };

    const [instructorId, setInstructorId] = useState<number | string | null>(null);
    const [modulesIds, setModulesIds] = useState<Array<number | string>>([]);
    const [quizzesIds, setQuizzesIds] = useState<Array<number | string>>([]);
    const [enrollmentsIds, setEnrollmentsIds] = useState<Array<number | string>>([]);
    const [certificatesIds, setCertificatesIds] = useState<Array<number | string>>([]);

    return (
        <AppLayout>
            <Head title='Create Course' />
            <Form
                {...CourseController.store.form()}
                transform={(data) => ({
                    ...data,
                    instructor_id: (() => {
                        if (instructorId === null) {
                            return null;
                        }

                        if (typeof instructorId === 'number') {
                            return instructorId;
                        }

                        const numeric = Number.parseInt(String(instructorId), 10);
                        return Number.isNaN(numeric) ? null : numeric;
                    })(),
                    module_ids: modulesIds
                        .map((value) => {
                            if (typeof value === 'number') {
                                return value;
                            }

                            const numeric = Number.parseInt(String(value), 10);
                            return Number.isNaN(numeric) ? null : numeric;
                        })
                        .filter((value): value is number => value !== null),
                    quiz_ids: quizzesIds
                        .map((value) => {
                            if (typeof value === 'number') {
                                return value;
                            }

                            const numeric = Number.parseInt(String(value), 10);
                            return Number.isNaN(numeric) ? null : numeric;
                        })
                        .filter((value): value is number => value !== null),
                    enrollment_ids: enrollmentsIds
                        .map((value) => {
                            if (typeof value === 'number') {
                                return value;
                            }

                            const numeric = Number.parseInt(String(value), 10);
                            return Number.isNaN(numeric) ? null : numeric;
                        })
                        .filter((value): value is number => value !== null),
                    certificate_ids: certificatesIds
                        .map((value) => {
                            if (typeof value === 'number') {
                                return value;
                            }

                            const numeric = Number.parseInt(String(value), 10);
                            return Number.isNaN(numeric) ? null : numeric;
                        })
                        .filter((value): value is number => value !== null),
                })}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Create Course</h1>
                            <p className='text-sm text-muted-foreground'>Provide the necessary information below and submit when you're ready.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='title'>Title</Label>
                                <Input id='title' name='title' type='text' required />
                                <InputError message={errors.title} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='slug'>Slug</Label>
                                <Textarea id='slug' name='slug' rows={4} required />
                                <InputError message={errors.slug} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='description'>Description</Label>
                                <Textarea id='description' name='description' rows={4} required />
                                <InputError message={errors.description} />
                            </div>

                            {/* <div className='space-y-2'>
                                <div className='flex items-center gap-3'>
                                    <Checkbox id='certification_enabled' name='certification_enabled' />
                                    <Label htmlFor='certification_enabled' className='text-sm font-medium text-foreground'>
                                        Certification Enabled
                                    </Label>
                                </div>
                                <InputError message={errors.certification_enabled} />
                            </div> */}

                            <div className='grid gap-2'>
                                <Label htmlFor='thumbnail'>Thumbnail</Label>
                                <Input id='thumbnail' name='thumbnail' type='text' />
                                <InputError message={errors.thumbnail} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='level'>Level</Label>
                                <Input id='level' name='level' type='text' />
                                <InputError message={errors.level} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='duration'>Duration</Label>
                                <Input id='duration' name='duration' type='text' />
                                <InputError message={errors.duration} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='instructor_id'>Instructor</Label>
                                <GenericDataSelector<App.Data.User.UserData>
                                    id='instructor-selector'
                                    placeholder={`Select Instructor`}
                                    fetchData={fetchUserOptions}
                                    dataMapper={mapInstructorSelectorResponse}
                                    selectedDataId={instructorId}
                                    setSelectedData={(value) => setInstructorId(value)}
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.instructor_id} />
                            </div>

                            {/* <div className='grid gap-2'>
                                <Label htmlFor='module_ids'>Modules</Label>
                                <GenericDataSelector<App.Data.Module.ModuleData>
                                    id='modules-selector'
                                    placeholder={`Select Modules`}
                                    fetchData={fetchModuleOptions}
                                    dataMapper={mapModulesSelectorResponse}
                                    multiSelect
                                    selectedDataIds={modulesIds}
                                    setSelectedDataIds={(values) => setModulesIds(values)}
                                    nullable
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.module_ids} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='quiz_ids'>Quizzes</Label>
                                <GenericDataSelector<App.Data.Quiz.QuizData>
                                    id='quizzes-selector'
                                    placeholder={`Select Quizzes`}
                                    fetchData={fetchQuizOptions}
                                    dataMapper={mapQuizzesSelectorResponse}
                                    multiSelect
                                    selectedDataIds={quizzesIds}
                                    setSelectedDataIds={(values) => setQuizzesIds(values)}
                                    nullable
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.quiz_ids} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='enrollment_ids'>Enrollments</Label>
                                <GenericDataSelector<App.Data.Enrollment.EnrollmentData>
                                    id='enrollments-selector'
                                    placeholder={`Select Enrollments`}
                                    fetchData={fetchEnrollmentOptions}
                                    dataMapper={mapEnrollmentsSelectorResponse}
                                    multiSelect
                                    selectedDataIds={enrollmentsIds}
                                    setSelectedDataIds={(values) => setEnrollmentsIds(values)}
                                    nullable
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.enrollment_ids} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='certificate_ids'>Certificates</Label>
                                <GenericDataSelector<App.Data.Certificate.CertificateData>
                                    id='certificates-selector'
                                    placeholder={`Select Certificates`}
                                    fetchData={fetchCertificateOptions}
                                    dataMapper={mapCertificatesSelectorResponse}
                                    multiSelect
                                    selectedDataIds={certificatesIds}
                                    setSelectedDataIds={(values) => setCertificatesIds(values)}
                                    nullable
                                    renderItem={(item) =>
                                        String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                    }
                                />
                                <InputError message={errors.certificate_ids} />
                            </div> */}
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
