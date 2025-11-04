<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ThinkerService;
use App\Http\Requests\StoreThinkerRequest;
use App\Http\Requests\UpdateThinkerRequest;
use App\Models\Thinker;
use App\Enums\ThinkerType;
use Inertia\Inertia;

class ThinkerController extends Controller
{
    public function __construct(
        private ThinkerService $thinkerService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        $thinkers = $this->thinkerService->getUserThinkers($user);
        $predefinedThinkers = $this->thinkerService->getPredefinedThinkers();

        return Inertia::render('Thinkers/Index', [
            'thinkers' => $thinkers,
            'predefinedThinkers' => $predefinedThinkers,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreThinkerRequest $request)
    {
        $user = auth()->user();
        $type = ThinkerType::from($request->input('type'));

        try {
            if ($type === ThinkerType::CUSTOM) {
                $thinker = $this->thinkerService->createCustomThinker($user, $request->validated());
            } else {
                $thinker = $this->thinkerService->createPredefinedThinker($user, $type);
            }

            return redirect()->route('thinkers.index')
                ->with('success', 'Thinker added successfully!');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Thinker $thinker)
    {
        $this->authorize('view', $thinker);

        return Inertia::render('Thinkers/Show', [
            'thinker' => $thinker,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateThinkerRequest $request, Thinker $thinker)
    {
        $this->authorize('update', $thinker);

        try {
            $this->thinkerService->updateThinker($thinker, $request->validated());

            return redirect()->route('thinkers.index')
                ->with('success', 'Thinker updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Toggle the active status of the thinker.
     */
    public function toggle(Thinker $thinker)
    {
        $this->authorize('update', $thinker);

        try {
            $this->thinkerService->toggleThinker($thinker);

            return redirect()->route('thinkers.index')
                ->with('success', 'Thinker status updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Thinker $thinker)
    {
        $this->authorize('delete', $thinker);

        try {
            $this->thinkerService->deleteThinker($thinker);

            return redirect()->route('thinkers.index')
                ->with('success', 'Thinker removed successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get predefined thinkers not yet added by the user.
     */
    public function available()
    {
        $user = auth()->user();
        $availableThinkers = $this->thinkerService->getPredefinedThinkers();

        return response()->json([
            'thinkers' => $availableThinkers,
        ]);
    }
}
