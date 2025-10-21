<?php

namespace App\Support\Enums;

use App\Traits\Enums\Arrayable;

enum ModuleStageProgressStatus: string {
    use Arrayable;

    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
