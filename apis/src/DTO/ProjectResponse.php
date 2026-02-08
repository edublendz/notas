<?php

namespace App\DTO;

class ProjectResponse
{
    public int $id;
    public int $tenantId;
    public string $code;
    public string $name;
    public string $valueTotal;
    public string $costPlanned;
    public ?string $statusName = null;
    public ?string $clientName = null;
    public ?string $ownerName = null;
    public string $createdAt;

    /**
     * Este DTO seria populado automaticamente pelo Serializer
     * ou manualmente a partir de uma Entity Project
     */
}
