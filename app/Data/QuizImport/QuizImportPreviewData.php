<?php

namespace App\Data\QuizImport;

use App\Data\Quiz\QuizData;
use App\Data\QuizQuestion\QuizQuestionData;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class QuizImportPreviewData extends Data {
    /**
     * @param  DataCollection<QuizImportQuestionPreviewData>  $incomingQuestions
     * @param  DataCollection<QuizImportQuestionPreviewData>|null  $existingQuestions
     * @param  array<int, string>  $warnings
     */
    public function __construct(
        public string $token,
        public int $imported_count,
        public int $existing_count,
        #[DataCollectionOf(QuizImportQuestionPreviewData::class)]
        #[LiteralTypeScriptType('App.Data.QuizImport.QuizImportQuestionPreviewData[]')]
        public DataCollection $incomingQuestions,
        #[DataCollectionOf(QuizImportQuestionPreviewData::class)]
        #[LiteralTypeScriptType('App.Data.QuizImport.QuizImportQuestionPreviewData[]|null')]
        public DataCollection|Optional|null $existingQuestions,
        public array $warnings,
        public QuizData $quiz,
    ) {}

    public static function fromPayload(
        string $token,
        QuizData $quiz,
        array $parsedQuestions,
        ?DataCollection $existingQuestionData,
        array $warnings = []
    ): self {
        $incoming = collect($parsedQuestions)
            ->values()
            ->map(fn (array $question, int $index) => QuizImportQuestionPreviewData::fromImported($question, $index))
            ->all();

        $existing = $existingQuestionData?->toCollection()
            ->values()
            ->map(fn (QuizQuestionData $question, int $index) => QuizImportQuestionPreviewData::fromExisting($question, $index))
            ->all() ?? null;

        return new self(
            token: $token,
            imported_count: count($incoming),
            existing_count: $existingQuestionData?->count() ?? 0,
            incomingQuestions: new DataCollection(QuizImportQuestionPreviewData::class, $incoming),
            existingQuestions: $existing !== null
                ? new DataCollection(QuizImportQuestionPreviewData::class, $existing)
                : Optional::create(),
            warnings: $warnings,
            quiz: $quiz,
        );
    }
}
