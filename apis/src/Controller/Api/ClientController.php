<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Client;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/clients', name: 'api_clients_')]
class ClientController extends BaseController
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
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, $request->query->getInt('limit', 20));

        $repo = $this->entityManager->getRepository(Client::class);
        
        $query = $repo->createQueryBuilder('c')
            ->where('c.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('c.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($repo->createQueryBuilder('c')
            ->where('c.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->getQuery()
            ->getResult());

        $clients = $query->getQuery()->getResult();
        $data = array_map(fn($c) => [
            'id' => $c->getId(),
            'name' => $c->getName(),
            'code' => $c->getCode(),
            'doc' => $c->getDoc(),
            'createdAt' => $c->getCreatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $c->getTenant() ? ['id' => $c->getTenant()->getId()] : null,
        ], $clients);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total
            ]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $client = $this->entityManager->getRepository(Client::class)->find($id);
        
        if (!$client) {
            return $this->notFoundResponse('Cliente não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$client->getTenant() || $client->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este cliente');
        }

        return $this->jsonResponse([
            'id' => $client->getId(),
            'name' => $client->getName(),
            'code' => $client->getCode(),
            'doc' => $client->getDoc(),
            'createdAt' => $client->getCreatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $client->getTenant() ? ['id' => $client->getTenant()->getId()] : null,
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);

        if (empty($data['name']) || empty($data['code'])) {
            return $this->validationErrorResponse([
                'name' => empty($data['name']) ? 'Nome é obrigatório' : null,
                'code' => empty($data['code']) ? 'Código é obrigatório' : null,
            ]);
        }

        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não selecionado para o usuário', Response::HTTP_BAD_REQUEST);
        }

        $client = new Client();
        $client->setTenant($tenant);
        $client->setCode($data['code']);
        $client->setName($data['name']);
        $client->setDoc($data['doc'] ?? null);

        $this->entityManager->persist($client);
        $this->entityManager->flush();

        return $this->createdResponse([
            'id' => $client->getId(),
            'name' => $client->getName(),
            'code' => $client->getCode(),
            'doc' => $client->getDoc(),
            'createdAt' => $client->getCreatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $client->getTenant() ? ['id' => $client->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $client = $this->entityManager->getRepository(Client::class)->find($id);
        if (!$client) {
            return $this->notFoundResponse('Cliente não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$client->getTenant() || $client->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este cliente');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['name'])) {
            $client->setName($data['name']);
        }
        if (isset($data['code'])) {
            $client->setCode($data['code']);
        }
        if (isset($data['doc'])) {
            $client->setDoc($data['doc']);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'id' => $client->getId(),
            'name' => $client->getName(),
            'code' => $client->getCode(),
            'doc' => $client->getDoc(),
            'createdAt' => $client->getCreatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $client->getTenant() ? ['id' => $client->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $client = $this->entityManager->getRepository(Client::class)->find($id);
        if (!$client) {
            return $this->notFoundResponse('Cliente não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$client->getTenant() || $client->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este cliente');
        }

        $this->entityManager->remove($client);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Cliente deletado com sucesso']);
    }
}
