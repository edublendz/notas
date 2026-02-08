<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\InvoiceItemRepository')]
#[ORM\Table(name: 'invoice_items')]
#[ORM\Index(name: 'idx_it_invoice', columns: ['invoice_id'])]
#[ORM\Index(name: 'idx_it_project', columns: ['project_id'])]
#[ORM\Index(name: 'idx_invoice_items_tenant_invoice', columns: ['tenant_id', 'invoice_id'])]
#[ORM\Index(name: 'idx_invoice_items_tenant_project', columns: ['tenant_id', 'project_id'])]
class InvoiceItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'tenant_id', referencedColumnName: 'id')]
    private Tenant $tenant;

    #[ORM\ManyToOne(targetEntity: Invoice::class, inversedBy: 'items')]
    #[ORM\JoinColumn(name: 'invoice_id', referencedColumnName: 'id')]
    private Invoice $invoice;

    #[ORM\ManyToOne(targetEntity: Project::class, inversedBy: 'invoiceItems')]
    #[ORM\JoinColumn(name: 'project_id', referencedColumnName: 'id', nullable: true)]
    private ?Project $project = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $description;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    private string $value;

    public function getId(): ?int { return $this->id; }
    public function getTenant(): Tenant { return $this->tenant; }
    public function setTenant(Tenant $tenant): self { $this->tenant = $tenant; return $this; }
    public function getInvoice(): Invoice { return $this->invoice; }
    public function setInvoice(Invoice $invoice): self { $this->invoice = $invoice; return $this; }
    public function getProject(): ?Project { return $this->project; }
    public function setProject(?Project $project): self { $this->project = $project; return $this; }
    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): self { $this->description = $description; return $this; }
    public function getValue(): string { return $this->value; }
    public function setValue(string $value): self { $this->value = $value; return $this; }
}
