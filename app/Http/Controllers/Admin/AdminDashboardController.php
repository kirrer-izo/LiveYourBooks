<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookCatalogEntry;
use App\Models\IntegrationSetting;
use App\Models\Journal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display key platform metrics for administrators.
     */
    public function index(): Response
    {
        $stats = [
            'users' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'admins' => User::where('role', UserRole::Admin->value)->count(),
            ],
            'content' => [
                'books' => Book::count(),
                'journals' => Journal::count(),
                'tasks' => Task::count(),
                'catalog_entries' => BookCatalogEntry::count(),
            ],
            'integrations' => [
                'total' => IntegrationSetting::count(),
                'active' => IntegrationSetting::where('is_active', true)->count(),
            ],
        ];

        $recentUsers = User::orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        $featuredCatalog = BookCatalogEntry::where('is_featured', true)
            ->orderBy('title')
            ->limit(5)
            ->get(['id', 'title', 'author', 'genre', 'life_area']);

        $integrations = IntegrationSetting::orderBy('display_name')
            ->get()
            ->map(fn (IntegrationSetting $integration) => $integration->toFrontendArray());

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'featuredCatalog' => $featuredCatalog,
            'integrations' => $integrations,
            'roles' => UserRole::options(),
        ]);
    }
}

