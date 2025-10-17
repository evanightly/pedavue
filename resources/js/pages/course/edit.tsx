// import CertificateController from '@/actions/App/Http/Controllers/CertificateController';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
// import EnrollmentController from '@/actions/App/Http/Controllers/EnrollmentController';
// import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
// import QuizController from '@/actions/App/Http/Controllers/QuizController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseEditProps {
    record: CourseRecord;
}

export default function CourseEdit({ record }: CourseEditProps) {
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

    // const mapInstructorSelectorResponse = (response: unknown): Array<App.Data.User.UserData> => {
    //     return response.data.users.data as PaginationMeta<{ data: { users: { data: App.Data.User.UserData[] } } }>;
    // };

    // const mapModulesSelectorResponse = (response: PaginateResponse<App.Data.Module.ModuleData>): Array<App.Data.Module.ModuleData> => {
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

        const response = await axios.get<{ data: { users: { data: App.Data.User.UserData[] } } }>(UserController.index().url, { params });

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

    const [instructorId, setInstructorId] = useState<number | string | null>(() => {
        const direct = record?.instructor_id;

        if (typeof direct === 'number' || typeof direct === 'string') {
            return direct;
        }

        const related = record?.instructor;

        if (related && typeof related === 'object' && 'id' in related) {
            return (related as { id?: number | string }).id ?? null;
        }

        return null;
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(record?.thumbnail_url ?? null);
    const [levelValue, setLevelValue] = useState<string>(record?.level ?? '');
    const [description, setDescription] = useState<string>(record?.description ?? '');

    const levelOptions = [
        { value: 'Pemula', label: 'Pemula' },
        { value: 'Menengah', label: 'Menengah' },
        { value: 'Lanjutan', label: 'Lanjutan' },
        { value: 'Semua Tingkat', label: 'Semua Tingkat' },
    ];

    const handleThumbnailDrop = (file: File) => {
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    // const [modulesIds, setModulesIds] = useState<Array<number | string>>(() => {
    //     const relationEntries = record?.Modules;

    //     if (Array.isArray(relationEntries)) {
    //         return relationEntries
    //             .map((entry) => {
    //                 if (typeof entry === 'number' || typeof entry === 'string') {
    //                     return entry;
    //                 }

    //                 if (entry && typeof entry === 'object' && 'id' in entry) {
    //                     return (entry as { id?: number | string }).id ?? null;
    //                 }

    //                 return null;
    //             })
    //             .filter((value): value is number | string => value !== null && value !== undefined);
    //     }

    //     const fallback = record?.module_ids;
    //     if (Array.isArray(fallback)) {
    //         return fallback.filter((value): value is number | string => typeof value === 'number' || typeof value === 'string');
    //     }

    //     return [];
    // });
    // const [quizzesIds, setQuizzesIds] = useState<Array<number | string>>(() => {
    //     const relationEntries = record?.Quizzes;

    //     if (Array.isArray(relationEntries)) {
    //         return relationEntries
    //             .map((entry) => {
    //                 if (typeof entry === 'number' || typeof entry === 'string') {
    //                     return entry;
    //                 }

    //                 if (entry && typeof entry === 'object' && 'id' in entry) {
    //                     return (entry as { id?: number | string }).id ?? null;
    //                 }

    //                 return null;
    //             })
    //             .filter((value): value is number | string => value !== null && value !== undefined);
    //     }

    //     const fallback = record?.quiz_ids;
    //     if (Array.isArray(fallback)) {
    //         return fallback.filter((value): value is number | string => typeof value === 'number' || typeof value === 'string');
    //     }

    //     return [];
    // });
    // const [enrollmentsIds, setEnrollmentsIds] = useState<Array<number | string>>(() => {
    //     const relationEntries = record?.Enrollments;

    //     if (Array.isArray(relationEntries)) {
    //         return relationEntries
    //             .map((entry) => {
    //                 if (typeof entry === 'number' || typeof entry === 'string') {
    //                     return entry;
    //                 }

    //                 if (entry && typeof entry === 'object' && 'id' in entry) {
    //                     return (entry as { id?: number | string }).id ?? null;
    //                 }

    //                 return null;
    //             })
    //             .filter((value): value is number | string => value !== null && value !== undefined);
    //     }

    //     const fallback = record?.enrollment_ids;
    //     if (Array.isArray(fallback)) {
    //         return fallback.filter((value): value is number | string => typeof value === 'number' || typeof value === 'string');
    //     }

    //     return [];
    // });
    // const [certificatesIds, setCertificatesIds] = useState<Array<number | string>>(() => {
    //     const relationEntries = record?.Certificates;

    //     if (Array.isArray(relationEntries)) {
    //         return relationEntries
    //             .map((entry) => {
    //                 if (typeof entry === 'number' || typeof entry === 'string') {
    //                     return entry;
    //                 }

    //                 if (entry && typeof entry === 'object' && 'id' in entry) {
    //                     return (entry as { id?: number | string }).id ?? null;
    //                 }

    //                 return null;
    //             })
    //             .filter((value): value is number | string => value !== null && value !== undefined);
    //     }

    //     const fallback = record?.certificate_ids;
    //     if (Array.isArray(fallback)) {
    //         return fallback.filter((value): value is number | string => typeof value === 'number' || typeof value === 'string');
    //     }

    //     return [];
    // });

    return (
        <AppLayout>
            <Head title='Edit Course' />
            <Form
                {...CourseController.update.form(record.slug)}
                transform={(data) => ({
                    ...data,
                    _method: 'put',
                    thumbnail: thumbnailFile || data.thumbnail,
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
                })}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Edit Kursus</h1>
                            <p className='text-sm text-muted-foreground'>Perbarui informasi kursus di bawah ini dan simpan perubahan Anda.</p>
                        </div>
                        <div className='grid gap-6'>
                            {/* Basic Information Section */}
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Informasi Dasar</h3>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='grid gap-2 md:col-span-2'>
                                        <Label htmlFor='title'>
                                            Judul <span className='text-destructive'>*</span>
                                        </Label>
                                        <Input
                                            id='title'
                                            name='title'
                                            type='text'
                                            placeholder='Masukkan judul kursus'
                                            required
                                            defaultValue={normalizeFieldValue(record.title)}
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className='grid gap-2'>
                                        <Label htmlFor='level'>
                                            Level <span className='text-xs text-muted-foreground'>(Opsional)</span>
                                        </Label>
                                        <Combobox
                                            id='level'
                                            name='level'
                                            options={levelOptions}
                                            value={levelValue}
                                            onValueChange={setLevelValue}
                                            placeholder='Pilih atau ketik level kursus'
                                            emptyText='Level tidak ditemukan'
                                            allowCustom
                                        />
                                        <InputError message={errors.level} />
                                    </div>

                                    <div className='grid gap-2'>
                                        <Label htmlFor='duration'>
                                            Durasi <span className='text-xs text-muted-foreground'>(dalam menit)</span>
                                        </Label>
                                        <Input
                                            id='duration'
                                            name='duration'
                                            type='number'
                                            min='0'
                                            step='1'
                                            placeholder='Contoh: 120'
                                            defaultValue={normalizeFieldValue(record.duration)}
                                        />
                                        <InputError message={errors.duration} />
                                    </div>

                                    <div className='grid gap-2 md:col-span-2'>
                                        <Label htmlFor='instructor_id'>
                                            Instruktur <span className='text-destructive'>*</span>
                                        </Label>
                                        <GenericDataSelector<App.Data.User.UserData>
                                            id='instructor-selector'
                                            placeholder='Pilih instruktur'
                                            fetchData={fetchUserOptions}
                                            dataMapper={(response) => response.data.users.data}
                                            selectedDataId={instructorId}
                                            setSelectedData={(value) => setInstructorId(value)}
                                            renderItem={(item) =>
                                                String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                            }
                                        />
                                        <InputError message={errors.instructor_id} />
                                    </div>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Deskripsi</h3>
                                <div className='grid gap-2'>
                                    <Label htmlFor='description'>
                                        Deskripsi Kursus <span className='text-destructive'>*</span>
                                    </Label>
                                    <input type='hidden' name='description' value={description} />
                                    <RichTextEditor
                                        content={description}
                                        onChange={setDescription}
                                        placeholder='Jelaskan tentang kursus ini, apa yang akan dipelajari, dan manfaatnya...'
                                        mode='block'
                                        minHeight='200px'
                                    />
                                    <InputError message={errors.description} />
                                </div>
                            </div>

                            {/* Media Section */}
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Media</h3>
                                <div className='grid gap-2'>
                                    <Label htmlFor='thumbnail'>
                                        Thumbnail <span className='text-xs text-muted-foreground'>(Opsional)</span>
                                    </Label>
                                    <ImageDropzone onDrop={handleThumbnailDrop} preview={thumbnailPreview} onRemove={removeThumbnail} />
                                    <InputError message={errors.thumbnail} />
                                </div>
                            </div>

                            {/* Settings Section */}
                            {/* <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Pengaturan</h3>
                                <div className='flex items-center gap-3 rounded-lg border p-4'>
                                    <Checkbox
                                        id='certification_enabled'
                                        name='certification_enabled'
                                        defaultChecked={Boolean(record.certification_enabled)}
                                    />
                                    <div className='grid gap-1'>
                                        <Label htmlFor='certification_enabled' className='cursor-pointer text-sm leading-none font-medium'>
                                            Aktifkan Sertifikat
                                        </Label>
                                        <p className='text-xs text-muted-foreground'>Peserta yang menyelesaikan kursus akan menerima sertifikat</p>
                                    </div>
                                </div>
                                <InputError message={errors.certification_enabled} />
                            </div> */}

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
                            {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
