<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\SessionRepository')]
#[ORM\Table(name: 'sessions')]
#[ORM\Index(name: 'idx_sessions_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_sessions_tenant', columns: ['tenant_id'])]
#[ORM\Index(name: 'idx_sessions_expires', columns: ['expires_at'])]
class Session
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: true)]
    private ?Tenant $tenant = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $refreshTokenHash;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $expiresAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTime $revokedAt = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
    public function getTenant(): ?Tenant { return $this->tenant; }
    public function setTenant(?Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getRefreshTokenHash(): string { return $this->refreshTokenHash; }
    public function setRefreshTokenHash(string $refreshTokenHash): self { $this->refreshTokenHash = $refreshTokenHash; return $this; }
    public function getExpiresAt(): \DateTime { return $this->expiresAt; }
    public function setExpiresAt(\DateTime $expiresAt): self { $this->expiresAt = $expiresAt; return $this; }
    public function getRevokedAt(): ?\DateTime { return $this->revokedAt; }
    public function setRevokedAt(?\DateTime $revokedAt): self { $this->revokedAt = $revokedAt; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
}
