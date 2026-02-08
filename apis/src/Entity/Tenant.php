<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\TenantRepository')]
#[ORM\Table(name: 'tenants')]
class Tenant
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 32, unique: true)]
    private string $key;

    #[ORM\Column(type: 'string', length: 128)]
    private string $name;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $doc = null;

    #[ORM\Column(type: 'decimal', precision: 6, scale: 4)]
    private string $indicatorPct = '0.0000';

    #[ORM\Column(type: 'boolean')]
    private bool $requireProjectLink = false;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: User::class, cascade: ['persist', 'remove'])]
    private Collection $users;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Client::class, cascade: ['persist', 'remove'])]
    private Collection $clients;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Project::class, cascade: ['persist', 'remove'])]
    private Collection $projects;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Service::class, cascade: ['persist', 'remove'])]
    private Collection $services;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Expense::class, cascade: ['persist', 'remove'])]
    private Collection $expenses;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Reimbursement::class, cascade: ['persist', 'remove'])]
    private Collection $reimbursements;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: Invoice::class, cascade: ['persist', 'remove'])]
    private Collection $invoices;

    #[ORM\OneToMany(mappedBy: 'tenant', targetEntity: AuditLog::class, cascade: ['persist', 'remove'])]
    private Collection $auditLogs;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->users = new ArrayCollection();
        $this->clients = new ArrayCollection();
        $this->projects = new ArrayCollection();
        $this->services = new ArrayCollection();
        $this->expenses = new ArrayCollection();
        $this->reimbursements = new ArrayCollection();
        $this->invoices = new ArrayCollection();
        $this->auditLogs = new ArrayCollection();
    }

    // Getters & Setters
    public function getId(): ?int { return $this->id; }
    public function getKey(): string { return $this->key; }
    public function setKey(string $key): self { $this->key = $key; return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getDoc(): ?string { return $this->doc; }
    public function setDoc(?string $doc): self { $this->doc = $doc; return $this; }
    public function getIndicatorPct(): string { return $this->indicatorPct; }
    public function setIndicatorPct(string $indicatorPct): self { $this->indicatorPct = $indicatorPct; return $this; }
    public function isRequireProjectLink(): bool { return $this->requireProjectLink; }
    public function setRequireProjectLink(bool $requireProjectLink): self { $this->requireProjectLink = $requireProjectLink; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }
    public function getUsers(): Collection { return $this->users; }
    public function getClients(): Collection { return $this->clients; }
    public function getProjects(): Collection { return $this->projects; }
    public function getServices(): Collection { return $this->services; }
    public function getExpenses(): Collection { return $this->expenses; }
    public function getReimbursements(): Collection { return $this->reimbursements; }
    public function getInvoices(): Collection { return $this->invoices; }
    public function getAuditLogs(): Collection { return $this->auditLogs; }
}
