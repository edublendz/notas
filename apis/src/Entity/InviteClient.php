<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'invite_clients')]
#[ORM\UniqueConstraint(name: 'uk_invite_clients', columns: ['invite_id', 'client_id'])]
#[ORM\Index(name: 'idx_invite_clients_invite', columns: ['invite_id'])]
#[ORM\Index(name: 'idx_invite_clients_client', columns: ['client_id'])]
class InviteClient
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(type: 'bigint', options: ['unsigned' => true])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Invite::class, inversedBy: 'inviteClients')]
    #[ORM\JoinColumn(name: 'invite_id', referencedColumnName: 'id', nullable: false)]
    private Invite $invite;

    #[ORM\ManyToOne(targetEntity: Client::class)]
    #[ORM\JoinColumn(name: 'client_id', referencedColumnName: 'id', nullable: false)]
    private Client $client;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getInvite(): Invite { return $this->invite; }
    public function setInvite(Invite $invite): self { $this->invite = $invite; return $this; }
    public function getClient(): Client { return $this->client; }
    public function setClient(Client $client): self { $this->client = $client; return $this; }
    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
