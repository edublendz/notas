<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\InvoiceRepository')]
#[ORM\Table(name: 'invoices')]
#[ORM\UniqueConstraint(name: 'uk_invoices_tenant_id', columns: ['tenant_id', 'id'])]
#[ORM\UniqueConstraint(name: 'uk_invoices_code', columns: ['tenant_id', 'code'])]
#[ORM\Index(name: 'idx_nf_tenant_month', columns: ['tenant_id', 'month_issue'])]
#[ORM\Index(name: 'idx_nf_tenant_status', columns: ['tenant_id', 'status_id'])]
#[ORM\Index(name: 'idx_nf_issuer', columns: ['issuer_user_id'])]
class Invoice
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true, unique: true)]
    private ?string $code = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class, inversedBy: 'invoices')]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'issuedInvoices')]
    #[ORM\JoinColumn(name: 'issuer_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $issuerUser = null;

    #[ORM\ManyToOne(targetEntity: InvoiceStatus::class, inversedBy: 'invoices')]
    #[ORM\JoinColumn(name: 'status_id', referencedColumnName: 'id')]
    private InvoiceStatus $status;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $total = '0.00';

    #[ORM\Column(type: 'boolean')]
    private bool $totalReadonly = false;

    #[ORM\Column(type: 'date')]
    private \DateTime $monthCompetency;

    #[ORM\Column(type: 'date')]
    private \DateTime $monthIssue;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $fileName = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $fileUrl = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    #[ORM\OneToMany(mappedBy: 'invoice', targetEntity: InvoiceItem::class, cascade: ['persist', 'remove'])]
    private Collection $items;

    #[ORM\OneToMany(mappedBy: 'invoice', targetEntity: InvoiceExpense::class, cascade: ['persist', 'remove'])]
    private Collection $expenses;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
        $this->items = new ArrayCollection();
        $this->expenses = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getCode(): ?string { return $this->code; }
    public function setCode(?string $code): self { $this->code = $code; return $this; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getIssuerUser(): ?User { return $this->issuerUser; }
    public function setIssuerUser(?User $issuerUser): self { $this->issuerUser = $issuerUser; return $this; }
    public function getStatus(): InvoiceStatus { return $this->status; }
    public function setStatus(InvoiceStatus $status): self { $this->status = $status; return $this; }
    public function getTotal(): string { return $this->total; }
    public function setTotal(string $total): self { $this->total = $total; return $this; }
    public function isTotalReadonly(): bool { return $this->totalReadonly; }
    public function setTotalReadonly(bool $totalReadonly): self { $this->totalReadonly = $totalReadonly; return $this; }
    public function getMonthCompetency(): \DateTime { return $this->monthCompetency; }
    public function setMonthCompetency(\DateTime $monthCompetency): self { $this->monthCompetency = $monthCompetency; return $this; }
    public function getMonthIssue(): \DateTime { return $this->monthIssue; }
    public function setMonthIssue(\DateTime $monthIssue): self { $this->monthIssue = $monthIssue; return $this; }
    public function getFileName(): ?string { return $this->fileName; }
    public function setFileName(?string $fileName): self { $this->fileName = $fileName; return $this; }
    public function getFileUrl(): ?string { return $this->fileUrl; }
    public function setFileUrl(?string $fileUrl): self { $this->fileUrl = $fileUrl; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }
    public function getItems(): Collection { return $this->items; }
    public function getExpenses(): Collection { return $this->expenses; }
}
