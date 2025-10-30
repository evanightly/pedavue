// import CertificateController from '@/actions/App/Http/Controllers/CertificateController';
import CourseController from '@/actions/App/Http/Controllers/CourseController';
// import EnrollmentController from '@/actions/App/Http/Controllers/EnrollmentController';
// import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
// import QuizController from '@/actions/App/Http/Controllers/QuizController';
import UserController from '@/actions/App/Http/Controllers/UserController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { CertificateTemplateOverlay } from '@/components/ui/certificate-template-overlay';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
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
import { ImagePlus, LoaderCircle, QrCode, Trash2 } from 'lucide-react';
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

export type CourseRecord = App.Data.Course.CourseData;

export type CourseCollection = PaginationMeta & {
    data: App.Data.Course.CourseData[];
};

interface CourseCreateProps {}

type CertificateImageOverlayState = {
    clientId: string;
    id?: number;
    label: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    file: File | null;
    fileUrl: string | null;
    status: 'create' | 'keep' | 'update' | 'delete';
};

const DEFAULT_OVERLAY_SIZE = { width: 18, height: 18 } as const;
const QR_OVERLAY_ID = '__qr__';
const DEFAULT_QR_POSITION = { x: 84, y: 78 } as const;
const DEFAULT_QR_SIZE = { width: 18, height: 18 } as const;

const generateOverlayClientId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const assignOverlayZIndexes = (overlays: CertificateImageOverlayState[]): CertificateImageOverlayState[] =>
    overlays.map((overlay, index) => {
        const targetZIndex = index + 1;

        if (overlay.zIndex === targetZIndex) {
            return overlay;
        }

        if (overlay.status === 'delete') {
            return overlay;
        }

        return {
            ...overlay,
            zIndex: targetZIndex,
            status: overlay.id ? ('update' as const) : overlay.status,
        };
    });

const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) ?? '');
        reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca berkas.'));
        reader.readAsDataURL(file);
    });

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

    const mapInstructorSelectorResponse = useCallback((response: any): App.Data.User.UserData[] => {
        return response.data.users.data;
    }, []);

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

    const fetchUserOptions = useCallback(async ({ search }: { search?: string }) => {
        const params: Record<string, unknown> = {};

        if (search && search.trim().length > 0) {
            params['filter[search]'] = search.trim();
        }

        const response = await axios.get(UserController.index().url, { params });

        return response;
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

    const [instructorIds, setInstructorIds] = useState<Array<number | string>>([]);
    const [modulesIds, setModulesIds] = useState<Array<number | string>>([]);
    const [quizzesIds, setQuizzesIds] = useState<Array<number | string>>([]);
    const [enrollmentsIds, setEnrollmentsIds] = useState<Array<number | string>>([]);
    const [certificatesIds, setCertificatesIds] = useState<Array<number | string>>([]);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [levelValue, setLevelValue] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [certificateEnabled, setCertificateEnabled] = useState<boolean>(false);
    const [certificateTemplateFile, setCertificateTemplateFile] = useState<File | null>(null);
    const [certificateTemplatePreview, setCertificateTemplatePreview] = useState<string | null>(null);
    const [certificateNamePosition, setCertificateNamePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
    const [certificateNameMaxLength, setCertificateNameMaxLength] = useState<number>(40);
    const [certificateNameBoxSize, setCertificateNameBoxSize] = useState<{ width: number; height: number }>({ width: 40, height: 16 });
    const [certificateRequiredPointsInput, setCertificateRequiredPointsInput] = useState<string>('');
    const allowedFontFamilies = ['Poppins', 'Montserrat', 'Playfair Display', 'Roboto', 'Lora'] as const;
    const [certificateNameFontFamily, setCertificateNameFontFamily] = useState<string>(allowedFontFamilies[0]);
    const [certificateNameFontWeight, setCertificateNameFontWeight] = useState<string>('600');
    const [certificateNameTextAlign, setCertificateNameTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [certificateNameTextColor, setCertificateNameTextColor] = useState<string>('#1F2937');
    const [certificateNameLetterSpacing, setCertificateNameLetterSpacing] = useState<number>(0);
    const [certificateSampleName, setCertificateSampleName] = useState<string>('Nama Lengkap Peserta');
    const [certificateQrPosition, setCertificateQrPosition] = useState<{ x: number; y: number }>({ ...DEFAULT_QR_POSITION });
    const [certificateQrSize, setCertificateQrSize] = useState<{ width: number; height: number }>({ ...DEFAULT_QR_SIZE });
    const [certificateImageOverlays, setCertificateImageOverlays] = useState<CertificateImageOverlayState[]>([]);
    const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

    const levelOptions: ComboboxOption[] = [
        { value: 'Pemula', label: 'Pemula' },
        { value: 'Menengah', label: 'Menengah' },
        { value: 'Lanjutan', label: 'Lanjutan' },
        { value: 'Semua Level', label: 'Semua Level' },
    ];

    const clampPositionForSize = (value: { x: number; y: number }, dimensions: { width: number; height: number }) => {
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;

        return {
            x: Math.min(100 - halfWidth, Math.max(halfWidth, value.x)),
            y: Math.min(100 - halfHeight, Math.max(halfHeight, value.y)),
        };
    };

    const fontFamilyOptions = allowedFontFamilies.map((family) => ({
        value: family,
        label: family,
    }));

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

    useEffect(() => {
        if (!certificateEnabled) {
            setActiveOverlayId(null);
        }
    }, [certificateEnabled]);

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

    const handleCertificateRequiredPointsChange = (event: ChangeEvent<HTMLInputElement>) => {
        const sanitized = event.target.value.replace(/[^\d]/g, '');
        setCertificateRequiredPointsInput(sanitized);
    };

    const handleAddCertificateOverlay = () => {
        setCertificateImageOverlays((current) => {
            const clientId = generateOverlayClientId();
            const next: CertificateImageOverlayState = {
                clientId,
                label: `Overlay ${current.filter((item) => item.status !== 'delete').length + 1}`,
                position: { x: 78, y: 50 },
                size: { ...DEFAULT_OVERLAY_SIZE },
                zIndex: current.length + 1,
                file: null,
                fileUrl: null,
                status: 'create',
            };

            const updated = [...current, next];

            setActiveOverlayId(clientId);

            return assignOverlayZIndexes(updated);
        });
    };

    const handleOverlaySelect = (clientId: string) => {
        setActiveOverlayId(clientId);
    };

    const handleOverlayPositionChange = (clientId: string, value: { x: number; y: number }) => {
        setCertificateImageOverlays((current) =>
            current.map((overlay) => {
                if (overlay.clientId !== clientId || overlay.status === 'delete') {
                    return overlay;
                }

                const nextPosition = clampPositionForSize(value, overlay.size);

                if (overlay.position.x === nextPosition.x && overlay.position.y === nextPosition.y) {
                    return overlay;
                }

                return {
                    ...overlay,
                    position: nextPosition,
                    status: overlay.id ? 'update' : overlay.status,
                };
            }),
        );
    };

    const handleOverlaySizeChange = (clientId: string, value: { width: number; height: number }) => {
        setCertificateImageOverlays((current) =>
            current.map((overlay) => {
                if (overlay.clientId !== clientId || overlay.status === 'delete') {
                    return overlay;
                }

                const width = Math.min(100, Math.max(5, Math.round(value.width * 100) / 100));
                const height = Math.min(100, Math.max(5, Math.round(value.height * 100) / 100));
                const normalizedSize = { width, height };
                const normalizedPosition = clampPositionForSize(overlay.position, normalizedSize);

                if (
                    overlay.size.width === normalizedSize.width &&
                    overlay.size.height === normalizedSize.height &&
                    overlay.position.x === normalizedPosition.x &&
                    overlay.position.y === normalizedPosition.y
                ) {
                    return overlay;
                }

                return {
                    ...overlay,
                    size: normalizedSize,
                    position: normalizedPosition,
                    status: overlay.id ? 'update' : overlay.status,
                };
            }),
        );
    };

    const handleOverlayLabelChange = (clientId: string, label: string) => {
        setCertificateImageOverlays((current) =>
            current.map((overlay) => {
                if (overlay.clientId !== clientId || overlay.status === 'delete') {
                    return overlay;
                }

                const normalizedLabel = label.slice(0, 120);

                if (overlay.label === normalizedLabel) {
                    return overlay;
                }

                return {
                    ...overlay,
                    label: normalizedLabel,
                    status: overlay.id ? 'update' : overlay.status,
                };
            }),
        );
    };

    const handleOverlayFileChange = async (clientId: string, fileList: FileList | null) => {
        const file = fileList && fileList.length > 0 ? fileList[0] : null;

        if (!file) {
            setCertificateImageOverlays((current) =>
                current.map((overlay) => {
                    if (overlay.clientId !== clientId || overlay.status === 'delete') {
                        return overlay;
                    }

                    if (!overlay.file && !overlay.fileUrl) {
                        return overlay;
                    }

                    return {
                        ...overlay,
                        file: null,
                        fileUrl: null,
                        status: overlay.id ? 'update' : overlay.status,
                    };
                }),
            );

            setActiveOverlayId(clientId);

            return;
        }

        try {
            const preview = await readFileAsDataUrl(file);

            setCertificateImageOverlays((current) =>
                current.map((overlay) => {
                    if (overlay.clientId !== clientId || overlay.status === 'delete') {
                        return overlay;
                    }

                    return {
                        ...overlay,
                        file,
                        fileUrl: preview,
                        status: overlay.id ? 'update' : overlay.status,
                    };
                }),
            );

            setActiveOverlayId(clientId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOverlayRemove = (clientId: string) => {
        setCertificateImageOverlays((current) => {
            const next: CertificateImageOverlayState[] = [];

            for (const overlay of current) {
                if (overlay.clientId !== clientId) {
                    next.push(overlay);
                    continue;
                }

                if (overlay.id) {
                    next.push({
                        ...overlay,
                        status: 'delete' as const,
                    });
                }
            }

            if (activeOverlayId === clientId) {
                setActiveOverlayId(null);
            }

            return assignOverlayZIndexes(next);
        });
    };

    const handleOverlayMove = (clientId: string, direction: 'up' | 'down') => {
        setCertificateImageOverlays((current) => {
            const index = current.findIndex((overlay) => overlay.clientId === clientId);

            if (index === -1) {
                return current;
            }

            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex < 0 || targetIndex >= current.length) {
                return current;
            }

            const updated = [...current];
            const [moved] = updated.splice(index, 1);
            updated.splice(targetIndex, 0, moved);

            const withStatus: CertificateImageOverlayState[] = updated.map((overlay) => {
                if (overlay.id && overlay.status !== 'create' && overlay.status !== 'delete') {
                    return {
                        ...overlay,
                        status: 'update' as const,
                    };
                }

                return overlay;
            });

            const normalized = assignOverlayZIndexes(withStatus);

            return normalized;
        });
    };

    const handleOverlayBringToFront = (clientId: string) => {
        setCertificateImageOverlays((current) => {
            const sorted = [...current].sort((a, b) => a.zIndex - b.zIndex);
            const index = sorted.findIndex((overlay) => overlay.clientId === clientId);

            if (index === -1) {
                return current;
            }

            const [item] = sorted.splice(index, 1);
            sorted.push(item);

            const withStatus: CertificateImageOverlayState[] = sorted.map((overlay) => {
                if (overlay.id && overlay.status !== 'create' && overlay.status !== 'delete') {
                    return {
                        ...overlay,
                        status: 'update' as const,
                    };
                }

                return overlay;
            });

            const normalized = assignOverlayZIndexes(withStatus);

            return normalized;
        });
    };

    const visibleOverlays = useMemo(
        () => certificateImageOverlays.filter((overlay) => overlay.status !== 'delete').sort((a, b) => a.zIndex - b.zIndex),
        [certificateImageOverlays],
    );

    const handleQrOverlayPositionChange = (value: { x: number; y: number }) => {
        setCertificateQrPosition((current) => {
            const next = clampPositionForSize(value, certificateQrSize);

            if (current.x === next.x && current.y === next.y) {
                return current;
            }

            return next;
        });
    };

    const handleQrOverlaySizeChange = (value: { width: number; height: number }) => {
        const width = Math.min(100, Math.max(5, Math.round(value.width * 100) / 100));
        const height = Math.min(100, Math.max(5, Math.round(value.height * 100) / 100));
        const nextSize = { width, height };

        setCertificateQrSize((current) => {
            if (current.width === nextSize.width && current.height === nextSize.height) {
                return current;
            }

            return nextSize;
        });

        setCertificateQrPosition((currentPosition) => clampPositionForSize(currentPosition, nextSize));
    };

    const handleCertificateHorizontalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        setCertificateNamePosition((current) =>
            clampPositionForSize(
                {
                    x: Math.min(100, Math.max(0, Math.round(coordinate))),
                    y: current.y,
                },
                certificateNameBoxSize,
            ),
        );
    };

    const handleCertificateVerticalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        setCertificateNamePosition((current) =>
            clampPositionForSize(
                {
                    x: current.x,
                    y: Math.min(100, Math.max(0, Math.round(coordinate))),
                },
                certificateNameBoxSize,
            ),
        );
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

    const handleCertificateQrHorizontalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        const sanitized = Math.min(100, Math.max(0, Math.round(coordinate)));
        handleQrOverlayPositionChange({ x: sanitized, y: certificateQrPosition.y });
    };

    const handleCertificateQrVerticalChange = (value: number[]) => {
        const [coordinate] = value;

        if (typeof coordinate !== 'number') {
            return;
        }

        const sanitized = Math.min(100, Math.max(0, Math.round(coordinate)));
        handleQrOverlayPositionChange({ x: certificateQrPosition.x, y: sanitized });
    };

    const handleCertificateQrWidthChange = (value: number[]) => {
        const [width] = value;

        if (typeof width !== 'number') {
            return;
        }

        const sanitized = Math.min(100, Math.max(5, Math.round(width)));
        handleQrOverlaySizeChange({ width: sanitized, height: certificateQrSize.height });
    };

    const handleCertificateQrHeightChange = (value: number[]) => {
        const [height] = value;

        if (typeof height !== 'number') {
            return;
        }

        const sanitized = Math.min(100, Math.max(5, Math.round(height)));
        handleQrOverlaySizeChange({ width: certificateQrSize.width, height: sanitized });
    };

    const handleCertificateQrReset = () => {
        setCertificateQrSize({ ...DEFAULT_QR_SIZE });
        setCertificateQrPosition(() => clampPositionForSize({ ...DEFAULT_QR_POSITION }, DEFAULT_QR_SIZE));
        setActiveOverlayId(QR_OVERLAY_ID);
    };

    return (
        <AppLayout>
            <Head title='Create Course' />
            <Form
                {...CourseController.store.form()}
                transform={(data) => {
                    const transformed: Record<string, FormDataConvertible> = {
                        ...data,
                        thumbnail: thumbnailFile || data.thumbnail,
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
                        certificate_qr_position_x: certificateEnabled ? Math.round(certificateQrPosition.x) : null,
                        certificate_qr_position_y: certificateEnabled ? Math.round(certificateQrPosition.y) : null,
                        certificate_qr_box_width: certificateEnabled ? Math.round(certificateQrSize.width) : null,
                        certificate_qr_box_height: certificateEnabled ? Math.round(certificateQrSize.height) : null,
                    };

                    if (certificateEnabled) {
                        const trimmedRequiredPoints = certificateRequiredPointsInput.trim();

                        if (trimmedRequiredPoints.length > 0) {
                            const numeric = Number.parseInt(trimmedRequiredPoints, 10);
                            transformed.certificate_required_points = Number.isNaN(numeric) ? '' : Math.max(0, numeric);
                        } else {
                            transformed.certificate_required_points = '';
                        }
                    } else {
                        transformed.certificate_required_points = '';
                    }

                    if (certificateEnabled && certificateTemplateFile) {
                        transformed.certificate_template = certificateTemplateFile;
                    } else {
                        delete transformed.certificate_template;
                    }

                    if (certificateEnabled) {
                        const entries = certificateImageOverlays.flatMap((overlay): Array<Record<string, FormDataConvertible>> => {
                            if (overlay.status === 'delete' && !overlay.id) {
                                return [];
                            }

                            const action = overlay.status ?? (overlay.id ? 'keep' : 'create');
                            const base: Record<string, FormDataConvertible> = {
                                action,
                                id: overlay.id ?? null,
                                client_id: overlay.clientId,
                            };

                            if (action === 'delete') {
                                return [base];
                            }

                            base.label = overlay.label ?? null;
                            base.position_x = Math.round(overlay.position.x);
                            base.position_y = Math.round(overlay.position.y);
                            base.width = Math.round(overlay.size.width);
                            base.height = Math.round(overlay.size.height);
                            base.z_index = overlay.zIndex;

                            if (overlay.file) {
                                const fileKey = overlay.clientId;
                                base.file_key = fileKey;
                                transformed[`certificate_image_files[${fileKey}]`] = overlay.file;
                            }

                            return [base];
                        });

                        transformed.certificate_image_entries = JSON.stringify(entries);
                    } else {
                        transformed.certificate_image_entries = '[]';
                    }

                    return transformed;
                }}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Buat Kursus Baru</h1>
                            <p className='text-sm text-muted-foreground'>Lengkapi informasi di bawah ini untuk membuat kursus baru.</p>
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
                                        <Input id='title' name='title' type='text' placeholder='Masukkan judul kursus' required />
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
                                            searchPlaceholder='Cari atau ketik level...'
                                            emptyText='Level tidak ditemukan.'
                                            allowCustom
                                        />
                                        <p className='text-xs text-muted-foreground'>Pilih dari daftar atau ketik level kustom</p>
                                        <InputError message={errors.level} />
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <Label htmlFor='duration'>
                                            Durasi <span className='text-xs text-muted-foreground'>(dalam menit)</span>
                                        </Label>
                                        <Input id='duration' name='duration' type='number' min='0' step='1' placeholder='Contoh: 120' />
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
                                        Thumbnail <span className='text-xs text-muted-foreground'>(Gambar Kursus)</span>
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
                                        <p className='text-xs text-muted-foreground'>Tampilkan nama peserta pada template sertifikat khusus.</p>
                                    </div>
                                    <Switch checked={certificateEnabled} onCheckedChange={(value) => setCertificateEnabled(Boolean(value))} />
                                </div>
                                <div className='grid gap-6 rounded-lg border p-4'>
                                    <div className='grid gap-2'>
                                        <Label htmlFor='certificate_required_points'>Poin minimum sertifikat</Label>
                                        <Input
                                            id='certificate_required_points'
                                            name='certificate_required_points'
                                            type='text'
                                            inputMode='numeric'
                                            pattern='[0-9]*'
                                            value={certificateRequiredPointsInput}
                                            onChange={handleCertificateRequiredPointsChange}
                                            disabled={!certificateEnabled}
                                            placeholder={certificateEnabled ? 'Contoh: 150' : 'Nonaktif'}
                                        />
                                        <p className='text-xs text-muted-foreground'>
                                            {certificateEnabled
                                                ? 'Biarkan kosong untuk memakai 50% dari total poin kuis yang tersedia.'
                                                : 'Aktifkan sertifikat untuk mengatur batas poin minimal.'}
                                        </p>
                                        {certificateEnabled ? (
                                            <p className='text-xs text-muted-foreground'>
                                                Total poin kuis akan dihitung otomatis setelah modul dan kuis ditambahkan.
                                            </p>
                                        ) : null}
                                        <InputError message={errors.certificate_required_points} />
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label htmlFor='certificate_template'>Template Sertifikat</Label>
                                        <ImageDropzone
                                            onDrop={handleCertificateTemplateDrop}
                                            preview={certificateTemplatePreview}
                                            onRemove={removeCertificateTemplate}
                                            disabled={!certificateEnabled}
                                            previewOverlay={
                                                certificateEnabled && certificateTemplatePreview ? (
                                                    <CertificateTemplateOverlay
                                                        enabled={certificateEnabled}
                                                        nameOverlay={{
                                                            editable: certificateEnabled,
                                                            position: certificateNamePosition,
                                                            size: certificateNameBoxSize,
                                                            onPositionChange: (value) =>
                                                                setCertificateNamePosition((current) => {
                                                                    const next = clampPositionForSize(value, certificateNameBoxSize);

                                                                    if (current.x === next.x && current.y === next.y) {
                                                                        return current;
                                                                    }

                                                                    return next;
                                                                }),
                                                            onSizeChange: (value) => {
                                                                const width = Math.min(100, Math.max(10, Math.round(value.width * 100) / 100));
                                                                const height = Math.min(100, Math.max(10, Math.round(value.height * 100) / 100));
                                                                const nextSize = { width, height };

                                                                setCertificateNameBoxSize((current) => {
                                                                    if (current.width === nextSize.width && current.height === nextSize.height) {
                                                                        return current;
                                                                    }

                                                                    return nextSize;
                                                                });

                                                                setCertificateNamePosition((current) => clampPositionForSize(current, nextSize));
                                                            },
                                                            sampleText: truncatedSampleName,
                                                            fontFamily: certificateNameFontFamily,
                                                            fontWeight: certificateNameFontWeight,
                                                            textAlign: certificateNameTextAlign,
                                                            textColor: certificateNameTextColor,
                                                            letterSpacing: certificateNameLetterSpacing,
                                                            guidance: 'Seret kotak untuk memindahkan, tarik sudut untuk mengubah ukuran.',
                                                        }}
                                                        qrOverlay={{
                                                            editable: certificateEnabled,
                                                            position: certificateQrPosition,
                                                            size: certificateQrSize,
                                                            onPositionChange: handleQrOverlayPositionChange,
                                                            onSizeChange: handleQrOverlaySizeChange,
                                                            isSelected: activeOverlayId === QR_OVERLAY_ID,
                                                            onSelect: () => setActiveOverlayId(QR_OVERLAY_ID),
                                                        }}
                                                        imageOverlays={visibleOverlays.map((overlay) => ({
                                                            key: overlay.clientId,
                                                            editable: certificateEnabled,
                                                            position: overlay.position,
                                                            size: overlay.size,
                                                            onPositionChange: (value) => handleOverlayPositionChange(overlay.clientId, value),
                                                            onSizeChange: (value) => handleOverlaySizeChange(overlay.clientId, value),
                                                            imageUrl: overlay.fileUrl,
                                                            label: overlay.label,
                                                            isSelected: activeOverlayId === overlay.clientId,
                                                            onSelect: () => handleOverlaySelect(overlay.clientId),
                                                        }))}
                                                    />
                                                ) : null
                                            }
                                            previewOverlayClassName='absolute inset-0'
                                        />
                                        <p className='text-xs text-muted-foreground'>Format gambar PNG atau JPG. Ukuran maksimal 4MB.</p>
                                        <InputError message={errors.certificate_template} />
                                        <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
                                            <div className='space-y-3'>
                                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                                    <div>
                                                        <p className='text-sm font-medium text-foreground'>Overlay Gambar</p>
                                                        <p className='text-xs text-muted-foreground'>
                                                            Tambahkan logo, stempel, atau tanda tangan tambahan.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type='button'
                                                        variant='outline'
                                                        size='sm'
                                                        onClick={handleAddCertificateOverlay}
                                                        disabled={!certificateEnabled}
                                                    >
                                                        <ImagePlus className='h-4 w-4' />
                                                        <span className='sr-only sm:not-sr-only sm:ml-1'>Tambah Overlay</span>
                                                    </Button>
                                                </div>
                                                <div className='space-y-3'>
                                                    {visibleOverlays.length === 0 ? (
                                                        <div className='rounded-lg border border-dashed p-4 text-xs text-muted-foreground'>
                                                            Belum ada overlay gambar. Klik tombol di atas untuk menambahkan.
                                                        </div>
                                                    ) : (
                                                        visibleOverlays.map((overlay, index) => {
                                                            const fallbackLabel =
                                                                overlay.label && overlay.label.trim().length > 0
                                                                    ? overlay.label
                                                                    : `Overlay ${index + 1}`;
                                                            const isActive = activeOverlayId === overlay.clientId;

                                                            return (
                                                                <div
                                                                    key={overlay.clientId}
                                                                    className={`rounded-lg border p-3 transition ${
                                                                        isActive
                                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                                                            : 'border-border bg-card/70'
                                                                    }`}
                                                                >
                                                                    <div className='flex flex-col gap-3'>
                                                                        <div className='flex flex-wrap items-start gap-3'>
                                                                            <div className='h-16 w-24 overflow-hidden rounded-md border bg-muted'>
                                                                                {overlay.fileUrl ? (
                                                                                    <img
                                                                                        src={overlay.fileUrl}
                                                                                        alt={fallbackLabel}
                                                                                        className='h-full w-full object-contain'
                                                                                    />
                                                                                ) : (
                                                                                    <div className='flex h-full w-full items-center justify-center px-2 text-[10px] text-muted-foreground'>
                                                                                        Belum ada gambar
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className='flex min-w-0 flex-1 flex-col gap-2'>
                                                                                <Input
                                                                                    value={overlay.label ?? ''}
                                                                                    placeholder={fallbackLabel}
                                                                                    onChange={(event) =>
                                                                                        handleOverlayLabelChange(overlay.clientId, event.target.value)
                                                                                    }
                                                                                    onFocus={() => handleOverlaySelect(overlay.clientId)}
                                                                                    disabled={!certificateEnabled}
                                                                                />
                                                                                <div className='flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground'>
                                                                                    <span>
                                                                                        Posisi: {Math.round(overlay.position.x)}% ×{' '}
                                                                                        {Math.round(overlay.position.y)}%
                                                                                    </span>
                                                                                    <span className='hidden sm:inline'>•</span>
                                                                                    <span>
                                                                                        Ukuran: {Math.round(overlay.size.width)}% ×{' '}
                                                                                        {Math.round(overlay.size.height)}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex flex-wrap items-center justify-between gap-3'>
                                                                            <div className='flex flex-wrap items-center gap-2'>
                                                                                <label
                                                                                    htmlFor={`overlay-file-${overlay.clientId}`}
                                                                                    className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                                                                                        certificateEnabled
                                                                                            ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                                                                                            : 'cursor-not-allowed opacity-50'
                                                                                    }`}
                                                                                    onClick={() => handleOverlaySelect(overlay.clientId)}
                                                                                >
                                                                                    <input
                                                                                        id={`overlay-file-${overlay.clientId}`}
                                                                                        type='file'
                                                                                        className='hidden'
                                                                                        accept='image/png,image/jpeg,image/webp'
                                                                                        onChange={(event) =>
                                                                                            handleOverlayFileChange(
                                                                                                overlay.clientId,
                                                                                                event.target.files,
                                                                                            )
                                                                                        }
                                                                                        disabled={!certificateEnabled}
                                                                                    />
                                                                                    Ganti Gambar
                                                                                </label>
                                                                                <Button
                                                                                    type='button'
                                                                                    variant='outline'
                                                                                    size='sm'
                                                                                    onClick={() => {
                                                                                        handleOverlaySelect(overlay.clientId);
                                                                                        handleOverlayMove(overlay.clientId, 'up');
                                                                                    }}
                                                                                    disabled={!certificateEnabled || index === 0}
                                                                                >
                                                                                    Naik
                                                                                </Button>
                                                                                <Button
                                                                                    type='button'
                                                                                    variant='outline'
                                                                                    size='sm'
                                                                                    onClick={() => {
                                                                                        handleOverlaySelect(overlay.clientId);
                                                                                        handleOverlayMove(overlay.clientId, 'down');
                                                                                    }}
                                                                                    disabled={
                                                                                        !certificateEnabled || index === visibleOverlays.length - 1
                                                                                    }
                                                                                >
                                                                                    Turun
                                                                                </Button>
                                                                                <Button
                                                                                    type='button'
                                                                                    variant='outline'
                                                                                    size='sm'
                                                                                    onClick={() => {
                                                                                        handleOverlaySelect(overlay.clientId);
                                                                                        handleOverlayBringToFront(overlay.clientId);
                                                                                    }}
                                                                                    disabled={
                                                                                        !certificateEnabled || index === visibleOverlays.length - 1
                                                                                    }
                                                                                >
                                                                                    Paling Atas
                                                                                </Button>
                                                                            </div>
                                                                            <Button
                                                                                type='button'
                                                                                variant='ghost'
                                                                                size='icon'
                                                                                onClick={() => handleOverlayRemove(overlay.clientId)}
                                                                                disabled={!certificateEnabled}
                                                                                className='text-destructive hover:bg-destructive/10'
                                                                            >
                                                                                <Trash2 className='h-4 w-4' />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <InputError message={errors.certificate_image_entries} />
                                            </div>
                                            <div className='space-y-4 rounded-lg border bg-muted/20 p-4'>
                                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                                    <div>
                                                        <p className='text-sm font-medium text-foreground'>Posisi QR Sertifikat</p>
                                                        <p className='text-xs text-muted-foreground'>
                                                            Seret langsung pada pratinjau atau gunakan slider berikut.
                                                        </p>
                                                    </div>
                                                    <div className='flex gap-2'>
                                                        <Button
                                                            type='button'
                                                            variant={activeOverlayId === QR_OVERLAY_ID ? 'default' : 'outline'}
                                                            size='sm'
                                                            onClick={() => setActiveOverlayId(QR_OVERLAY_ID)}
                                                            disabled={!certificateEnabled}
                                                        >
                                                            <QrCode className='h-4 w-4' />
                                                            <span className='sr-only sm:not-sr-only sm:ml-1'>Pilih QR</span>
                                                        </Button>
                                                        <Button
                                                            type='button'
                                                            variant='outline'
                                                            size='sm'
                                                            onClick={handleCertificateQrReset}
                                                            disabled={!certificateEnabled}
                                                        >
                                                            Reset QR
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className='grid gap-4'>
                                                    <div className='grid gap-2'>
                                                        <Label htmlFor='certificate_qr_position_x'>Posisi Horizontal QR</Label>
                                                        <Slider
                                                            id='certificate_qr_position_x'
                                                            value={[certificateQrPosition.x]}
                                                            onValueChange={handleCertificateQrHorizontalChange}
                                                            max={100}
                                                            step={1}
                                                            disabled={!certificateEnabled}
                                                        />
                                                        <p className='text-xs text-muted-foreground'>
                                                            Terletak {certificateQrPosition.x}% dari sisi kiri.
                                                        </p>
                                                        <InputError message={errors.certificate_qr_position_x} />
                                                    </div>
                                                    <div className='grid gap-2'>
                                                        <Label htmlFor='certificate_qr_position_y'>Posisi Vertikal QR</Label>
                                                        <Slider
                                                            id='certificate_qr_position_y'
                                                            value={[certificateQrPosition.y]}
                                                            onValueChange={handleCertificateQrVerticalChange}
                                                            max={100}
                                                            step={1}
                                                            disabled={!certificateEnabled}
                                                        />
                                                        <p className='text-xs text-muted-foreground'>
                                                            Terletak {certificateQrPosition.y}% dari sisi atas.
                                                        </p>
                                                        <InputError message={errors.certificate_qr_position_y} />
                                                    </div>
                                                    <div className='grid gap-2'>
                                                        <Label htmlFor='certificate_qr_box_width'>Lebar Area QR</Label>
                                                        <Slider
                                                            id='certificate_qr_box_width'
                                                            value={[certificateQrSize.width]}
                                                            onValueChange={handleCertificateQrWidthChange}
                                                            min={5}
                                                            max={40}
                                                            step={1}
                                                            disabled={!certificateEnabled}
                                                        />
                                                        <p className='text-xs text-muted-foreground'>
                                                            Lebar {certificateQrSize.width}% dari lebar sertifikat.
                                                        </p>
                                                        <InputError message={errors.certificate_qr_box_width} />
                                                    </div>
                                                    <div className='grid gap-2'>
                                                        <Label htmlFor='certificate_qr_box_height'>Tinggi Area QR</Label>
                                                        <Slider
                                                            id='certificate_qr_box_height'
                                                            value={[certificateQrSize.height]}
                                                            onValueChange={handleCertificateQrHeightChange}
                                                            min={5}
                                                            max={40}
                                                            step={1}
                                                            disabled={!certificateEnabled}
                                                        />
                                                        <p className='text-xs text-muted-foreground'>
                                                            Tinggi {certificateQrSize.height}% dari tinggi sertifikat.
                                                        </p>
                                                        <InputError message={errors.certificate_qr_box_height} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

                            {/* Settings Section - Commented out until certificate management is ready */}
                            {/* <div className='space-y-4'>
                                <h3 className='text-sm font-medium text-foreground'>Pengaturan</h3>
                                <div className='flex items-center gap-3 rounded-lg border p-4'>
                                    <Checkbox id='certification_enabled' name='certification_enabled' />
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
                            {processing ? 'Menyimpan…' : 'Simpan Kursus'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
