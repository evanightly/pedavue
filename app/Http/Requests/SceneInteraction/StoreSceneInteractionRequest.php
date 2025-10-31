<?php

namespace App\Http\Requests\SceneInteraction;

use Illuminate\Foundation\Http\FormRequest;
use App\Data\SceneInteraction\SceneInteractionData;

class StoreSceneInteractionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'video_scene_id' => ['required', 'exists:video_scenes,id'],
            'interactable_type' => ['nullable', 'string'],
            'interactable_id' => ['nullable', 'integer'],
            'payload' => ['nullable', 'array'],
            'position' => ['nullable', 'integer'],
        ];
    }

    public function toData(): SceneInteractionData
    {
        return SceneInteractionData::from($this->validated());
    }
}
