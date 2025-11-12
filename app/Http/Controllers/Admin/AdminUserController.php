<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Display a paginated listing of users with filters.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        $search = (string) $request->string('search');
        $roleFilter = (string) $request->string('role');
        $statusFilter = (string) $request->string('status');

        if ($search !== '') {
            $query->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($roleFilter !== '') {
            $query->where('role', $roleFilter);
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $users = $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role instanceof UserRole ? $user->role->value : $user->role,
                'role_label' => $user->role instanceof UserRole ? $user->role->label() : ucfirst((string) $user->role),
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toAtomString(),
                'updated_at' => $user->updated_at?->toAtomString(),
            ]);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
            ],
            'roles' => UserRole::options(),
        ]);
    }

    /**
     * Store a newly created user account.
     */
    public function store(UserStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $data['password'] = Hash::make($data['password']);
        $data['role'] = $data['role'] ?? UserRole::User->value;
        $data['is_active'] = $data['is_active'] ?? true;

        User::create($data);

        return redirect()->back()->with('success', 'User account created successfully.');
    }

    /**
     * Update the specified user account.
     */
    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if ($user->is($request->user()) && array_key_exists('is_active', $data) && ! $data['is_active']) {
            throw ValidationException::withMessages([
                'is_active' => 'You cannot deactivate your own account.',
            ]);
        }

        if (isset($data['password']) && $data['password'] !== '') {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'User account updated successfully.');
    }

    /**
     * Deactivate or remove the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        if ($request->boolean('force_delete')) {
            $user->delete();
            return redirect()->back()->with('success', 'User account deleted.');
        }

        $user->update(['is_active' => false]);

        return redirect()->back()->with('success', 'User account deactivated.');
    }
}
