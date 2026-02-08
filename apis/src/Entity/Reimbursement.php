<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ReimbursementRepository')]
#[ORM\Table(name: 'reimbursements')]
#[ORM\Index(name: 'idx_rb_tenant_date', columns: ['tenant_id', 'date_buy'])]
#[ORM\Index(name: 'idx_rb_tenant_status', columns: ['tenant_id', 'status_id'])]
#[ORM\Index(name: 'idx_rb_project', columns: ['project_id'])]
#[ORM\Index(name: 'idx_rb_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_rb_type', columns: ['type_id'])]
class Reimbursement
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class, inversedBy: 'reimbursements')]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: Project::class, inversedBy: 'reimbursements')]
    #[ORM\JoinColumn(name: 'project_id', referencedColumnName: 'id', nullable: true)]
    private ?Project $project = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'reimbursements')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: ReimbursementStatus::class, inversedBy: 'reimbursements')]
    #[ORM\JoinColumn(name: 'status_id', referencedColumnName: 'id')]
    private ReimbursementStatus $status;

    #[ORM\ManyToOne(targetEntity: ReimbursementType::class, inversedBy: 'reimbursements')]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true)]
    private ?ReimbursementType $type = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $complement = null;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $value;

    #[ORM\Column(type: 'date')]
    private \DateTime $dateBuy;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $proofUrl = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getProject(): ?Project { return $this->project; }
    public function setProject(?Project $project): self { $this->project = $project; return $this; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): self { $this->user = $user; return $this; }
    public function getStatus(): ReimbursementStatus { return $this->status; }
    public function setStatus(ReimbursementStatus $status): self { $this->status = $status; return $this; }
    public function getType(): ?ReimbursementType { return $this->type; }
    public function setType(?ReimbursementType $type): self { $this->type = $type; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }
    public function getComplement(): ?string { return $this->complement; }
    public function setComplement(?string $complement): self { $this->complement = $complement; return $this; }
    public function getValue(): string { return $this->value; }
    public function setValue(string $value): self { $this->value = $value; return $this; }
    public function getDateBuy(): \DateTime { return $this->dateBuy; }
    public function setDateBuy(\DateTime $dateBuy): self { $this->dateBuy = $dateBuy; return $this; }
    public function getProofUrl(): ?string { return $this->proofUrl; }
    public function setProofUrl(?string $proofUrl): self { $this->proofUrl = $proofUrl; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
}
