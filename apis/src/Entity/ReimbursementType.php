<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ReimbursementTypeRepository')]
#[ORM\Table(name: 'reimbursement_type')]
class ReimbursementType
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 32, unique: true)]
    private string $code;

    #[ORM\Column(type: 'string', length: 64)]
    private string $name;

    #[ORM\Column(type: 'boolean')]
    private bool $active = true;

    #[ORM\OneToMany(mappedBy: 'type', targetEntity: Reimbursement::class)]
    private Collection $reimbursements;

    public function __construct()
    {
        $this->reimbursements = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getCode(): string { return $this->code; }
    public function setCode(string $code): self { $this->code = $code; return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): self { $this->active = $active; return $this; }
    public function getReimbursements(): Collection { return $this->reimbursements; }
}
