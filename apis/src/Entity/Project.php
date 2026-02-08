<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ProjectRepository')]
#[ORM\Table(name: 'projects')]
#[ORM\UniqueConstraint(name: 'uk_projects_code', columns: ['tenant_id', 'code'])]
class Project
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class, inversedBy: 'projects')]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: Client::class, inversedBy: 'projects')]
    #[ORM\JoinColumn(name: 'client_id', referencedColumnName: 'id', nullable: true)]
    private ?Client $client = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $ownerUser = null;

    #[ORM\ManyToOne(targetEntity: ProjectStatus::class, inversedBy: 'projects')]
    #[ORM\JoinColumn(name: 'status_id', referencedColumnName: 'id')]
    private ProjectStatus $status;

    #[ORM\Column(type: 'string', length: 32)]
    private string $code;

    #[ORM\Column(type: 'string', length: 128)]
    private string $name;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $valueTotal = '0.00';

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $costPlanned = '0.00';

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2, nullable: true)]
    private ?string $costPlannedNF = null;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2, nullable: true)]
    private ?string $costPlannedOther = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $type = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $contractUrl = null;

    #[ORM\Column(type: 'string', length: 512, nullable: true)]
    private ?string $dreUrl = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTime $startDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTime $endDate = null;

    #[ORM\Column(type: 'decimal', precision: 6, scale: 4, nullable: true)]
    private ?string $indicatorOverridePct = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: ProjectUser::class, cascade: ['persist', 'remove'])]
    private Collection $users;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: Expense::class)]
    private Collection $expenses;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: Reimbursement::class)]
    private Collection $reimbursements;

    #[ORM\OneToMany(mappedBy: 'project', targetEntity: InvoiceItem::class)]
    private Collection $invoiceItems;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->users = new ArrayCollection();
        $this->expenses = new ArrayCollection();
        $this->reimbursements = new ArrayCollection();
        $this->invoiceItems = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getClient(): ?Client { return $this->client; }
    public function setClient(?Client $client): self { $this->client = $client; return $this; }
    public function getOwnerUser(): ?User { return $this->ownerUser; }
    public function setOwnerUser(?User $ownerUser): self { $this->ownerUser = $ownerUser; return $this; }
    public function getStatus(): ProjectStatus { return $this->status; }
    public function setStatus(ProjectStatus $status): self { $this->status = $status; return $this; }
    public function getCode(): string { return $this->code; }
    public function setCode(string $code): self { $this->code = $code; return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getValueTotal(): string { return $this->valueTotal; }
    public function setValueTotal(string $valueTotal): self { $this->valueTotal = $valueTotal; return $this; }
    public function getCostPlanned(): string { return $this->costPlanned; }
    public function setCostPlanned(string $costPlanned): self { $this->costPlanned = $costPlanned; return $this; }
    public function getCostPlannedNF(): ?string { return $this->costPlannedNF; }
    public function setCostPlannedNF(?string $costPlannedNF): self { $this->costPlannedNF = $costPlannedNF; return $this; }
    public function getCostPlannedOther(): ?string { return $this->costPlannedOther; }
    public function setCostPlannedOther(?string $costPlannedOther): self { $this->costPlannedOther = $costPlannedOther; return $this; }
    public function getType(): ?string { return $this->type; }
    public function setType(?string $type): self { $this->type = $type; return $this; }
    public function getContractUrl(): ?string { return $this->contractUrl; }
    public function setContractUrl(?string $contractUrl): self { $this->contractUrl = $contractUrl; return $this; }
    public function getDreUrl(): ?string { return $this->dreUrl; }
    public function setDreUrl(?string $dreUrl): self { $this->dreUrl = $dreUrl; return $this; }
    public function getStartDate(): ?\DateTime { return $this->startDate; }
    public function setStartDate(?\DateTime $startDate): self { $this->startDate = $startDate; return $this; }
    public function getEndDate(): ?\DateTime { return $this->endDate; }
    public function setEndDate(?\DateTime $endDate): self { $this->endDate = $endDate; return $this; }
    public function getIndicatorOverridePct(): ?string { return $this->indicatorOverridePct; }
    public function setIndicatorOverridePct(?string $indicatorOverridePct): self { $this->indicatorOverridePct = $indicatorOverridePct; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }
    public function getUsers(): Collection { return $this->users; }
    public function getExpenses(): Collection { return $this->expenses; }
    public function getReimbursements(): Collection { return $this->reimbursements; }
    public function getInvoiceItems(): Collection { return $this->invoiceItems; }
}
