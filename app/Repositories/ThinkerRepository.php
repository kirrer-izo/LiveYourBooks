<?php

namespace App\Repositories;

use App\Models\Thinker;
use App\Models\User;
use App\Enums\ThinkerType;
use Illuminate\Database\Eloquent\Collection;

class ThinkerRepository
{
    public function getUserThinkers(User $user): Collection
    {
        return Thinker::where('user_id', $user->id)
            ->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getActiveThinkers(User $user): Collection
    {
        return Thinker::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findByUserAndType(User $user, ThinkerType $type): ?Thinker
    {
        return Thinker::where('user_id', $user->id)
            ->where('type', $type)
            ->first();
    }

    public function findByIdAndUser(int $id, User $user): ?Thinker
    {
        return Thinker::where('id', $id)
            ->where('user_id', $user->id)
            ->first();
    }

    public function create(array $data): Thinker
    {
        return Thinker::create($data);
    }

    public function update(Thinker $thinker, array $data): Thinker
    {
        $thinker->update($data);
        return $thinker->fresh();
    }

    public function delete(Thinker $thinker): bool
    {
        return $thinker->delete();
    }

    public function getPredefinedThinkersNotAddedByUser(User $user): array
    {
        $userThinkerTypes = Thinker::where('user_id', $user->id)
            ->where('type', '!=', ThinkerType::CUSTOM)
            ->pluck('type')
            ->toArray();

        return array_filter(
            ThinkerType::getPredefinedThinkers(),
            fn($type) => !in_array($type, $userThinkerTypes)
        );
    }
}
