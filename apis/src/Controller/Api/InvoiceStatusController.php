<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\InvoiceStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/invoice-statuses', name: 'api_invoice_statuses_')]
class InvoiceStatusController extends BaseController
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

        $repo = $this->entityManager->getRepository(InvoiceStatus::class);
        $statuses = $repo->createQueryBuilder('s')
            ->orderBy('s.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $data = array_map(fn($s) => [
            'id' => $s->getId(),
            'code' => $s->getCode(),
            'name' => $s->getName()
        ], $statuses);

        return $this->jsonResponse(['data' => $data]);
    }
}
