<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;

class AuthUser
{
    private ?User $user = null;
    private ?array $claims = null;

    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function setClaimsFromRequest(Request $request): void
    {
        $this->claims = $request->attributes->get('user_claims');
        
        if ($this->claims && isset($this->claims['uid'])) {
            $this->user = $this->userRepository->find($this->claims['uid']);
        }
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function getClaims(): ?array
    {
        return $this->claims;
    }

    public function getId(): ?int
    {
        return $this->claims['uid'] ?? null;
    }

    public function getEmail(): ?string
    {
        return $this->claims['email'] ?? null;
    }

    public function getRole(): ?string
    {
        return $this->claims['role'] ?? null;
    }

    public function isMaster(): bool
    {
        return $this->getRole() === 'MASTER';
    }

    public function isOperator(): bool
    {
        return $this->getRole() === 'OPERADOR';
    }

    public function isAuthenticated(): bool
    {
        return $this->user !== null;
    }
}
