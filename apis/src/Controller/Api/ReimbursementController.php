<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Reimbursement;
use App\Entity\ReimbursementStatus;
use App\Entity\ReimbursementType;
use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\Project;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/reimbursements', name: 'api_reimbursements_')]
class ReimbursementController extends BaseController
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

        $repo = $this->entityManager->getRepository(Reimbursement::class);
        
        $qb = $repo->createQueryBuilder('r')
            ->where('r.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('r.dateBuy', 'DESC');

        if ($statusId > 0) {
            $qb->andWhere('r.status = :statusId')
                ->setParameter('statusId', $statusId);
        }

        $qb->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($qb->getQuery()->getResult());

        $reimbursements = $qb->getQuery()->getResult();
        $data = array_map(fn(Reimbursement $r) => $this->serializeReimbursement($r), $reimbursements);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $reimbursement = $this->entityManager->getRepository(Reimbursement::class)->find($id);
        
        if (!$reimbursement) {
            return $this->notFoundResponse('Reembolso não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$reimbursement->getTenant() || $reimbursement->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este reembolso');
        }

        return $this->jsonResponse($this->serializeReimbursement($reimbursement));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        $required = ['statusId', 'value', 'dateBuy'];
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
        $status = $this->entityManager->getRepository(ReimbursementStatus::class)->find($data['statusId']);

        if (!$status) {
            return $this->errorResponse('Status não encontrado', Response::HTTP_NOT_FOUND);
        }

        $reimbursement = new Reimbursement();
        $reimbursement->setTenant($tenant);
        $reimbursement->setStatus($status);
        $reimbursement->setValue((string) $data['value']);
        $reimbursement->setDateBuy(new \DateTime($data['dateBuy']));
        $reimbursement->setDescription($data['description'] ?? null);
        $reimbursement->setComplement($data['complement'] ?? null);
        $reimbursement->setProofUrl($data['proofUrl'] ?? null);

        if (isset($data['projectId'])) {
            $project = $this->entityManager->getRepository(Project::class)->find($data['projectId']);
            if ($project) {
                $reimbursement->setProject($project);
            }
        }

        if (isset($data['userId'])) {
            $user = $this->entityManager->getRepository(User::class)->find($data['userId']);
            if ($user) {
                $reimbursement->setUser($user);
            }
        }

        if (isset($data['typeId'])) {
            $type = $this->entityManager->getRepository(ReimbursementType::class)->find($data['typeId']);
            if ($type) {
                $reimbursement->setType($type);
            }
        }

        $this->entityManager->persist($reimbursement);
        $this->entityManager->flush();

        return $this->createdResponse($this->serializeReimbursement($reimbursement));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $reimbursement = $this->entityManager->getRepository(Reimbursement::class)->find($id);
        if (!$reimbursement) {
            return $this->notFoundResponse('Reembolso não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$reimbursement->getTenant() || $reimbursement->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este reembolso');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['value'])) {
            $reimbursement->setValue((string) $data['value']);
        }
        if (isset($data['description'])) {
            $reimbursement->setDescription($data['description']);
        }
        if (isset($data['statusId'])) {
            $status = $this->entityManager->getRepository(ReimbursementStatus::class)->find($data['statusId']);
            if ($status) {
                $reimbursement->setStatus($status);
            }
        }

        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeReimbursement($reimbursement));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $reimbursement = $this->entityManager->getRepository(Reimbursement::class)->find($id);
        if (!$reimbursement) {
            return $this->notFoundResponse('Reembolso não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$reimbursement->getTenant() || $reimbursement->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este reembolso');
        }

        $this->entityManager->remove($reimbursement);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Reembolso deletado com sucesso']);
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
            return $this->forbiddenResponse('Apenas Master pode aprovar reembolso');
        }

        $reimbursement = $this->entityManager->getRepository(Reimbursement::class)->find($id);
        if (!$reimbursement) {
            return $this->notFoundResponse('Reembolso não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$reimbursement->getTenant() || $reimbursement->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este reembolso');
        }

        $currentStatusName = $reimbursement->getStatus()->getName();
        if ($currentStatusName !== 'Solicitado') {
            return $this->errorResponse('Só é possível aprovar reembolso com status "Solicitado"', Response::HTTP_BAD_REQUEST);
        }

        $statusRepo = $this->entityManager->getRepository(ReimbursementStatus::class);
        $approved = $statusRepo->findOneBy(['name' => 'Aprovado']);
        if (!$approved) {
            return $this->errorResponse('Status "Aprovado" não configurado', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $reimbursement->setStatus($approved);
        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeReimbursement($reimbursement));
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
            return $this->forbiddenResponse('Apenas Master pode reprovar reembolso');
        }

        $reimbursement = $this->entityManager->getRepository(Reimbursement::class)->find($id);
        if (!$reimbursement) {
            return $this->notFoundResponse('Reembolso não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$reimbursement->getTenant() || $reimbursement->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este reembolso');
        }

        $currentStatusName = $reimbursement->getStatus()->getName();
        if ($currentStatusName !== 'Solicitado') {
            return $this->errorResponse('Só é possível reprovar reembolso com status "Solicitado"', Response::HTTP_BAD_REQUEST);
        }

        $statusRepo = $this->entityManager->getRepository(ReimbursementStatus::class);
        $rejected = $statusRepo->findOneBy(['name' => 'Reprovado']);
        if (!$rejected) {
            return $this->errorResponse('Status "Reprovado" não configurado', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $reimbursement->setStatus($rejected);
        $this->entityManager->flush();

        return $this->jsonResponse($this->serializeReimbursement($reimbursement));
    }

    private function serializeReimbursement(Reimbursement $r): array
    {
        $project = $r->getProject();
        $user = $r->getUser();
        $status = $r->getStatus();
        $type = $r->getType();

        return [
            'id' => $r->getId(),
            'value' => $r->getValue(),
            'description' => $r->getDescription(),
            'complement' => $r->getComplement(),
            'dateBuy' => $r->getDateBuy()->format('Y-m-d'),
            'proofUrl' => $r->getProofUrl(),
            'createdAt' => $r->getCreatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $r->getTenant() ? ['id' => $r->getTenant()->getId()] : null,
            'status' => $status ? [
                'id' => $status->getId(),
                'name' => $status->getName(),
            ] : null,
            'project' => $project ? [
                'id' => $project->getId(),
                'code' => $project->getCode(),
                'name' => $project->getName(),
            ] : null,
            'user' => $user ? [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
            ] : null,
            'type' => $type ? [
                'id' => $type->getId(),
                'name' => $type->getName(),
            ] : null,
        ];
    }
}
