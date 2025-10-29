import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { getModuleAbleOptionByFqcn, getModuleAbleOptionByKey, type ModuleAbleKey } from './constants';

export type ModuleStageRecord = App.Data.ModuleStage.ModuleStageData;

interface ModuleStageShowProps {
    record: ModuleStageRecord;
}

const resolveRelatedId = (value: unknown): number | string | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const record = value as Record<string, unknown>;
    const identifier = record.id;

    if (typeof identifier === 'number' || typeof identifier === 'string') {
        return identifier;
    }

    return null;
};

const resolveRelatedName = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const record = value as Record<string, unknown>;

    if (typeof record.name === 'string' && record.name.trim().length > 0) {
        return record.name;
    }

    if (typeof record.title === 'string' && record.title.trim().length > 0) {
        return record.title;
    }

    return null;
};

const formatPrimitive = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return String(value);
        }
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toLocaleString() : String(value);
    }

    return String(value);
};

export default function ModuleStageShow({ record }: ModuleStageShowProps) {
    const moduleAbleOption = getModuleAbleOptionByKey(record.module_able as ModuleAbleKey | null);
    const moduleAbleLabel = moduleAbleOption?.label ?? (typeof record.module_able === 'string' ? record.module_able : null);
    const moduleAbleTypeOption = getModuleAbleOptionByFqcn(record.module_able_type ?? null);
    const moduleInfo = record.module;
    const moduleName = resolveRelatedName(moduleInfo);
    const moduleId = resolveRelatedId(moduleInfo);
    const relatedTarget = record.module_content ?? record.module_quiz;
    const moduleTargetName = resolveRelatedName(relatedTarget);
    const moduleTargetId = record.module_able_id ?? resolveRelatedId(relatedTarget);

    return (
        <AppLayout>
            <Head title='Detail Tahap Modul' />
            <div className='mx-auto max-w-3xl space-y-6 py-6'>
                <h1 className='text-2xl font-semibold'>Detail Tahap Modul</h1>
                <div className='overflow-hidden rounded-lg border bg-card shadow-sm'>
                    <dl className='divide-y divide-border'>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>ID</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{formatPrimitive(record.id)}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Modul</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {moduleName ? (
                                        <div className='space-y-0.5'>
                                            <span>{moduleName}</span>
                                            {moduleId !== null ? <span className='text-xs text-muted-foreground'>ID: {moduleId}</span> : null}
                                        </div>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Tipe Tahap</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {moduleAbleLabel ? (
                                        <div className='space-y-0.5'>
                                            <span>{moduleAbleLabel}</span>
                                            {record.module_able ? (
                                                <span className='text-xs text-muted-foreground'>Nilai: {record.module_able}</span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Kelas Tahap</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {record.module_able_type ? (
                                        <div className='space-y-0.5'>
                                            <span>{moduleAbleTypeOption?.label ?? record.module_able_type}</span>
                                            {moduleAbleTypeOption ? (
                                                <span className='text-xs text-muted-foreground'>{record.module_able_type}</span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        '—'
                                    )}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>ID Tahap Terkait</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {moduleTargetId !== null ? formatPrimitive(moduleTargetId) : '—'}
                                </div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Nama Tahap Terkait</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{moduleTargetName ?? '—'}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Urutan</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{formatPrimitive(record.order)}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Dibuat Pada</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{formatPrimitive(record.created_at)}</div>
                            </dd>
                        </div>
                        <div className='grid gap-2 px-6 py-4 sm:grid-cols-3'>
                            <dt className='text-sm font-medium text-muted-foreground'>Diperbarui Pada</dt>
                            <dd className='sm:col-span-2'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>{formatPrimitive(record.updated_at)}</div>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}
