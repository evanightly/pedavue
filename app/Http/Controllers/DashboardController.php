<?php

namespace App\Http\Controllers;

use App\Support\Dashboard\DashboardBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller {
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse {
        $user = $request->user();

        if ($user === null) {
            return Inertia::render('dashboard');
        }

        $dashboard = (new DashboardBuilder($request, $user))->build();

        if ($request->wantsJson()) {
            return response()->json([
                'dashboard' => $dashboard->toArray(),
            ]);
        }

        return Inertia::render('dashboard', [
            'dashboard' => $dashboard->toArray(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create() {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id) {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id) {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id) {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id) {
        //
    }
}
