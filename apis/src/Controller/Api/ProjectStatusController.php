<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\ProjectStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/project-statuses', name: 'api_project_statuses_')]
class ProjectStatusController extends BaseController
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
        $repo = $this->entityManager->getRepository(ProjectStatus::class);
        $statuses = $repo->findAll();

        $data = array_map(fn($s) => [
            'id' => $s->getId(),
            'code' => $s->getCode(),
            'name' => $s->getName(),
        ], $statuses);

        return $this->jsonResponse([
            'data' => $data,
        ]);
    }
}
