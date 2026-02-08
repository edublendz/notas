<?php

namespace App\DTO;

class CreateExpenseRequest
{
    public int $tenantId;
    public int $statusId;
    public string $value;
    public string $dateBuy;
    public ?int $projectId = null;
    public ?int $serviceId = null;
    public ?int $requesterUserId = null;
    public ?string $description = null;
    public ?string $complement = null;

    public static function fromRequest(array $data): self
    {
        $dto = new self();
        $dto->tenantId = $data['tenantId'] ?? 0;
        $dto->statusId = $data['statusId'] ?? 0;
        $dto->value = (string) ($data['value'] ?? '0.00');
        $dto->dateBuy = $data['dateBuy'] ?? date('Y-m-d');
        $dto->projectId = $data['projectId'] ?? null;
        $dto->serviceId = $data['serviceId'] ?? null;
        $dto->requesterUserId = $data['requesterUserId'] ?? null;
        $dto->description = $data['description'] ?? null;
        $dto->complement = $data['complement'] ?? null;
        return $dto;
    }

    public function validate(): array
    {
        $errors = [];
        if ($this->tenantId <= 0) {
            $errors['tenantId'] = 'Tenant é obrigatório';
        }
        if ($this->statusId <= 0) {
            $errors['statusId'] = 'Status é obrigatório';
        }
        if (empty($this->value) || (float) $this->value <= 0) {
            $errors['value'] = 'Valor é obrigatório e deve ser maior que zero';
        }
        if (empty($this->dateBuy)) {
            $errors['dateBuy'] = 'Data de compra é obrigatória';
        }
        return $errors;
    }
}
