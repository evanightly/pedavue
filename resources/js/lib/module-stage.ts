export const MODULE_STAGE_TYPES = {
    Content: 'content',
    Quiz: 'quiz',
} as const;

export type ModuleStageType = (typeof MODULE_STAGE_TYPES)[keyof typeof MODULE_STAGE_TYPES];

type StageLike =
    | {
          module_able?: unknown;
      }
    | null
    | undefined;

export function resolveModuleStageType(stage: StageLike): ModuleStageType | null {
    const value = typeof stage?.module_able === 'string' ? stage.module_able : null;

    if (value === MODULE_STAGE_TYPES.Content || value === MODULE_STAGE_TYPES.Quiz) {
        return value;
    }

    return null;
}

export function isModuleStageQuiz(stage: StageLike): boolean {
    return resolveModuleStageType(stage) === MODULE_STAGE_TYPES.Quiz;
}

export function isModuleStageContent(stage: StageLike): boolean {
    return resolveModuleStageType(stage) === MODULE_STAGE_TYPES.Content;
}
