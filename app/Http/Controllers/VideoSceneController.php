<?php

namespace App\Http\Controllers;

use App\Models\VideoScene;
use App\Http\Requests\VideoScene\StoreVideoSceneRequest;
use App\Http\Requests\VideoScene\UpdateVideoSceneRequest;
use App\Data\VideoScene\VideoSceneData;
use Illuminate\Http\JsonResponse;

class VideoSceneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = VideoScene::with(['module_content', 'scene_interactions'])->get();

        $data = array_map(fn($m) => VideoSceneData::fromModel($m), $items->all());

        return response()->json($data);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreVideoSceneRequest $request)
    {
        $validated = $request->validated();

        $scene = VideoScene::create($validated);

        return response()->json(VideoSceneData::fromModel($scene->load(['module_content', 'scene_interactions'])), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(VideoScene $videoScene)
    {
        return response()->json(VideoSceneData::fromModel($videoScene->load(['module_content', 'scene_interactions'])));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VideoScene $videoScene)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateVideoSceneRequest $request, VideoScene $videoScene)
    {
        $videoScene->update($request->validated());

        return response()->json(VideoSceneData::fromModel($videoScene->fresh()->load(['module_content', 'scene_interactions'])));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VideoScene $videoScene)
    {
        //
    }
}
