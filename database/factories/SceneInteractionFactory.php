<?php

namespace Database\Factories;

use App\Models\SceneInteraction;
use App\Models\VideoScene;
use Illuminate\Database\Eloquent\Factories\Factory;

class SceneInteractionFactory extends Factory
{
    protected $model = SceneInteraction::class;

    public function definition(): array
    {
        return [
            'video_scene_id' => VideoScene::factory(),
            'interactable_type' => null,
            'interactable_id' => null,
            'payload' => ['label' => $this->faker->sentence()],
            'position' => $this->faker->numberBetween(0, 10),
        ];
    }
}
