<?php

namespace App\Http\Requests\Workspace;

class CompleteStageRequest extends AbstractWorkspaceStageRequest {
    public function authorize(): bool {
        if (!parent::authorize()) {
            return false;
        }

        return $this->moduleStage()->module_able === 'content';
    }

    public function rules(): array {
        return [];
    }
}
