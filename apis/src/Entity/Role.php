<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\RoleRepository')]
#[ORM\Table(name: 'roles')]
class Role
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 32, unique: true)]
    private string $code;

    #[ORM\Column(type: 'string', length: 64)]
    private string $name;

    #[ORM\OneToMany(mappedBy: 'role', targetEntity: User::class)]
    private Collection $users;

    #[ORM\OneToMany(mappedBy: 'role', targetEntity: Invite::class)]
    private Collection $invites;

    public function __construct()
    {
        $this->users = new ArrayCollection();
        $this->invites = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }
    public function getCode(): string { return $this->code; }
    public function setCode(string $code): self { $this->code = $code; return $this; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }
    public function getUsers(): Collection { return $this->users; }
    public function getInvites(): Collection { return $this->invites; }
}
