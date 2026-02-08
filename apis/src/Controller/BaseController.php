<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\User;
use App\Entity\Tenant;

abstract class BaseController extends AbstractController
{
    protected EntityManagerInterface $entityManager;
    protected SerializerInterface $serializer;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ) {
        $this->entityManager = $entityManager;
        $this->serializer = $serializer;
    }

    protected function jsonResponse(mixed $data, int $status = Response::HTTP_OK): JsonResponse
    {
        return $this->json($data, $status);
    }

    protected function errorResponse(string $message, int $status = Response::HTTP_BAD_REQUEST): JsonResponse
    {
        return $this->jsonResponse(['error' => $message], $status);
    }

    protected function notFoundResponse(string $message = 'Recurso não encontrado'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_NOT_FOUND);
    }

    protected function unauthorizedResponse(string $message = 'Não autorizado'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_UNAUTHORIZED);
    }

    protected function forbiddenResponse(string $message = 'Acesso proibido'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_FORBIDDEN);
    }

    protected function validationErrorResponse(array $errors): JsonResponse
    {
        return $this->jsonResponse(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    protected function createdResponse(mixed $data): JsonResponse
    {
        return $this->jsonResponse($data, Response::HTTP_CREATED);
    }

    protected function getJsonBody(Request $request): array
    {
        return json_decode($request->getContent(), true) ?? [];
    }

    /**
     * Retorna o id do usuário autenticado (claims armazenadas no Request)
     */
    protected function getCurrentUserId(Request $request): ?int
    {
        $claims = $request->attributes->get('user_claims');
        if (!is_array($claims) || empty($claims['uid'])) {
            return null;
        }
        return (int)$claims['uid'];
    }

    /**
     * Retorna a entidade Tenant selecionada pelo usuário (via UserPreference)
     */
    protected function getSelectedTenant(Request $request): ?Tenant
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return null;
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return null;
        }

        $prefs = $user->getPreferences();
        if ($prefs && method_exists($prefs, 'getSelectedTenant')) {
            return $prefs->getSelectedTenant();
        }

        return null;
    }
}
