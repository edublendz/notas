<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\SaleRepository')]
#[ORM\Table(name: 'sales')]
#[ORM\Index(name: 'idx_sales_tenant_date', columns: ['tenant_id', 'created_at'])]
#[ORM\Index(name: 'idx_sales_client', columns: ['client_id'])]
#[ORM\Index(name: 'idx_sales_type', columns: ['type_id'])]
#[ORM\Index(name: 'idx_sales_created_by', columns: ['created_by'])]
class Sale
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: Client::class)]
    #[ORM\JoinColumn(name: 'client_id', referencedColumnName: 'id', nullable: true)]
    private ?Client $client = null;

    #[ORM\ManyToOne(targetEntity: SaleType::class, inversedBy: 'sales')]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id')]
    private SaleType $type;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $valueTotal;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $plannedCost;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'id', nullable: true)]
    private ?User $createdBy = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getClient(): ?Client { return $this->client; }
    public function setClient(?Client $client): self { $this->client = $client; return $this; }
    public function getType(): SaleType { return $this->type; }
    public function setType(SaleType $type): self { $this->type = $type; return $this; }
    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }
    public function getValueTotal(): string { return $this->valueTotal; }
    public function setValueTotal(string $valueTotal): self { $this->valueTotal = $valueTotal; return $this; }
    public function getPlannedCost(): string { return $this->plannedCost; }
    public function setPlannedCost(string $plannedCost): self { $this->plannedCost = $plannedCost; return $this; }
    public function getCreatedBy(): ?User { return $this->createdBy; }
    public function setCreatedBy(?User $createdBy): self { $this->createdBy = $createdBy; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
}
