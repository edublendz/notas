<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Repository\RoleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/roles', name: 'api_roles_')]
class RoleController extends BaseController
{
    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        private RoleRepository $roleRepository
    ) {
        parent::__construct($entityManager, $serializer);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $roles = $this->roleRepository->findAll();

        $data = array_map(fn($role) => [
            'id' => $role->getId(),
            'code' => $role->getCode(),
            'name' => $role->getName(),
        ], $roles);

        return $this->jsonResponse(['data' => $data]);
    }
}
