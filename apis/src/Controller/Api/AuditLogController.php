<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Repository\AuditLogRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/audit-logs', name: 'api_audit_logs_')]
class AuditLogController extends BaseController
{
    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        private AuditLogRepository $auditLogRepository
    ) {
        parent::__construct($entityManager, $serializer);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(200, $request->query->getInt('limit', 100));

        $tenant = $this->getSelectedTenant($request);
        $user = $this->getCurrentUser($request);
        
        $qb = $this->auditLogRepository->createQueryBuilder('a')
            ->orderBy('a.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        // MASTER vê TUDO, OPERADOR vê apenas logs do seu tenant ou sem tenant
        if ($user && strtoupper($user->getRole()->getCode()) === 'MASTER') {
            // Master vê todos os logs (sem filtro de tenant)
        } else {
            // Operador vê apenas logs do tenant dele OU logs sem tenant
            if ($tenant) {
                $qb->where('a.tenant = :tenant OR a.tenant IS NULL')
                   ->setParameter('tenant', $tenant);
            } else {
                // Se não tem tenant selecionado, mostra apenas logs sem tenant
                $qb->where('a.tenant IS NULL');
            }
        }

        $logs = $qb->getQuery()->getResult();

        $data = array_map(fn($log) => [
            'id' => $log->getId(),
            'action' => $log->getAction(),
            'entityType' => $log->getEntityType(),
            'entityId' => $log->getEntityId(),
            'meta' => $log->getMeta(),
            'actorUser' => $log->getActorUser() ? [
                'id' => $log->getActorUser()->getId(),
                'name' => $log->getActorUser()->getName(),
                'email' => $log->getActorUser()->getEmail(),
            ] : null,
            'createdAt' => $log->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $logs);

        return $this->jsonResponse(['data' => $data]);
    }
}
