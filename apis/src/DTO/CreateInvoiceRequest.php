<?php

namespace App\DTO;

class CreateInvoiceRequest
{
    public int $tenantId;
    public int $statusId;
    public string $monthCompetency;
    public string $monthIssue;
    public ?string $code = null;
    public string $total = '0.00';
    public ?int $issuerUserId = null;
    public ?string $fileName = null;
    public ?string $fileUrl = null;

    public static function fromRequest(array $data): self
    {
        $dto = new self();
        $dto->tenantId = $data['tenantId'] ?? 0;
        $dto->statusId = $data['statusId'] ?? 0;
        $dto->monthCompetency = $data['monthCompetency'] ?? date('Y-m-01');
        $dto->monthIssue = $data['monthIssue'] ?? date('Y-m-01');
        $dto->code = $data['code'] ?? null;
        $dto->total = (string) ($data['total'] ?? '0.00');
        $dto->issuerUserId = $data['issuerUserId'] ?? null;
        $dto->fileName = $data['fileName'] ?? null;
        $dto->fileUrl = $data['fileUrl'] ?? null;
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
        if (empty($this->monthCompetency)) {
            $errors['monthCompetency'] = 'Mês de competência é obrigatório';
        }
        if (empty($this->monthIssue)) {
            $errors['monthIssue'] = 'Mês de emissão é obrigatório';
        }
        return $errors;
    }
}
