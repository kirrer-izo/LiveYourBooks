<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IntegrationSettingRequest;
use App\Models\IntegrationSetting;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminIntegrationController extends Controller
{
    /**
     * Display the configured integration services.
     */
    public function index(): Response
    {
        $integrations = IntegrationSetting::orderBy('display_name')
            ->get()
            ->map(fn (IntegrationSetting $integration) => $integration->toFrontendArray());

        return Inertia::render('Admin/Integrations', [
            'integrations' => $integrations,
        ]);
    }

    /**
     * Store a new integration configuration.
     */
    public function store(IntegrationSettingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (! empty($data['last_checked_at'])) {
            $data['last_checked_at'] = CarbonImmutable::parse($data['last_checked_at']);
        }

        IntegrationSetting::create($data);

        return redirect()->back()->with('success', 'Integration created successfully.');
    }

    /**
     * Update the specified integration configuration.
     */
    public function update(IntegrationSettingRequest $request, IntegrationSetting $integrationSetting): RedirectResponse
    {
        $data = $request->validated();

        if (! empty($data['last_checked_at'])) {
            $data['last_checked_at'] = CarbonImmutable::parse($data['last_checked_at']);
        }

        $integrationSetting->update($data);

        return redirect()->back()->with('success', 'Integration updated successfully.');
    }

    /**
     * Remove the specified integration configuration.
     */
    public function destroy(IntegrationSetting $integrationSetting): RedirectResponse
    {
        $integrationSetting->delete();

        return redirect()->back()->with('success', 'Integration removed.');
    }
}

