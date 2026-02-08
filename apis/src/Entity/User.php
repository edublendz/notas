<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\UserRepository')]
#[ORM\Table(name: 'users')]
#[ORM\UniqueConstraint(name: 'uk_users_email', columns: ['email'])]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 128)]
    private string $name;

    #[ORM\Column(type: 'string', length: 128, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $passwordHash;

    #[ORM\ManyToOne(targetEntity: Role::class, inversedBy: 'users')]
    #[ORM\JoinColumn(name: 'role_id', referencedColumnName: 'id')]
    private Role $role;

    #[ORM\ManyToOne(targetEntity: UserStatus::class, inversedBy: 'users')]
    #[ORM\JoinColumn(name: 'status_id', referencedColumnName: 'id')]
    private UserStatus $status;

    #[ORM\Column(type: 'boolean')]
    private bool $active = true;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserTenant::class, cascade: ['persist', 'remove'])]
    private Collection $tenants;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: ProjectUser::class, cascade: ['persist', 'remove'])]
    private Collection $projects;

    #[ORM\OneToMany(mappedBy: 'requesterUser', targetEntity: Expense::class)]
    private Collection $requestedExpenses;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Reimbursement::class)]
    private Collection $reimbursements;

    #[ORM\OneToMany(mappedBy: 'issuerUser', targetEntity: Invoice::class)]
    private Collection $issuedInvoices;

    #[ORM\OneToMany(mappedBy: 'actorUser', targetEntity: AuditLog::class)]
    private Collection $auditLogs;

    #[ORM\OneToOne(mappedBy: 'user', targetEntity: UserPreference::class, cascade: ['persist', 'remove'])]
    private ?UserPreference $preferences = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->tenants = new ArrayCollection();
        $this->projects = new ArrayCollection();
        $this->requestedExpenses = new ArrayCollection();
        $this->reimbursements = new ArrayCollection();
        $this->issuedInvoices = new ArrayCollection();
        $this->auditLogs = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): self { $this->email = $email; return $this; }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function setPasswordHash(string $passwordHash): self { $this->passwordHash = $passwordHash; return $this; }
    public function getRole(): Role { return $this->role; }
    public function setRole(Role $role): self { $this->role = $role; return $this; }
    public function getStatus(): UserStatus { return $this->status; }
    public function setStatus(UserStatus $status): self { $this->status = $status; return $this; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): self { $this->active = $active; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }
    public function getTenants(): Collection { return $this->tenants; }
    public function getProjects(): Collection { return $this->projects; }
    public function getRequestedExpenses(): Collection { return $this->requestedExpenses; }
    public function getReimbursements(): Collection { return $this->reimbursements; }
    public function getIssuedInvoices(): Collection { return $this->issuedInvoices; }
    public function getAuditLogs(): Collection { return $this->auditLogs; }
    public function getPreferences(): ?UserPreference { return $this->preferences; }
    public function setPreferences(?UserPreference $preferences): self { $this->preferences = $preferences; return $this; }
}
