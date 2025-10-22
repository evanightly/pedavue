<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class ChartSegmentData extends Data {
    public function __construct(
        public string $key,
        public string $label,
        public int $value,
        public ?string $color,
    ) {}
}
