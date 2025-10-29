import ModuleContentController from '@/actions/App/Http/Controllers/ModuleContentController';
import ModuleController from '@/actions/App/Http/Controllers/ModuleController';
import ModuleStageController from '@/actions/App/Http/Controllers/ModuleStageController';
import QuizController from '@/actions/App/Http/Controllers/QuizController';
import GenericDataSelector from '@/components/generic-data-selector';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MODULEABLE_OPTIONS, type ModuleAbleKey, getModuleAbleOptionByKey } from './constants';

export type ModuleStageRecord = App.Data.ModuleStage.ModuleStageData;

interface ModuleStageEditProps {
    record: ModuleStageRecord;
}

type SelectorItem = { id: number | string } & Record<string, unknown>;

type FetchParams = { search?: string } & Record<string, unknown>;

type SelectorConfig = {
    placeholder: string;
    fetcher: (filters: FetchParams) => Promise<unknown>;
    mapper: (response: unknown) => SelectorItem[];
};

const toNumeric = (value: unknown): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const parsed = Number.parseInt(String(value), 10);

    return Number.isNaN(parsed) ? null : parsed;
};

const coerceModuleAble = (value: unknown): ModuleAbleKey | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const option = getModuleAbleOptionByKey(value as ModuleAbleKey);

    return option?.key ?? null;
};

const normalizeSelectorItems = (payload: unknown): SelectorItem[] => {
    if (Array.isArray(payload)) {
        return payload as SelectorItem[];
    }

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const candidateKeys = ['data', 'records', 'items', 'results'];

        for (const key of candidateKeys) {
            const value = record[key];

            if (Array.isArray(value)) {
                return value as SelectorItem[];
            }

            if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).data)) {
                return (value as Record<string, unknown>).data as SelectorItem[];
            }
        }

        for (const value of Object.values(record)) {
            if (Array.isArray(value)) {
                return value as SelectorItem[];
            }

            if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).data)) {
                return (value as Record<string, unknown>).data as SelectorItem[];
            }
        }
    }

    return [];
};

const mapSelectorResponse = (response: unknown): SelectorItem[] => {
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

const fetchModuleOptions = async ({ search }: FetchParams) => {
    const params: Record<string, unknown> = {};

    if (typeof search === 'string' && search.trim().length > 0) {
        params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleController.index().url, { params });

    return response;
};

const fetchModuleContentOptions = async ({ search }: FetchParams) => {
    const params: Record<string, unknown> = {};

    if (typeof search === 'string' && search.trim().length > 0) {
        params['filter[search]'] = search.trim();
    }

    const response = await axios.get(ModuleContentController.index().url, { params });

    return response;
};

const fetchQuizOptions = async ({ search }: FetchParams) => {
    const params: Record<string, unknown> = {};

    if (typeof search === 'string' && search.trim().length > 0) {
        params['filter[search]'] = search.trim();
    }

    const response = await axios.get(QuizController.index().url, { params });

    return response;
};

const renderSelectorLabel = (item: SelectorItem): string => {
    return String(item.name ?? item.title ?? item.email ?? item.id);
};

const resolveInitialModuleId = (record: ModuleStageRecord): number | string | null => {
    const related = record.module;

    if (related && typeof related === 'object' && 'id' in related) {
        const identifier = (related as { id?: number | string }).id;
        if (typeof identifier === 'number' || typeof identifier === 'string') {
            return identifier;
        }
    }

    return null;
};

const resolveInitialModuleAbleTargetId = (record: ModuleStageRecord): number | string | null => {
    if (typeof record.module_able_id === 'number') {
        return record.module_able_id;
    }

    if (typeof record.module_able_id === 'string') {
        return record.module_able_id;
    }

    const related = record.module_content ?? record.module_quiz;

    if (related && typeof related === 'object' && 'id' in related) {
        const identifier = (related as { id?: number | string }).id;
        if (typeof identifier === 'number' || typeof identifier === 'string') {
            return identifier;
        }
    }

    return null;
};

export default function ModuleStageEdit({ record }: ModuleStageEditProps) {
    const [moduleId, setModuleId] = useState<number | string | null>(() => resolveInitialModuleId(record));
    const [moduleAble, setModuleAble] = useState<ModuleAbleKey | null>(() => coerceModuleAble(record.module_able));
    const [moduleAbleTargetId, setModuleAbleTargetId] = useState<number | string | null>(() => resolveInitialModuleAbleTargetId(record));
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setModuleAbleTargetId(null);
    }, [moduleAble]);

    const moduleAbleTypeHints = useMemo(() => MODULEABLE_OPTIONS.map((option) => option.fqcn).join(' atau '), []);

    const selectorConfig: SelectorConfig | null = useMemo(() => {
        if (moduleAble === 'content') {
            return {
                placeholder: 'Pilih konten modul',
                fetcher: fetchModuleContentOptions,
                mapper: mapSelectorResponse,
            } as const;
        }

        if (moduleAble === 'quiz') {
            return {
                placeholder: 'Pilih kuis modul',
                fetcher: fetchQuizOptions,
                mapper: mapSelectorResponse,
            } as const;
        }

        return null;
    }, [moduleAble]);

    const selectedModuleAbleType = useMemo(() => {
        const resolved = getModuleAbleOptionByKey(moduleAble)?.fqcn;

        if (resolved) {
            return resolved;
        }

        if (typeof record.module_able_type === 'string' && record.module_able_type.length > 0) {
            return record.module_able_type;
        }

        return null;
    }, [moduleAble, record.module_able_type]);

    return (
        <AppLayout>
            <Head title='Ubah Tahap Modul' />
            <Form
                {...ModuleStageController.update.form(record.id)}
                transform={(data) => ({
                    ...data,
                    order: toNumeric(data.order ?? record.order),
                    module_id: toNumeric(moduleId),
                    module_able: moduleAble ?? record.module_able,
                    module_able_type: selectedModuleAbleType,
                    module_able_id: toNumeric(moduleAbleTargetId),
                })}
                options={{ preserveScroll: true }}
                className='p-8'
            >
                {({ errors, processing }) => (
                    <div className='space-y-6 rounded-xl border bg-card p-8 shadow-sm'>
                        <div className='space-y-2'>
                            <h1 className='text-2xl font-semibold tracking-tight'>Ubah Tahap Modul</h1>
                            <p className='text-sm text-muted-foreground'>Perbarui informasi tahap modul berikut sesuai kebutuhan Anda.</p>
                        </div>
                        <div className='grid gap-6'>
                            <div className='grid gap-2'>
                                <Label htmlFor='module_id'>Modul</Label>
                                <GenericDataSelector<SelectorItem>
                                    id='module-selector'
                                    placeholder='Pilih modul'
                                    fetchData={fetchModuleOptions}
                                    dataMapper={mapSelectorResponse}
                                    selectedDataId={moduleId}
                                    setSelectedData={(value) => setModuleId(value)}
                                    renderItem={renderSelectorLabel}
                                />
                                <InputError message={errors.module_id} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='module_able'>Tipe Tahap</Label>
                                <Select value={moduleAble ?? undefined} onValueChange={(value) => setModuleAble(value as ModuleAbleKey)}>
                                    <SelectTrigger id='module_able'>
                                        <SelectValue placeholder='Pilih tipe tahap' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MODULEABLE_OPTIONS.map((option) => (
                                            <SelectItem key={option.key} value={option.key}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className='text-xs text-muted-foreground'>Gunakan tipe yang sesuai. Tipe terkait kelas: {moduleAbleTypeHints}.</p>
                                <InputError message={errors.module_able} />
                            </div>

                            {selectorConfig ? (
                                <div className='grid gap-2'>
                                    <Label htmlFor='module_able_id'>{moduleAble === 'content' ? 'Konten Modul' : 'Kuis Modul'}</Label>
                                    <GenericDataSelector<SelectorItem>
                                        id='module-able-selector'
                                        placeholder={selectorConfig.placeholder}
                                        fetchData={selectorConfig.fetcher}
                                        dataMapper={selectorConfig.mapper}
                                        selectedDataId={moduleAbleTargetId}
                                        setSelectedData={(value) => setModuleAbleTargetId(value)}
                                        nullable
                                        renderItem={renderSelectorLabel}
                                    />
                                    <InputError message={errors.module_able_id} />
                                </div>
                            ) : null}

                            <div className='grid gap-2'>
                                <Label htmlFor='module_able_type'>Kelas Tahap</Label>
                                <Input
                                    id='module_able_type'
                                    name='module_able_type'
                                    type='text'
                                    readOnly
                                    value={selectedModuleAbleType ?? ''}
                                    placeholder={moduleAbleTypeHints}
                                />
                                <InputError message={errors.module_able_type} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='module_able_label'>Nama Tahap</Label>
                                <Input
                                    id='module_able_label'
                                    name='module_able'
                                    type='text'
                                    readOnly
                                    value={moduleAble ?? record.module_able ?? ''}
                                    placeholder='Misal: content atau quiz'
                                />
                                <InputError message={errors.module_able} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='module_able_id_input'>ID Tahap Terkait</Label>
                                <Input
                                    id='module_able_id_input'
                                    name='module_able_id'
                                    type='number'
                                    min={1}
                                    step={1}
                                    value={moduleAbleTargetId === null ? '' : moduleAbleTargetId}
                                    onChange={(event) => setModuleAbleTargetId(event.target.value)}
                                />
                                <InputError message={errors.module_able_id} />
                            </div>

                            <div className='grid gap-2'>
                                <Label htmlFor='order'>Urutan</Label>
                                <Input id='order' name='order' type='number' min={1} step={1} defaultValue={record.order ?? ''} required />
                                <InputError message={errors.order} />
                            </div>
                        </div>
                        <Button type='submit' disabled={processing} className='w-full sm:w-auto'>
                            {processing && <LoaderCircle className='mr-2 h-4 w-4 animate-spin' />}
                            {processing ? 'Menyimpan…' : 'Simpan perubahan'}
                        </Button>
                    </div>
                )}
            </Form>
        </AppLayout>
    );
}
