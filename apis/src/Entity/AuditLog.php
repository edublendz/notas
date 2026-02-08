<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\AuditLogRepository')]
#[ORM\Table(name: 'audit_log')]
#[ORM\Index(name: 'idx_audit_tenant_date', columns: ['tenant_id', 'created_at'])]
#[ORM\Index(name: 'idx_audit_actor_date', columns: ['actor_user_id', 'created_at'])]
#[ORM\Index(name: 'idx_audit_entity', columns: ['entity_type', 'entity_id'])]
class AuditLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class, inversedBy: 'auditLogs')]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: true)]
    private ?Tenant $tenant = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'auditLogs')]
    #[ORM\JoinColumn(name: 'actor_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $actorUser = null;

    #[ORM\Column(type: 'string', length: 64)]
    private string $action;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $entityType = null;

    #[ORM\Column(type: 'bigint', nullable: true, options: ['unsigned' => true])]
    private ?int $entityId = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $meta = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): ?Tenant { return $this->tenant; }
    public function setTenant(?Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getActorUser(): ?User { return $this->actorUser; }
    public function setActorUser(?User $actorUser): self { $this->actorUser = $actorUser; return $this; }
    public function getAction(): string { return $this->action; }
    public function setAction(string $action): self { $this->action = $action; return $this; }
    public function getEntityType(): ?string { return $this->entityType; }
    public function setEntityType(?string $entityType): self { $this->entityType = $entityType; return $this; }
    public function getEntityId(): ?int { return $this->entityId; }
    public function setEntityId(?int $entityId): self { $this->entityId = $entityId; return $this; }
    public function getMeta(): ?string { return $this->meta; }
    public function setMeta(?string $meta): self { $this->meta = $meta; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
}
