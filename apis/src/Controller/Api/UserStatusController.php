<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Repository\UserStatusRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/user-statuses', name: 'api_user_status_')]
class UserStatusController extends BaseController
{
    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        private UserStatusRepository $userStatusRepository
    ) {
        parent::__construct($entityManager, $serializer);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $statuses = $this->userStatusRepository->findAll();

        $data = array_map(fn($status) => [
            'id' => $status->getId(),
            'code' => $status->getCode(),
            'name' => $status->getName(),
        ], $statuses);

        return $this->json(['data' => $data]);
    }
}
