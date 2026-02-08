<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\InviteRepository')]
#[ORM\Table(name: 'invites')]
#[ORM\UniqueConstraint(name: 'uk_invites_email', columns: ['tenant_id', 'email'])]
#[ORM\UniqueConstraint(name: 'uk_invites_token_hash', columns: ['token_hash'])]
#[ORM\Index(name: 'idx_invites_tenant', columns: ['tenant_id'])]
#[ORM\Index(name: 'idx_invites_role', columns: ['role_id'])]
class Invite
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\Column(type: 'string', length: 128)]
    private string $email;

    #[ORM\ManyToOne(targetEntity: Role::class, inversedBy: 'invites')]
    #[ORM\JoinColumn(name: 'role_id', referencedColumnName: 'id', nullable: false)]
    private ?Role $role = null;

    #[ORM\OneToMany(targetEntity: InviteClient::class, mappedBy: 'invite', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $inviteClients;

    #[ORM\OneToMany(targetEntity: InviteProject::class, mappedBy: 'invite', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $inviteProjects;

    #[ORM\Column(type: 'string', length: 255)]
    private string $tokenHash;

    #[ORM\Column(type: 'datetime')]
    private \DateTime $expiresAt;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTime $acceptedAt = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->inviteClients = new ArrayCollection();
        $this->inviteProjects = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }
    public function getRole(): ?Role { return $this->role; }
    public function setRole(Role $role): self { $this->role = $role; return $this; }
    
    /** @return Collection<int, InviteClient> */
    public function getInviteClients(): Collection { return $this->inviteClients; }
    public function addInviteClient(InviteClient $inviteClient): self { 
        if (!$this->inviteClients->contains($inviteClient)) {
            $this->inviteClients->add($inviteClient);
            $inviteClient->setInvite($this);
        }
        return $this;
    }
    
    /** @return Collection<int, InviteProject> */
    public function getInviteProjects(): Collection { return $this->inviteProjects; }
    public function addInviteProject(InviteProject $inviteProject): self { 
        if (!$this->inviteProjects->contains($inviteProject)) {
            $this->inviteProjects->add($inviteProject);
            $inviteProject->setInvite($this);
        }
        return $this;
    }
    
    public function getTokenHash(): string { return $this->tokenHash; }
    public function setTokenHash(string $tokenHash): self { $this->tokenHash = $tokenHash; return $this; }
    public function getExpiresAt(): \DateTime { return $this->expiresAt; }
    public function setExpiresAt(\DateTime $expiresAt): self { $this->expiresAt = $expiresAt; return $this; }
    public function getAcceptedAt(): ?\DateTime { return $this->acceptedAt; }
    public function setAcceptedAt(?\DateTime $acceptedAt): self { $this->acceptedAt = $acceptedAt; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
}
