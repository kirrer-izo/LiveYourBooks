<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateIntegrationSettingRequest;
use App\Models\IntegrationSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    /**
     * Display all integration settings.
     */
    public function index(): Response
    {
        $integrations = IntegrationSetting::orderBy('display_name')
            ->get()
            ->map->toFrontendArray();

        return Inertia::render('Admin/Integrations', [
            'integrations' => $integrations,
        ]);
    }

    /**
     * Update the specified integration configuration.
     */
    public function update(UpdateIntegrationSettingRequest $request, IntegrationSetting $integration): RedirectResponse
    {
        $integration->fill($request->validated());
        $integration->save();

        return redirect()->back()->with('success', 'Integration settings updated.');
    }
}

