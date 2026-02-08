<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'invite_projects')]
#[ORM\UniqueConstraint(name: 'uk_invite_projects', columns: ['invite_id', 'project_id'])]
#[ORM\Index(name: 'idx_invite_projects_invite', columns: ['invite_id'])]
#[ORM\Index(name: 'idx_invite_projects_project', columns: ['project_id'])]
class InviteProject
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Invite::class, inversedBy: 'inviteProjects')]
    #[ORM\JoinColumn(name: 'invite_id', referencedColumnName: 'id', nullable: false)]
    private Invite $invite;

    #[ORM\ManyToOne(targetEntity: Project::class)]
    #[ORM\JoinColumn(name: 'project_id', referencedColumnName: 'id', nullable: false)]
    private Project $project;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getInvite(): Invite { return $this->invite; }
    public function setInvite(Invite $invite): self { $this->invite = $invite; return $this; }
    public function getProject(): Project { return $this->project; }
    public function setProject(Project $project): self { $this->project = $project; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
