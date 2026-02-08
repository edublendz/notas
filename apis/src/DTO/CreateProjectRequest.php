<?php

namespace App\DTO;

class CreateProjectRequest
{
    public int $tenantId;
    public string $code;
    public string $name;
    public int $statusId;
    public string $valueTotal = '0.00';
    public string $costPlanned = '0.00';
    public ?int $clientId = null;
    public ?int $ownerUserId = null;

    public static function fromRequest(array $data): self
    {
        $dto = new self();
        $dto->tenantId = $data['tenantId'] ?? 0;
        $dto->code = $data['code'] ?? '';
        $dto->name = $data['name'] ?? '';
        $dto->statusId = $data['statusId'] ?? 0;
        $dto->valueTotal = (string) ($data['valueTotal'] ?? '0.00');
        $dto->costPlanned = (string) ($data['costPlanned'] ?? '0.00');
        $dto->clientId = $data['clientId'] ?? null;
        $dto->ownerUserId = $data['ownerUserId'] ?? null;
        return $dto;
    }

    public function validate(): array
    {
        $errors = [];
        if (empty($this->name)) {
            $errors['name'] = 'Nome é obrigatório';
        }
        if (empty($this->code)) {
            $errors['code'] = 'Código é obrigatório';
        }
        if ($this->tenantId <= 0) {
            $errors['tenantId'] = 'Tenant é obrigatório';
        }
        if ($this->statusId <= 0) {
            $errors['statusId'] = 'Status é obrigatório';
        }
        return $errors;
    }
}
