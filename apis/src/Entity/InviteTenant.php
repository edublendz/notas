<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'invite_tenants')]
#[ORM\UniqueConstraint(name: 'uk_invite_tenants', columns: ['invite_id', 'tenant_id'])]
#[ORM\Index(name: 'idx_invite_tenants_invite', columns: ['invite_id'])]
#[ORM\Index(name: 'idx_invite_tenants_tenant', columns: ['tenant_id'])]
class InviteTenant
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Invite::class, inversedBy: 'inviteTenants')]
    #[ORM\JoinColumn(name: 'invite_id', referencedColumnName: 'id', nullable: false)]
    private Invite $invite;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id', nullable: false)]
    private Tenant $tenant;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getInvite(): Invite { return $this->invite; }
    public function setInvite(Invite $invite): self { $this->invite = $invite; return $this; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
