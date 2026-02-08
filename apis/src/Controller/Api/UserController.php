<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\User;
use App\Entity\Role;
use App\Entity\UserStatus;
use App\Service\PasswordHasher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/users', name: 'api_users_')]
class UserController extends BaseController
{
    private PasswordHasher $passwordHasher;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        PasswordHasher $passwordHasher
    ) {
        parent::__construct($entityManager, $serializer);
        $this->passwordHasher = $passwordHasher;
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, $request->query->getInt('limit', 20));

        $repo = $this->entityManager->getRepository(User::class);
        
        $query = $repo->createQueryBuilder('u')
            ->orderBy('u.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($repo->createQueryBuilder('u')->getQuery()->getResult());
        $users = $query->getQuery()->getResult();

        $data = array_map(fn($u) => [
            'id' => $u->getId(),
            'name' => $u->getName(),
            'email' => $u->getEmail(),
            'role' => $u->getRole() ? $u->getRole()->getCode() : null,
            'status' => $u->getStatus() ? [
                'id' => $u->getStatus()->getId(),
                'code' => $u->getStatus()->getCode(),
                'name' => $u->getStatus()->getName(),
            ] : null,
            'active' => $u->isActive(),
            'createdAt' => $u->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $users);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->entityManager->getRepository(User::class)->find($id);
        
        if (!$user) {
            return $this->notFoundResponse('Usuário não encontrado');
        }

        return $this->jsonResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole() ? $user->getRole()->getCode() : null,
            'status' => $user->getStatus() ? [
                'id' => $user->getStatus()->getId(),
                'code' => $user->getStatus()->getCode(),
                'name' => $user->getStatus()->getName(),
            ] : null,
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        $required = ['name', 'email', 'password', 'roleId', 'statusId'];
        $errors = [];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $errors[$field] = "$field é obrigatório";
            }
        }

        if (!empty($errors)) {
            return $this->validationErrorResponse($errors);
        }

        // Verificar se email já existe
        $existingUser = $this->entityManager->getRepository(User::class)->findByEmail($data['email']);
        if ($existingUser) {
            return $this->errorResponse('Email já registrado', Response::HTTP_CONFLICT);
        }

        $role = $this->entityManager->getRepository(Role::class)->find($data['roleId']);
        $status = $this->entityManager->getRepository(UserStatus::class)->find($data['statusId']);

        if (!$role || !$status) {
            return $this->errorResponse('Role ou Status não encontrado', Response::HTTP_NOT_FOUND);
        }

        $user = new User();
        $user->setName($data['name']);
        $user->setEmail($data['email']);
        $user->setPasswordHash($this->passwordHasher->hash($user, $data['password']));
        $user->setRole($role);
        $user->setStatus($status);
        $user->setActive($data['active'] ?? true);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->createdResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole() ? $user->getRole()->getCode() : null,
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->entityManager->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->notFoundResponse('Usuário não encontrado');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['name'])) {
            $user->setName($data['name']);
        }
        if (isset($data['email'])) {
            $user->setEmail($data['email']);
        }
        if (isset($data['password'])) {
            $user->setPasswordHash($this->passwordHasher->hash($user, $data['password']));
        }
        // legacy support: allow updating via passwordHash
        elseif (isset($data['passwordHash'])) {
            $user->setPasswordHash($data['passwordHash']);
        }
        if (isset($data['active'])) {
            $user->setActive((bool) $data['active']);
        }
        if (isset($data['statusId'])) {
            $status = $this->entityManager->getRepository(UserStatus::class)->find($data['statusId']);
            if ($status) {
                $user->setStatus($status);
            }
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole() ? $user->getRole()->getCode() : null,
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->entityManager->getRepository(User::class)->find($id);
        if (!$user) {
            return $this->notFoundResponse('Usuário não encontrado');
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Usuário deletado com sucesso']);
    }
}
