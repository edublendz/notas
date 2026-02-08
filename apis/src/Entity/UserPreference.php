<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Entity\Tenant;

#[ORM\Entity(repositoryClass: 'App\Repository\UserPreferenceRepository')]
#[ORM\Table(name: 'user_preferences')]
class UserPreference
{
    #[ORM\Id]
    #[ORM\OneToOne(targetEntity: User::class, inversedBy: 'preferences')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private User $user;

    #[ORM\Column(type: 'boolean')]
    private bool $drawerFull = false;

    #[ORM\Column(type: 'string', length: 7, nullable: true)]
    private ?string $currentMonth = null;

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $currentView = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP', 'onUpdate' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\ManyToOne(targetEntity: Tenant::class)]
    #[ORM\JoinColumn(name: 'selected_tenant_id', referencedColumnName: 'id', nullable: true)]
    private ?Tenant $selectedTenant = null;

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
    public function isDrawerFull(): bool { return $this->drawerFull; }
    public function setDrawerFull(bool $drawerFull): self { $this->drawerFull = $drawerFull; return $this; }
    public function getCurrentMonth(): ?string { return $this->currentMonth; }
    public function setCurrentMonth(?string $currentMonth): self { $this->currentMonth = $currentMonth; return $this; }
    public function getCurrentView(): ?string { return $this->currentView; }
    public function setCurrentView(?string $currentView): self { $this->currentView = $currentView; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
    public function setCreatedAt(\DateTime $createdAt): self { $this->createdAt = $createdAt; return $this; }
    public function getUpdatedAt(): \DateTime { return $this->updatedAt; }
    public function setUpdatedAt(\DateTime $updatedAt): self { $this->updatedAt = $updatedAt; return $this; }

    public function getSelectedTenant(): ?Tenant { return $this->selectedTenant; }
    public function setSelectedTenant(?Tenant $tenant): self { $this->selectedTenant = $tenant; return $this; }
}
