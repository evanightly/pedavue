// import CertificateController from '@/actions/App/Http/Controllers/CertificateController';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
// import EnrollmentController from '@/actions/App/Http/Controllers/EnrollmentController';
// import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
// import QuizController from '@/actions/App/Http/Controllers/QuizController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { CertificateNameOverlay } from '@/components/ui/certificate-name-overlay';
import { Combobox } from '@/components/ui/combobox';
import type { PaginationMeta } from '@/components/ui/data-table-types';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible } from '@inertiajs/core';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseEditProps {
    record: CourseRecord;
}

export default function CourseEdit({ record }: CourseEditProps) {
    const extendedRecord = record as CourseRecord &
        Partial<{
            certificate_name_box_width: number | null;
            certificate_name_box_height: number | null;
            certificate_name_font_family: string | null;
            certificate_name_font_weight: string | null;
            certificate_name_text_align: 'left' | 'center' | 'right' | null;
            certificate_name_text_color: string | null;
            certificate_name_letter_spacing: number | null;
        }>;

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

    const fetchUserOptions = useCallback(async ({ search }: { search?: string }) => {
        const params: Record<string, unknown> = {};

        if (search && search.trim().length > 0) {
            params['filter[search]'] = search.trim();
        }

        const response = await axios.get<{ data: { users: { data: App.Data.User.UserData[] } } }>(UserController.index().url, { params });

        return response;
    }, []);

    const mapInstructorSelectorResponse = useCallback((response: { data: { users: { data: App.Data.User.UserData[] } } }) => {
        return response.data.users.data;
    }, []);

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

    const [instructorIds, setInstructorIds] = useState<Array<number | string>>(() => {
        if (Array.isArray(record?.instructor_ids)) {
            return record.instructor_ids.filter((value) => typeof value === 'number' || typeof value === 'string');
        }

        if (Array.isArray(record?.course_instructors)) {
            return record.course_instructors
                .map((entry) => {
                    if (entry && typeof entry === 'object' && 'id' in entry) {
                        return (entry as { id?: number | string }).id ?? null;
                    }

                    if (typeof entry === 'number' || typeof entry === 'string') {
                        return entry;
                    }

                    return null;
                })
                .filter((value): value is number | string => value !== null && value !== undefined);
        }

        return [];
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(record?.thumbnail_url ?? null);
    const [levelValue, setLevelValue] = useState<string>(record?.level ?? '');
    const [description, setDescription] = useState<string>(record?.description ?? '');
    const [certificateEnabled, setCertificateEnabled] = useState<boolean>(Boolean(record?.certification_enabled));
    const [certificateTemplateFile, setCertificateTemplateFile] = useState<File | null>(null);
    const [certificateTemplatePreview, setCertificateTemplatePreview] = useState<string | null>(record?.certificate_template_url ?? null);
    const [certificateNamePosition, setCertificateNamePosition] = useState<{ x: number; y: number }>(() => ({
        x: typeof record?.certificate_name_position_x === 'number' ? record.certificate_name_position_x : 50,
        y: typeof record?.certificate_name_position_y === 'number' ? record.certificate_name_position_y : 50,
    }));
    const [certificateNameMaxLength, setCertificateNameMaxLength] = useState<number>(() => {
        if (typeof record?.certificate_name_max_length === 'number' && record.certificate_name_max_length > 0) {
            return record.certificate_name_max_length;
        }

        return 40;
    });
    const [certificateNameBoxSize, setCertificateNameBoxSize] = useState<{ width: number; height: number }>(() => {
        const width = typeof extendedRecord?.certificate_name_box_width === 'number' ? extendedRecord.certificate_name_box_width : null;
        const height = typeof extendedRecord?.certificate_name_box_height === 'number' ? extendedRecord.certificate_name_box_height : null;

        return {
            width: width && width > 0 ? Math.min(100, Math.max(10, width)) : 40,
            height: height && height > 0 ? Math.min(100, Math.max(10, height)) : 16,
        };
    });
    const allowedFontFamilies = ['sans-serif', 'serif'] as const;
    const [certificateNameFontFamily, setCertificateNameFontFamily] = useState<string>(() => {
        const candidate = extendedRecord?.certificate_name_font_family;
        if (candidate && allowedFontFamilies.includes(candidate as (typeof allowedFontFamilies)[number])) {
            return candidate;
        }

        return 'sans-serif';
    });
    const [certificateNameFontWeight, setCertificateNameFontWeight] = useState<string>(() => {
        const candidate = extendedRecord?.certificate_name_font_weight;
        if (candidate && ['400', '500', '600', '700', '800'].includes(candidate)) {
            return candidate;
        }

        return '600';
    });
    const [certificateNameTextAlign, setCertificateNameTextAlign] = useState<'left' | 'center' | 'right'>(() => {
        const candidate = extendedRecord?.certificate_name_text_align;
        if (candidate === 'left' || candidate === 'center' || candidate === 'right') {
            return candidate;
        }

        return 'center';
    });
    const [certificateNameTextColor, setCertificateNameTextColor] = useState<string>(() => extendedRecord?.certificate_name_text_color ?? '#1F2937');
    const [certificateNameLetterSpacing, setCertificateNameLetterSpacing] = useState<number>(() => {
        if (typeof extendedRecord?.certificate_name_letter_spacing === 'number') {
            return Math.max(-10, Math.min(20, extendedRecord.certificate_name_letter_spacing));
        }

        return 0;
    });
    const [certificateSampleName, setCertificateSampleName] = useState<string>('Nama Lengkap Peserta');

    const clampPositionForSize = (value: { x: number; y: number }, dimensions: { width: number; height: number }) => {
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;

        return {
            x: Math.min(100 - halfWidth, Math.max(halfWidth, value.x)),
            y: Math.min(100 - halfHeight, Math.max(halfHeight, value.y)),
        };
    };

    const levelOptions = [
        { value: 'Pemula', label: 'Pemula' },
        { value: 'Menengah', label: 'Menengah' },
        { value: 'Lanjutan', label: 'Lanjutan' },
        { value: 'Semua Tingkat', label: 'Semua Tingkat' },
    ];

    const fontFamilyOptions = [
        { value: 'sans-serif', label: 'Sans Serif' },
        { value: 'serif', label: 'Serif' },
    ];

    const fontWeightOptions = [
        { value: '400', label: 'Reguler (400)' },
        { value: '500', label: 'Medium (500)' },
        { value: '600', label: 'Semi Bold (600)' },
        { value: '700', label: 'Bold (700)' },
        { value: '800', label: 'Extra Bold (800)' },
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

    const truncatedSampleName = useMemo(() => {
        const fallback = certificateSampleName.trim().length > 0 ? certificateSampleName : 'Nama Lengkap Peserta';

        if (!certificateNameMaxLength || certificateNameMaxLength <= 0) {
            return fallback;
        }

        return fallback.slice(0, certificateNameMaxLength);
    }, [certificateNameMaxLength, certificateSampleName]);

    useEffect(() => {
        setCertificateSampleName((current) => {
            const base = current.trim().length > 0 ? current : 'Nama Lengkap Peserta';

            if (!certificateNameMaxLength || certificateNameMaxLength <= 0) {
                return base;
            }

            const adjusted = base.slice(0, certificateNameMaxLength);

            return adjusted === current ? current : adjusted;
        });
    }, [certificateNameMaxLength]);

    const handleCertificateTemplateDrop = (file: File) => {
        setCertificateTemplateFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCertificateTemplatePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setCertificateEnabled(true);
    };

    const removeCertificateTemplate = () => {
        setCertificateTemplateFile(null);
        setCertificateTemplatePreview(null);
    };

    const handleCertificateHorizontalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        setCertificateNamePosition((current) => ({
            x: Math.min(100, Math.max(0, Math.round(coordinate))),
            y: current.y,
        }));
    };

    const handleCertificateVerticalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        setCertificateNamePosition((current) => ({
            x: current.x,
            y: Math.min(100, Math.max(0, Math.round(coordinate))),
        }));
    };

    const handleCertificateNameLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
        const parsed = Number.parseInt(event.target.value, 10);

        if (Number.isNaN(parsed)) {
            setCertificateNameMaxLength(0);
            return;
        }

        setCertificateNameMaxLength(Math.min(120, Math.max(0, parsed)));
    };

    const handleCertificateBoxWidthChange = (value: number[]) => {
        const [width] = value;

        if (typeof width !== 'number') {
            return;
        }

        const sanitizedWidth = Math.min(100, Math.max(10, Math.round(width)));

        setCertificateNameBoxSize((current) => {
            const next = { ...current, width: sanitizedWidth };
            setCertificateNamePosition((currentPosition) => clampPositionForSize(currentPosition, next));
            return next;
        });
    };

    const handleCertificateBoxHeightChange = (value: number[]) => {
        const [height] = value;

        if (typeof height !== 'number') {
            return;
        }

        const sanitizedHeight = Math.min(100, Math.max(10, Math.round(height)));

        setCertificateNameBoxSize((current) => {
            const next = { ...current, height: sanitizedHeight };
            setCertificateNamePosition((currentPosition) => clampPositionForSize(currentPosition, next));
            return next;
        });
    };

    const handleCertificateSampleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value ?? '';

        if (!certificateNameMaxLength || certificateNameMaxLength <= 0) {
            setCertificateSampleName(value);
            return;
        }

        setCertificateSampleName(value.slice(0, certificateNameMaxLength));
    };

    const handleCertificateTextColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCertificateNameTextColor((event.target.value ?? '#1F2937').toUpperCase());
    };

    const handleCertificateLetterSpacingChange = (value: number[]) => {
        const [spacing] = value;

        if (typeof spacing !== 'number') {
            return;
        }

        setCertificateNameLetterSpacing(Math.max(-10, Math.min(20, Math.round(spacing))));
    };

    const handleCertificateCentering = () => {
        setCertificateNamePosition(() => clampPositionForSize({ x: 50, y: 50 }, certificateNameBoxSize));
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
                transform={(data) => {
                    const transformed: Record<string, FormDataConvertible> = {
                        ...data,
                        _method: 'put',
                        instructor_ids: instructorIds
                            .map((value) => {
                                if (typeof value === 'number') {
                                    return value;
                                }

                                const numeric = Number.parseInt(String(value), 10);
                                return Number.isNaN(numeric) ? null : numeric;
                            })
                            .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0),
                        certification_enabled: certificateEnabled,
                        certificate_name_position_x: certificateEnabled ? Math.round(certificateNamePosition.x) : null,
                        certificate_name_position_y: certificateEnabled ? Math.round(certificateNamePosition.y) : null,
                        certificate_name_max_length: certificateEnabled && certificateNameMaxLength > 0 ? Math.round(certificateNameMaxLength) : null,
                        certificate_name_box_width: certificateEnabled ? Math.round(certificateNameBoxSize.width) : null,
                        certificate_name_box_height: certificateEnabled ? Math.round(certificateNameBoxSize.height) : null,
                        certificate_name_font_family: certificateEnabled ? certificateNameFontFamily : null,
                        certificate_name_font_weight: certificateEnabled ? certificateNameFontWeight : null,
                        certificate_name_text_align: certificateEnabled ? certificateNameTextAlign : null,
                        certificate_name_text_color: certificateEnabled ? certificateNameTextColor.toUpperCase() : null,
                        certificate_name_letter_spacing: certificateEnabled ? Math.round(certificateNameLetterSpacing) : null,
                    };

                    // Only include thumbnail if a new file was selected
                    if (thumbnailFile) {
                        transformed.thumbnail = thumbnailFile;
                    }

                    if (certificateEnabled && certificateTemplateFile) {
                        transformed.certificate_template = certificateTemplateFile;
                    } else {
                        delete transformed.certificate_template;
                    }

                    return transformed;
                }}
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
                                            dataMapper={mapInstructorSelectorResponse}
                                            multiSelect
                                            selectedDataIds={instructorIds}
                                            setSelectedDataIds={setInstructorIds}
                                            renderItem={(item) =>
                                                String((item as any).name ?? (item as any).title ?? (item as any).email ?? (item as any).id)
                                            }
                                        />
                                        <InputError message={errors.instructor_ids} />
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

                            {/* Certificate Section */}
                            <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Sertifikat</h3>
                                <div className='flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between'>
                                    <div>
                                        <p className='text-sm font-medium text-foreground'>Aktifkan Sertifikat</p>
                                        <p className='text-xs text-muted-foreground'>Perlihatkan nama peserta pada template yang Anda unggah.</p>
                                    </div>
                                    <Switch checked={certificateEnabled} onCheckedChange={(value) => setCertificateEnabled(Boolean(value))} />
                                </div>
                                <div className='grid gap-6 rounded-lg border p-4'>
                                    <div className='grid gap-2'>
                                        <Label htmlFor='certificate_template'>Template Sertifikat</Label>
                                        <ImageDropzone
                                            onDrop={handleCertificateTemplateDrop}
                                            preview={certificateTemplatePreview}
                                            onRemove={removeCertificateTemplate}
                                            disabled={!certificateEnabled}
                                            previewOverlay={
                                                certificateEnabled && certificateTemplatePreview ? (
                                                    <CertificateNameOverlay
                                                        editable={certificateEnabled}
                                                        position={certificateNamePosition}
                                                        size={certificateNameBoxSize}
                                                        onPositionChange={(value) =>
                                                            setCertificateNamePosition({
                                                                x: Math.round(value.x * 100) / 100,
                                                                y: Math.round(value.y * 100) / 100,
                                                            })
                                                        }
                                                        onSizeChange={(value) =>
                                                            setCertificateNameBoxSize({
                                                                width: Math.round(value.width * 100) / 100,
                                                                height: Math.round(value.height * 100) / 100,
                                                            })
                                                        }
                                                        sampleText={truncatedSampleName}
                                                        fontFamily={certificateNameFontFamily}
                                                        fontWeight={certificateNameFontWeight}
                                                        textAlign={certificateNameTextAlign}
                                                        textColor={certificateNameTextColor}
                                                        letterSpacing={certificateNameLetterSpacing}
                                                        guidance='Seret kotak untuk memindahkan, tarik sudut untuk mengubah ukuran.'
                                                    />
                                                ) : null
                                            }
                                            previewOverlayClassName='absolute inset-0'
                                        />
                                        <p className='text-xs text-muted-foreground'>
                                            PNG atau JPG hingga 4MB. Sertakan ruang kosong untuk nama peserta.
                                        </p>
                                        <InputError message={errors.certificate_template} />
                                    </div>

                                    <div className='grid gap-6 md:grid-cols-2'>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_position_x'>Posisi Horizontal Nama</Label>
                                            <Slider
                                                id='certificate_name_position_x'
                                                value={[certificateNamePosition.x]}
                                                onValueChange={handleCertificateHorizontalChange}
                                                max={100}
                                                step={1}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>Terletak {certificateNamePosition.x}% dari sisi kiri.</p>
                                            <InputError message={errors.certificate_name_position_x} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_position_y'>Posisi Vertikal Nama</Label>
                                            <Slider
                                                id='certificate_name_position_y'
                                                value={[certificateNamePosition.y]}
                                                onValueChange={handleCertificateVerticalChange}
                                                max={100}
                                                step={1}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>Terletak {certificateNamePosition.y}% dari sisi atas.</p>
                                            <InputError message={errors.certificate_name_position_y} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_box_width'>Lebar Kotak Nama</Label>
                                            <Slider
                                                id='certificate_name_box_width'
                                                value={[certificateNameBoxSize.width]}
                                                onValueChange={handleCertificateBoxWidthChange}
                                                min={10}
                                                max={100}
                                                step={1}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>
                                                Lebar {certificateNameBoxSize.width}% dari lebar sertifikat.
                                            </p>
                                            <InputError message={errors.certificate_name_box_width} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_box_height'>Tinggi Kotak Nama</Label>
                                            <Slider
                                                id='certificate_name_box_height'
                                                value={[certificateNameBoxSize.height]}
                                                onValueChange={handleCertificateBoxHeightChange}
                                                min={10}
                                                max={100}
                                                step={1}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>
                                                Tinggi {certificateNameBoxSize.height}% dari tinggi sertifikat.
                                            </p>
                                            <InputError message={errors.certificate_name_box_height} />
                                        </div>
                                    </div>

                                    <div className='grid gap-6 md:grid-cols-2'>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_sample'>Teks Contoh Nama</Label>
                                            <Input
                                                id='certificate_name_sample'
                                                type='text'
                                                value={certificateSampleName}
                                                onChange={handleCertificateSampleChange}
                                                disabled={!certificateEnabled}
                                                maxLength={certificateNameMaxLength || undefined}
                                                placeholder='Masukkan contoh nama peserta'
                                            />
                                            <p className='text-xs text-muted-foreground'>Ubah teks contoh untuk melihat perkiraan hasil cetak.</p>
                                        </div>
                                        <div className='grid gap-2 md:max-w-xs'>
                                            <Label htmlFor='certificate_name_max_length'>Batas Karakter Nama</Label>
                                            <Input
                                                id='certificate_name_max_length'
                                                name='certificate_name_max_length'
                                                type='number'
                                                min='10'
                                                max='120'
                                                step='1'
                                                value={certificateNameMaxLength}
                                                onChange={handleCertificateNameLimitChange}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>Nama contoh: {truncatedSampleName}</p>
                                            <InputError message={errors.certificate_name_max_length} />
                                        </div>
                                    </div>

                                    <div className='flex flex-wrap items-center gap-3'>
                                        <Button
                                            type='button'
                                            variant='secondary'
                                            size='sm'
                                            onClick={handleCertificateCentering}
                                            disabled={!certificateEnabled}
                                        >
                                            Pusatkan Kotak Nama
                                        </Button>
                                    </div>

                                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                                        <div className='grid gap-2'>
                                            <Label>Perataan Teks</Label>
                                            <ToggleGroup
                                                type='single'
                                                value={certificateNameTextAlign}
                                                onValueChange={(value) => {
                                                    if (value === 'left' || value === 'center' || value === 'right') {
                                                        setCertificateNameTextAlign(value);
                                                    }
                                                }}
                                                disabled={!certificateEnabled}
                                                className='justify-start'
                                            >
                                                <ToggleGroupItem value='left'>Kiri</ToggleGroupItem>
                                                <ToggleGroupItem value='center'>Tengah</ToggleGroupItem>
                                                <ToggleGroupItem value='right'>Kanan</ToggleGroupItem>
                                            </ToggleGroup>
                                            <InputError message={errors.certificate_name_text_align} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_font_family'>Jenis Huruf</Label>
                                            <Select
                                                value={certificateNameFontFamily}
                                                onValueChange={setCertificateNameFontFamily}
                                                disabled={!certificateEnabled}
                                            >
                                                <SelectTrigger id='certificate_name_font_family'>
                                                    <SelectValue placeholder='Pilih font' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fontFamilyOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.certificate_name_font_family} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_font_weight'>Ketebalan Tulisan</Label>
                                            <Select
                                                value={certificateNameFontWeight}
                                                onValueChange={setCertificateNameFontWeight}
                                                disabled={!certificateEnabled}
                                            >
                                                <SelectTrigger id='certificate_name_font_weight'>
                                                    <SelectValue placeholder='Pilih ketebalan' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {fontWeightOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.certificate_name_font_weight} />
                                        </div>
                                    </div>

                                    <div className='grid gap-6 md:grid-cols-2'>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_text_color'>Warna Teks</Label>
                                            <div className='flex items-center gap-3'>
                                                <input
                                                    id='certificate_name_text_color'
                                                    type='color'
                                                    value={certificateNameTextColor}
                                                    onChange={handleCertificateTextColorChange}
                                                    disabled={!certificateEnabled}
                                                    className='h-10 w-16 rounded border border-border bg-transparent p-1'
                                                />
                                                <Input
                                                    type='text'
                                                    value={certificateNameTextColor}
                                                    onChange={(event) => setCertificateNameTextColor(event.target.value.toUpperCase())}
                                                    disabled={!certificateEnabled}
                                                    maxLength={7}
                                                    className='max-w-[8rem] uppercase'
                                                />
                                            </div>
                                            <InputError message={errors.certificate_name_text_color} />
                                        </div>
                                        <div className='grid gap-2'>
                                            <Label htmlFor='certificate_name_letter_spacing'>Jarak Antar Huruf</Label>
                                            <Slider
                                                id='certificate_name_letter_spacing'
                                                value={[certificateNameLetterSpacing]}
                                                onValueChange={handleCertificateLetterSpacingChange}
                                                min={-10}
                                                max={20}
                                                step={1}
                                                disabled={!certificateEnabled}
                                            />
                                            <p className='text-xs text-muted-foreground'>
                                                {certificateNameLetterSpacing > 0
                                                    ? `Menambah ${certificateNameLetterSpacing}px spasi.`
                                                    : certificateNameLetterSpacing < 0
                                                      ? `Mengurangi ${Math.abs(certificateNameLetterSpacing)}px spasi.`
                                                      : 'Menggunakan spasi huruf standar.'}
                                            </p>
                                            <InputError message={errors.certificate_name_letter_spacing} />
                                        </div>
                                    </div>
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
