<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\User;
use App\Entity\Tenant;
use App\Entity\UserTenant;
use App\Entity\Role;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/user-tenants', name: 'api_user_tenants_')]
class UserTenantController extends BaseController
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
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        // Get all user-tenant links
        $userTenants = $this->entityManager->getRepository(UserTenant::class)->findAll();

        $data = array_map(fn($ut) => [
            'userId' => $ut->getUser()->getId(),
            'tenantId' => $ut->getTenant()->getId(),
            'userName' => $ut->getUser()->getName(),
            'tenantName' => $ut->getTenant()->getName(),
        ], $userTenants);

        return $this->jsonResponse(['data' => $data]);
    }

    #[Route('', name: 'update', methods: ['PUT'])]
    public function update(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        $data = $this->getJsonBody($request);
        $links = $data['links'] ?? [];

        if (!is_array($links)) {
            return $this->errorResponse('Links deve ser um array', Response::HTTP_BAD_REQUEST);
        }

        // Validate: each user must have at least one tenant
        $userTenantCounts = [];
        foreach ($links as $link) {
            $userId = $link['userId'] ?? null;
            if ($userId) {
                $userTenantCounts[$userId] = ($userTenantCounts[$userId] ?? 0) + 1;
            }
        }

        // Get all users
        $users = $this->entityManager->getRepository(User::class)->findAll();
        foreach ($users as $user) {
            if (!isset($userTenantCounts[$user->getId()]) || $userTenantCounts[$user->getId()] === 0) {
                return $this->errorResponse(
                    "Usuário '{$user->getName()}' precisa ter pelo menos um tenant vinculado",
                    Response::HTTP_BAD_REQUEST
                );
            }
        }

        // Delete all existing links
        $existingLinks = $this->entityManager->getRepository(UserTenant::class)->findAll();
        foreach ($existingLinks as $link) {
            $this->entityManager->remove($link);
        }
        $this->entityManager->flush();

        // Create new links
        foreach ($links as $link) {
            $userId = $link['userId'] ?? null;
            $tenantId = $link['tenantId'] ?? null;

            if (!$userId || !$tenantId) continue;

            $user = $this->entityManager->getRepository(User::class)->find($userId);
            $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);

            if (!$user || !$tenant) continue;

            // Get user's role from first UserTenant or use their current role
            $role = $user->getRole();

            $userTenant = new UserTenant();
            $userTenant->setUser($user);
            $userTenant->setTenant($tenant);
            $userTenant->setRole($role);

            $this->entityManager->persist($userTenant);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'message' => 'Vínculos atualizados com sucesso',
            'count' => count($links),
        ]);
    }
}
