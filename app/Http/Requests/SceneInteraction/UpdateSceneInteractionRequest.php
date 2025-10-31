<?php

namespace App\Http\Requests\SceneInteraction;

use Illuminate\Foundation\Http\FormRequest;
use App\Data\SceneInteraction\SceneInteractionData;

class UpdateSceneInteractionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payload' => ['nullable', 'array'],
            'position' => ['nullable', 'integer'],
        ];
    }

    public function toData(): SceneInteractionData
    {
        return SceneInteractionData::from($this->validated());
    }
}
