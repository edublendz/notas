<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Expense;
use App\Entity\ExpenseStatus;
use App\Entity\InvoiceExpense;
use App\Entity\Service;
use App\Entity\Tenant;
use App\Entity\Project;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/expenses', name: 'api_expenses_')]
class ExpenseController extends BaseController
{
    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ) {
        parent::__construct($entityManager, $serializer);
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

        $repo = $this->entityManager->getRepository(Expense::class);
        
        $qb = $repo->createQueryBuilder('e')
            ->where('e.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('e.dateBuy', 'DESC');

        if ($statusId > 0) {
            $qb->andWhere('e.status = :statusId')
                ->setParameter('statusId', $statusId);
        }

        $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $expenses = $qb->getQuery()->getResult();

        // Para total, ignora paginação
        $totalQb = $repo->createQueryBuilder('e2')
            ->select('COUNT(e2.id)')
            ->where('e2.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId);
        if ($statusId > 0) {
            $totalQb->andWhere('e2.status = :statusId')
                ->setParameter('statusId', $statusId);
        }
        $total = (int) $totalQb->getQuery()->getSingleScalarResult();

        $data = array_map(fn(Expense $e) => $this->serializeExpense($e), $expenses);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $expense = $this->entityManager->getRepository(Expense::class)->find($id);
        
        if (!$expense) {
            return $this->notFoundResponse('Despesa não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$expense->getTenant() || $expense->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta despesa');
        }

        return $this->jsonResponse($this->serializeExpense($expense));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        // statusId passa a ser opcional (padrão: "Enviada")
        $required = ['value', 'dateBuy'];
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

        $statusRepo = $this->entityManager->getRepository(ExpenseStatus::class);
        if (!empty($data['statusId'])) {
            $status = $statusRepo->find($data['statusId']);
        } else {
            // fallback: pega status "Enviada" pelo nome
            $status = $statusRepo->findOneBy(['name' => 'Enviada']);
        }

        if (!$status) {
            return $this->errorResponse('Status não encontrado', Response::HTTP_NOT_FOUND);
        }

        $expense = new Expense();
        $expense->setTenant($tenant);
        $expense->setStatus($status);
        $expense->setValue((string) $data['value']);
        $expense->setDateBuy(new \DateTime($data['dateBuy']));
        $expense->setDescription($data['description'] ?? null);
        $expense->setComplement($data['complement'] ?? null);

        if (isset($data['projectId'])) {
            $project = $this->entityManager->getRepository(Project::class)->find($data['projectId']);
            if ($project) {
                $expense->setProject($project);
            }
        }

        if (isset($data['serviceId'])) {
            $service = $this->entityManager->getRepository(Service::class)->find($data['serviceId']);
            if ($service) {
                $expense->setService($service);
            }
        }

        if (isset($data['requesterUserId'])) {
            $user = $this->entityManager->getRepository(User::class)->find($data['requesterUserId']);
            if ($user) {
                $expense->setRequesterUser($user);
            }
        }

        $this->entityManager->persist($expense);
        $this->entityManager->flush();

        return $this->createdResponse($this->serializeExpense($expense));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $expense = $this->entityManager->getRepository(Expense::class)->find($id);
        if (!$expense) {
            return $this->notFoundResponse('Despesa não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$expense->getTenant() || $expense->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta despesa');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['value'])) {
            $expense->setValue((string) $data['value']);
        }
        if (isset($data['description'])) {
            $expense->setDescription($data['description']);
        }
        if (isset($data['complement'])) {
            $expense->setComplement($data['complement']);
        }
        if (isset($data['dateBuy'])) {
            $expense->setDateBuy(new \DateTime($data['dateBuy']));
        }
        if (isset($data['projectId'])) {
            $project = $this->entityManager->getRepository(Project::class)->find($data['projectId']);
            if ($project) {
                $expense->setProject($project);
            }
        }
        if (isset($data['serviceId'])) {
            $service = $this->entityManager->getRepository(Service::class)->find($data['serviceId']);
            if ($service) {
                $expense->setService($service);
            }
        }
        if (isset($data['statusId'])) {
            $status = $this->entityManager->getRepository(ExpenseStatus::class)->find($data['statusId']);
            if ($status) {
                $expense->setStatus($status);
            }
        }

        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeExpense($expense));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $expense = $this->entityManager->getRepository(Expense::class)->find($id);
        if (!$expense) {
            return $this->notFoundResponse('Despesa não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$expense->getTenant() || $expense->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta despesa');
        }

        $this->entityManager->remove($expense);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Despesa deletada com sucesso']);
    }

    /**
     * Aprova uma OS (despesa) – apenas MASTER e apenas se estiver "Enviada".
     */
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
            return $this->forbiddenResponse('Apenas Master pode aprovar OS');
        }

        $expense = $this->entityManager->getRepository(Expense::class)->find($id);
        if (!$expense) {
            return $this->notFoundResponse('Despesa não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$expense->getTenant() || $expense->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta despesa');
        }

        $currentStatusName = $expense->getStatus()->getName();
        if ($currentStatusName !== 'Enviada') {
            return $this->errorResponse('Só é possível aprovar OS com status "Enviada"', Response::HTTP_BAD_REQUEST);
        }

        $statusRepo = $this->entityManager->getRepository(ExpenseStatus::class);
        $approved = $statusRepo->findOneBy(['name' => 'Aprovada']);
        if (!$approved) {
            return $this->errorResponse('Status "Aprovada" não configurado', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $expense->setStatus($approved);
        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeExpense($expense));
    }

    /**
     * Reprova uma OS (despesa) – apenas MASTER, sem NF vinculada e status "Enviada".
     */
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
            return $this->forbiddenResponse('Apenas Master pode reprovar OS');
        }

        $expense = $this->entityManager->getRepository(Expense::class)->find($id);
        if (!$expense) {
            return $this->notFoundResponse('Despesa não encontrada');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$expense->getTenant() || $expense->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a esta despesa');
        }

        // Verifica se há NF vinculada
        if (count($expense->getInvoiceExpenses()) > 0) {
            return $this->errorResponse('Não pode reprovar: OS já vinculada a uma NF.', Response::HTTP_BAD_REQUEST);
        }

        $currentStatusName = $expense->getStatus()->getName();
        if ($currentStatusName !== 'Enviada') {
            return $this->errorResponse('Só é possível reprovar OS com status "Enviada"', Response::HTTP_BAD_REQUEST);
        }

        $statusRepo = $this->entityManager->getRepository(ExpenseStatus::class);
        $rejected = $statusRepo->findOneBy(['name' => 'Reprovada']);
        if (!$rejected) {
            return $this->errorResponse('Status "Reprovada" não configurado', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $expense->setStatus($rejected);
        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeExpense($expense));
    }

    /**
     * Serializa a entidade Expense com os relacionamentos necessários
     * para a tela de OS.
     */
    private function serializeExpense(Expense $e): array
    {
        $project = $e->getProject();
        $service = $e->getService();
        $requester = $e->getRequesterUser();
        $status = $e->getStatus();

        $invoiceData = null;
        $invoiceExpenses = $e->getInvoiceExpenses();
        if ($invoiceExpenses && count($invoiceExpenses) > 0) {
            /** @var InvoiceExpense $invExp */
            $invExp = $invoiceExpenses->first();
            $invoice = $invExp->getInvoice();
            if ($invoice) {
                $invStatus = $invoice->getStatus();
                $invoiceData = [
                    'id' => $invoice->getId(),
                    'code' => $invoice->getCode(),
                    'status' => $invStatus ? [
                        'id' => $invStatus->getId(),
                        'code' => $invStatus->getCode(),
                        'name' => $invStatus->getName(),
                    ] : null,
                ];
            }
        }

        return [
            'id' => $e->getId(),
            'value' => $e->getValue(),
            'description' => $e->getDescription(),
            'complement' => $e->getComplement(),
            'dateBuy' => $e->getDateBuy()->format('Y-m-d'),
            'createdAt' => $e->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $e->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $e->getTenant() ? ['id' => $e->getTenant()->getId()] : null,
            'status' => $status ? [
                'id' => $status->getId(),
                'code' => $status->getCode(),
                'name' => $status->getName(),
            ] : null,
            'project' => $project ? [
                'id' => $project->getId(),
                'code' => $project->getCode(),
                'name' => $project->getName(),
            ] : null,
            'service' => $service ? [
                'id' => $service->getId(),
                'name' => $service->getName(),
            ] : null,
            'requester' => $requester ? [
                'id' => $requester->getId(),
                'name' => $requester->getName(),
                'email' => $requester->getEmail(),
            ] : null,
            'invoice' => $invoiceData,
        ];
    }
}
