<?php

namespace App\Http\Requests\Workspace;

class ReattemptStageQuizRequest extends AbstractWorkspaceStageRequest {
    public function authorize(): bool {
        if (!parent::authorize()) {
            return false;
        }

        return $this->moduleStage()->module_able === 'quiz';
    }
}
