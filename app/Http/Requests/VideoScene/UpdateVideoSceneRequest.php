<?php

namespace App\Http\Requests\VideoScene;

use Illuminate\Foundation\Http\FormRequest;
use App\Data\VideoScene\VideoSceneData;

class UpdateVideoSceneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'visual' => ['nullable', 'string'],
            'voice_over' => ['nullable', 'string'],
            'time_chapter' => ['nullable', 'integer'],
            'interaction_trigger_time' => ['nullable', 'integer'],
            'interaction_type' => ['nullable', 'in:essay,multiple_choice,single_choice,view_event'],
        ];
    }

    public function toData(): VideoSceneData
    {
        return VideoSceneData::from($this->validated());
    }
}
