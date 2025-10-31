<?php

namespace App\Http\Controllers;

use App\Http\Requests\SceneInteraction\StoreSceneInteractionRequest;
use App\Http\Requests\SceneInteraction\UpdateSceneInteractionRequest;
use App\Models\SceneInteraction;
use App\Data\SceneInteraction\SceneInteractionData;
use Illuminate\Http\JsonResponse;

class SceneInteractionController extends Controller
{
    public function index(): JsonResponse
    {
        $items = SceneInteraction::with('interactable')->get();

        $data = array_map(fn($m) => SceneInteractionData::fromModel($m), $items->all());

        return response()->json($data);
    }

    public function store(StoreSceneInteractionRequest $request): JsonResponse
    {
        $dto = $request->toData();

        $interaction = SceneInteraction::create($dto->toArray());

        return response()->json(SceneInteractionData::fromModel($interaction->load('interactable')), 201);
    }

    public function show(SceneInteraction $sceneInteraction): JsonResponse
    {
        return response()->json(SceneInteractionData::fromModel($sceneInteraction->load('interactable')));
    }

    public function update(UpdateSceneInteractionRequest $request, SceneInteraction $sceneInteraction): JsonResponse
    {
        $dto = $request->toData();

        $sceneInteraction->update($dto->toArray());

        return response()->json(SceneInteractionData::fromModel($sceneInteraction->fresh()->load('interactable')));
    }

    public function destroy(SceneInteraction $sceneInteraction): JsonResponse
    {
        $sceneInteraction->delete();

        return response()->json(null, 204);
    }
}
