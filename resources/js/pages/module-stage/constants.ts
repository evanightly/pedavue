export const MODULEABLE_OPTIONS = [
    { key: 'content', label: 'Konten Modul', fqcn: 'App\\Models\\ModuleContent' },
    { key: 'quiz', label: 'Kuis Modul', fqcn: 'App\\Models\\Quiz' },
] as const;

export type ModuleAbleOption = (typeof MODULEABLE_OPTIONS)[number];
export type ModuleAbleKey = ModuleAbleOption['key'];

export const getModuleAbleOptionByKey = (key: ModuleAbleKey | null | undefined): ModuleAbleOption | null => {
    if (!key) {
        return null;
    }

    return MODULEABLE_OPTIONS.find((option) => option.key === key) ?? null;
};

export const getModuleAbleOptionByFqcn = (fqcn: string | null | undefined): ModuleAbleOption | null => {
    if (!fqcn) {
        return null;
    }

    return MODULEABLE_OPTIONS.find((option) => option.fqcn === fqcn) ?? null;
};
