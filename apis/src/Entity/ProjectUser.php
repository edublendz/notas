<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: 'App\Repository\ProjectUserRepository')]
#[ORM\Table(name: 'project_users')]
#[ORM\UniqueConstraint(name: 'uk_project_users', columns: ['project_id', 'user_id'])]
class ProjectUser
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Project::class, inversedBy: 'users')]
    #[ORM\JoinColumn(name: 'project_id', referencedColumnName: 'id')]
    private Project $project;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'projects')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private User $user;

    public function getProject(): Project { return $this->project; }
    public function setProject(Project $project): self { $this->project = $project; return $this; }
    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
}
