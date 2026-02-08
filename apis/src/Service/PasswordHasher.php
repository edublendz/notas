<?php

namespace App\Service;

use App\Entity\User;

/**
 * Serviço para hash seguro de senhas usando bcrypt com compatibilidade legacy SHA256.
 */
class PasswordHasher
{
    private int $cost = 13;

    public function __construct()
    {
    }

    /**
     * Hash de uma senha em plaintext usando bcrypt
     */
    public function hash(User $user, string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => $this->cost]);
    }

    /**
     * Verifica se a senha corresponde ao hash. Aceita hashes bcrypt e legacy SHA256.
     */
    public function verify(User $user, string $plainPassword): bool
    {
        $stored = $user->getPasswordHash();
        if (!$stored) {
            return false;
        }

        if (password_verify($plainPassword, $stored)) {
            return true;
        }

        // legacy: check SHA256 hex digest
        if (hash('sha256', $plainPassword) === $stored) {
            return true;
        }

        return false;
    }

    /**
     * Verifica se a senha precisa ser re-hashada (upgrade de algoritmo)
     */
    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => $this->cost]);
    }
}
