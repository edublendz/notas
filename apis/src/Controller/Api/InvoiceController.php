<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Expense;
use App\Entity\Invoice;
use App\Entity\InvoiceExpense;
use App\Entity\InvoiceItem;
use App\Entity\InvoiceStatus;
use App\Entity\Project;
use App\Entity\Tenant;
use App\Entity\User;
use App\Service\AuditService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/invoices', name: 'api_invoices_')]
class InvoiceController extends BaseController
{
    private AuditService $auditService;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        AuditService $auditService
    ) {
        parent::__construct($entityManager, $serializer);
        $this->auditService = $auditService;
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não selecionado para o usuário', Response::HTTP_BAD_REQUEST);
        }
        $tenantId = $tenant->getId();
        $statusId = $request->query->getInt('statusId', 0);
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, $request->query->getInt('limit', 20));

        $repo = $this->entityManager->getRepository(Invoice::class);
        
        $qb = $repo->createQueryBuilder('i')
            ->where('i.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('i.monthIssue', 'DESC');

        if ($statusId > 0) {
            $qb->andWhere('i.status = :statusId')
                ->setParameter('statusId', $statusId);
        }

        $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($qb->getQuery()->getResult());

        $invoices = $qb->getQuery()->getResult();
        $data = array_map(fn($i) => $this->serializeInvoice($i, false), $invoices);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        return $this->jsonResponse($this->serializeInvoice($invoice, true));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        $required = ['statusId', 'monthCompetency', 'monthIssue'];
        $errors = [];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $errors[$field] = "$field é obrigatório";
            }
        }

        if (!empty($errors)) {
            return $this->validationErrorResponse($errors);
        }

        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não selecionado para o usuário', Response::HTTP_BAD_REQUEST);
        }
        $status = $this->entityManager->getRepository(InvoiceStatus::class)->find($data['statusId']);

        if (!$status) {
            return $this->errorResponse('Status não encontrado', Response::HTTP_NOT_FOUND);
        }

        $invoice = new Invoice();
        $invoice->setTenant($tenant);
        $invoice->setStatus($status);
        $invoice->setMonthCompetency(new \DateTime($data['monthCompetency']));
        $invoice->setMonthIssue(new \DateTime($data['monthIssue']));
        $invoice->setCode($data['code'] ?? null);
        $invoice->setTotal($data['total'] ?? '0.00');
        $invoice->setFileName($data['fileName'] ?? null);
        $invoice->setFileUrl($data['fileUrl'] ?? null);

        if (isset($data['issuerUserId'])) {
            $user = $this->entityManager->getRepository(User::class)->find($data['issuerUserId']);
            if ($user) {
                $invoice->setIssuerUser($user);
            }
        }

        $this->entityManager->persist($invoice);
        $this->entityManager->flush();

        // Processar expenseIds (vincular OS à NF)
        if (isset($data['expenseIds']) && is_array($data['expenseIds'])) {
            $this->processExpenseIds($invoice, $data['expenseIds'], $tenant);
        }

        return $this->createdResponse($this->serializeInvoice($invoice, true));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['code'])) {
            $invoice->setCode($data['code']);
        }
        if (isset($data['total'])) {
            $invoice->setTotal((string) $data['total']);
        }
        if (isset($data['statusId'])) {
            $status = $this->entityManager->getRepository(InvoiceStatus::class)->find($data['statusId']);
            if ($status) {
                $invoice->setStatus($status);
            }
        }
        if (isset($data['fileName'])) {
            $invoice->setFileName($data['fileName']);
        }

        // Processar expenseIds (vincular OS à NF)
        if (isset($data['expenseIds']) && is_array($data['expenseIds'])) {
            // Remover vinculos antigos
            foreach ($invoice->getExpenses() as $ie) {
                $this->entityManager->remove($ie);
            }
            foreach ($invoice->getItems() as $item) {
                $this->entityManager->remove($item);
            }
            $this->entityManager->flush();
            
            // Criar novos vínculos
            $this->processExpenseIds($invoice, $data['expenseIds'], $selectedTenant);
        }

        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeInvoice($invoice, true));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        $this->entityManager->remove($invoice);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Nota fiscal deletada com sucesso']);
    }

    private function processExpenseIds(Invoice $invoice, array $expenseIds, Tenant $tenant): void
    {
        if (empty($expenseIds)) {
            return;
        }

        $expenseRepo = $this->entityManager->getRepository(Expense::class);
        
        // Buscar todas as expenses
        $expenses = $expenseRepo->createQueryBuilder('e')
            ->where('e.id IN (:ids)')
            ->andWhere('e.tenant = :tenant')
            ->setParameter('ids', $expenseIds)
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        $totalValue = 0;
        $itemsByProject = [];

        // Criar InvoiceExpense e agrupar por projeto
        foreach ($expenses as $expense) {
            // Criar vínculo invoice-expense
            $invoiceExpense = new InvoiceExpense();
            $invoiceExpense->setInvoice($invoice);
            $invoiceExpense->setExpense($expense);
            $invoiceExpense->setTenant($tenant);
            $this->entityManager->persist($invoiceExpense);

            $value = (float) $expense->getValue();
            $totalValue += $value;

            // Agrupar por projeto
            $project = $expense->getProject();
            $projectId = $project ? $project->getId() : 0;

            if (!isset($itemsByProject[$projectId])) {
                $itemsByProject[$projectId] = [
                    'project' => $project,
                    'value' => 0,
                    'services' => []
                ];
            }

            $itemsByProject[$projectId]['value'] += $value;
            
            $service = $expense->getService();
            if ($service) {
                $itemsByProject[$projectId]['services'][] = $service->getName();
            }
        }

        // Criar InvoiceItems (um por projeto)
        foreach ($itemsByProject as $data) {
            $item = new InvoiceItem();
            $item->setTenant($tenant);
            $item->setInvoice($invoice);
            $item->setProject($data['project']);
            
            // Descrição: juntar nomes dos serviços
            $services = array_unique($data['services']);
            $description = !empty($services) ? implode(', ', $services) : 'Serviços';
            $item->setDescription($description);
            
            $item->setValue((string) $data['value']);
            $this->entityManager->persist($item);
        }

        // Atualizar total da invoice
        $invoice->setTotal((string) $totalValue);

        $this->entityManager->flush();
    }

    private function serializeInvoice(Invoice $invoice, bool $includeDetails = false): array
    {
        $status = $invoice->getStatus();
        $issuer = $invoice->getIssuerUser();
        
        $data = [
            'id' => $invoice->getId(),
            'code' => $invoice->getCode(),
            'total' => $invoice->getTotal(),
            'monthCompetency' => $invoice->getMonthCompetency()->format('Y-m-d'),
            'monthIssue' => $invoice->getMonthIssue()->format('Y-m-d'),
            'fileName' => $invoice->getFileName(),
            'fileUrl' => $invoice->getFileUrl(),
            'createdAt' => $invoice->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $invoice->getUpdatedAt()->format('Y-m-d H:i:s'),
            'status' => $status ? [
                'id' => $status->getId(),
                'name' => $status->getName(),
                'code' => $status->getCode()
            ] : null,
            'issuerUser' => $issuer ? [
                'id' => $issuer->getId(),
                'name' => $issuer->getName(),
                'email' => $issuer->getEmail()
            ] : null,
        ];

        if ($includeDetails) {
            // InvoiceItems
            $items = [];
            foreach ($invoice->getItems() as $item) {
                $project = $item->getProject();
                $items[] = [
                    'id' => $item->getId(),
                    'description' => $item->getDescription(),
                    'value' => $item->getValue(),
                    'project' => $project ? [
                        'id' => $project->getId(),
                        'code' => $project->getCode(),
                        'name' => $project->getName()
                    ] : null
                ];
            }
            
            // InvoiceExpenses (OS vinculadas)
            $expenses = [];
            foreach ($invoice->getExpenses() as $ie) {
                $expense = $ie->getExpense();
                if ($expense) {
                    $expProject = $expense->getProject();
                    $expService = $expense->getService();
                    $expStatus = $expense->getStatus();
                    
                    $expenses[] = [
                        'id' => $expense->getId(),
                        'dateBuy' => $expense->getDateBuy()->format('Y-m-d'),
                        'value' => $expense->getValue(),
                        'complement' => $expense->getComplement(),
                        'project' => $expProject ? [
                            'id' => $expProject->getId(),
                            'code' => $expProject->getCode(),
                            'name' => $expProject->getName()
                        ] : null,
                        'service' => $expService ? [
                            'id' => $expService->getId(),
                            'name' => $expService->getName()
                        ] : null,
                        'status' => $expStatus ? [
                            'id' => $expStatus->getId(),
                            'name' => $expStatus->getName()
                        ] : null
                    ];
                }
            }
            
            $data['items'] = $items;
            $data['expenses'] = $expenses;
        }

        return$data;
    }

    #[Route('/{id}/approve', name: 'approve', methods: ['POST'])]
    public function approve(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->unauthorizedResponse('Usuário não autenticado');
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        if (strtoupper($user->getRole()->getCode()) !== 'MASTER') {
            return $this->forbiddenResponse('Apenas Master pode aprovar notas fiscais');
        }

        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        // Verificar status atual
        $currentStatus = $invoice->getStatus();
        if ($currentStatus && $currentStatus->getName() !== 'Enviada') {
            return $this->errorResponse('Apenas notas com status "Enviada" podem ser aprovadas', 400);
        }

        // Buscar status "Aprovado"
        $statusRepo = $this->entityManager->getRepository(InvoiceStatus::class);
        $approved = $statusRepo->findOneBy(['name' => 'Aprovada']);
        if (!$approved) {
            return $this->errorResponse('Status "Aprovada" não encontrado', 500);
        }

        $invoice->setStatus($approved);
        $this->entityManager->flush();

        // 📝 Registra auditoria de aprovação
        $this->auditService->logInvoiceApprove($id, $user, $selectedTenant);

        return $this->jsonResponse($this->serializeInvoice($invoice, true));
    }

    #[Route('/{id}/reject', name: 'reject', methods: ['POST'])]
    public function reject(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->unauthorizedResponse('Usuário não autenticado');
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        if (strtoupper($user->getRole()->getCode()) !== 'MASTER') {
            return $this->forbiddenResponse('Apenas Master pode reprovar notas fiscais');
        }

        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        // Buscar status "Reprovada"
        $statusRepo = $this->entityManager->getRepository(InvoiceStatus::class);
        $rejected = $statusRepo->findOneBy(['name' => 'Reprovada']);
        if (!$rejected) {
            return $this->errorResponse('Status "Reprovada" não encontrado', 500);
        }

        $invoice->setStatus($rejected);
        $this->entityManager->flush();

        // 📝 Registra auditoria de rejeição
        $this->auditService->logInvoiceReject($id, $user, $selectedTenant);

        return $this->jsonResponse($this->serializeInvoice($invoice, true));
    }

    #[Route('/{id}/mark-as-paid', name: 'mark_paid', methods: ['POST'])]
    public function markAsPaid(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->unauthorizedResponse('Usuário não autenticado');
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        if (strtoupper($user->getRole()->getCode()) !== 'MASTER') {
            return $this->forbiddenResponse('Apenas Master pode marcar como paga');
        }

        $invoice = $this->entityManager->getRepository(Invoice::class)->find($id);
        
        if (!$invoice) {
            return $this->notFoundResponse('Nota fiscal não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$invoice->getTenant() || $invoice->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta nota fiscal');
        }

        // Verificar status atual
        $currentStatus = $invoice->getStatus();
        if ($currentStatus && $currentStatus->getName() !== 'Aprovada') {
            return $this->errorResponse('Apenas notas aprovadas podem ser marcadas como pagas', 400);
        }

        // Buscar status "Paga"
        $statusRepo = $this->entityManager->getRepository(InvoiceStatus::class);
        $paid = $statusRepo->findOneBy(['name' => 'Paga']);
        if (!$paid) {
            return $this->errorResponse('Status "Paga" não encontrado', 500);
        }

        $invoice->setStatus($paid);
        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeInvoice($invoice, true));
    }
}
