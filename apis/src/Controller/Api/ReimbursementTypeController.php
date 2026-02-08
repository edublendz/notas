<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\ReimbursementType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/reimbursement-types', name: 'api_reimbursement_types_')]
class ReimbursementTypeController extends BaseController
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
        $limit = min(100, $request->query->getInt('limit', 100));
        
        $repo = $this->entityManager->getRepository(ReimbursementType::class);
        $types = $repo->createQueryBuilder('t')
            ->orderBy('t.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $data = array_map(fn($t) => [
            'id' => $t->getId(),
            'name' => $t->getName(),
        ], $types);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => 1, 'limit' => $limit, 'total' => count($data)]
        ]);
    }
}
