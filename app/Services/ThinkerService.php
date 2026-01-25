<?php

namespace App\Services;

use App\Enums\ThinkerType;
use App\Models\Thinker;
use App\Models\User;
use App\Repositories\ThinkerRepository;

class ThinkerService
{
    public function __construct(
        private ThinkerRepository $thinkerRepository
    ) {}

    public function getPredefinedThinkers(): array
    {
        return ThinkerType::getPredefinedThinkers();
    }

    public function getUserThinkers(User $user): array
    {
        return $this->thinkerRepository->getUserThinkers($user);
    }

    public function createPredefinedThinker(User $user, ThinkerType $type): Thinker
    {
        if ($type === ThinkerType::CUSTOM) {
            throw new \InvalidArgumentException('Cannot create predefined thinker with CUSTOM type');
        }

        // Check if user already has this thinker
        $existingThinker = $this->thinkerRepository->findByUserAndType($user, $type);
        if ($existingThinker) {
            throw new \InvalidArgumentException('User already has this thinker');
        }

        return $this->thinkerRepository->create([
            'user_id' => $user->id,
            'type' => $type,
            'is_active' => true,
        ]);
    }

    public function createCustomThinker(User $user, array $data): Thinker
    {
        $data['user_id'] = $user->id;
        $data['type'] = ThinkerType::CUSTOM;
        $data['is_active'] = true;

        return $this->thinkerRepository->create($data);
    }

    public function updateThinker(Thinker $thinker, array $data): Thinker
    {
        return $this->thinkerRepository->update($thinker, $data);
    }

    public function toggleThinker(Thinker $thinker): Thinker
    {
        return $this->thinkerRepository->update($thinker, [
            'is_active' => ! $thinker->is_active,
        ]);
    }

    public function deleteThinker(Thinker $thinker): bool
    {
        return $this->thinkerRepository->delete($thinker);
    }

    public function getActiveThinkersForAdvice(User $user): array
    {
        return $this->thinkerRepository->getActiveThinkers($user);
    }
}
