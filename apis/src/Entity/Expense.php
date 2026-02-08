<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ExpenseRepository')]
#[ORM\Table(name: 'expenses')]
#[ORM\UniqueConstraint(name: 'uk_expenses_tenant_id', columns: ['tenant_id', 'id'])]
#[ORM\Index(name: 'idx_exp_tenant_date', columns: ['tenant_id', 'date_buy'])]
#[ORM\Index(name: 'idx_exp_tenant_status', columns: ['tenant_id', 'status_id'])]
#[ORM\Index(name: 'idx_exp_project', columns: ['project_id'])]
#[ORM\Index(name: 'idx_exp_service', columns: ['service_id'])]
#[ORM\Index(name: 'idx_exp_requester', columns: ['requester_user_id'])]
class Expense
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class, inversedBy: 'expenses')]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: Project::class, inversedBy: 'expenses')]
    #[ORM\JoinColumn(name: 'project_id', referencedColumnName: 'id', nullable: true)]
    private ?Project $project = null;

    #[ORM\ManyToOne(targetEntity: Service::class, inversedBy: 'expenses')]
    #[ORM\JoinColumn(name: 'service_id', referencedColumnName: 'id', nullable: true)]
    private ?Service $service = null;

    #[ORM\ManyToOne(targetEntity: ExpenseStatus::class, inversedBy: 'expenses')]
    #[ORM\JoinColumn(name: 'status_id', referencedColumnName: 'id')]
    private ExpenseStatus $status;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'requestedExpenses')]
    #[ORM\JoinColumn(name: 'requester_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $requesterUser = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $complement = null;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $value;

    #[ORM\Column(type: 'date')]
    private \DateTime $dateBuy;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(mappedBy: 'expense', targetEntity: InvoiceExpense::class, cascade: ['persist', 'remove'])]
    private Collection $invoiceExpenses;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->invoiceExpenses = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getProject(): ?Project { return $this->project; }
    public function setProject(?Project $project): self { $this->project = $project; return $this; }
    public function getService(): ?Service { return $this->service; }
    public function setService(?Service $service): self { $this->service = $service; return $this; }
    public function getStatus(): ExpenseStatus { return $this->status; }
    public function setStatus(ExpenseStatus $status): self { $this->status = $status; return $this; }
    public function getRequesterUser(): ?User { return $this->requesterUser; }
    public function setRequesterUser(?User $requesterUser): self { $this->requesterUser = $requesterUser; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }
    public function getComplement(): ?string { return $this->complement; }
    public function setComplement(?string $complement): self { $this->complement = $complement; return $this; }
    public function getValue(): string { return $this->value; }
    public function setValue(string $value): self { $this->value = $value; return $this; }
    public function getDateBuy(): \DateTime { return $this->dateBuy; }
    public function setDateBuy(\DateTime $dateBuy): self { $this->dateBuy = $dateBuy; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }
    public function getInvoiceExpenses(): Collection { return $this->invoiceExpenses; }
}
