<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Service;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/services', name: 'api_services_')]
class ServiceController extends BaseController
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

        $repo = $this->entityManager->getRepository(Service::class);
        
        $query = $repo->createQueryBuilder('s')
            ->where('s.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('s.name', 'ASC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($repo->createQueryBuilder('s')
            ->where('s.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->getQuery()
            ->getResult());

        $services = $query->getQuery()->getResult();
        $data = array_map(fn($s) => [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'createdAt' => $s->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $s->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $s->getTenant() ? ['id' => $s->getTenant()->getId()] : null,
        ], $services);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $service = $this->entityManager->getRepository(Service::class)->find($id);
        
        if (!$service) {
            return $this->notFoundResponse('Serviço não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$service->getTenant() || $service->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este serviço');
        }

        return $this->jsonResponse([
            'id' => $service->getId(),
            'name' => $service->getName(),
            'createdAt' => $service->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $service->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $service->getTenant() ? ['id' => $service->getTenant()->getId()] : null,
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);

        if (empty($data['name'])) {
            return $this->validationErrorResponse([
                'name' => 'Nome é obrigatório',
            ]);
        }

        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não selecionado para o usuário', Response::HTTP_BAD_REQUEST);
        }

        $service = new Service();
        $service->setTenant($tenant);
        $service->setName($data['name']);

        $this->entityManager->persist($service);
        $this->entityManager->flush();

        return $this->createdResponse([
            'id' => $service->getId(),
            'name' => $service->getName(),
            'createdAt' => $service->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $service->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $service->getTenant() ? ['id' => $service->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $service = $this->entityManager->getRepository(Service::class)->find($id);
        if (!$service) {
            return $this->notFoundResponse('Serviço não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$service->getTenant() || $service->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este serviço');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['name'])) {
            $service->setName($data['name']);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'id' => $service->getId(),
            'name' => $service->getName(),
            'createdAt' => $service->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $service->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $service->getTenant() ? ['id' => $service->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $service = $this->entityManager->getRepository(Service::class)->find($id);
        if (!$service) {
            return $this->notFoundResponse('Serviço não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$service->getTenant() || $service->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este serviço');
        }

        $this->entityManager->remove($service);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Serviço deletado com sucesso']);
    }
}
