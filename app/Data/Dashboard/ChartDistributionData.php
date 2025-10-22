<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class ChartDistributionData extends Data {
    /**
     * @param  array<string, mixed>  $meta
     */
    public function __construct(
        public string $title,
        public ?string $description,
        #[DataCollectionOf(ChartSegmentData::class)]
        public DataCollection $segments,
        public array $meta,
    ) {}
}
