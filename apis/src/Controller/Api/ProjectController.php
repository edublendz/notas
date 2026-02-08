<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Project;
use App\Entity\ProjectStatus;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/projects', name: 'api_projects_')]
class ProjectController extends BaseController
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

        $repo = $this->entityManager->getRepository(Project::class);
        
        $query = $repo->createQueryBuilder('p')
            ->where('p.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->orderBy('p.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit);

        $total = count($repo->createQueryBuilder('p')
            ->where('p.tenant = :tenantId')
            ->setParameter('tenantId', $tenantId)
            ->getQuery()
            ->getResult());

        $projects = $query->getQuery()->getResult();
        $data = array_map(fn($p) => [
            'id' => $p->getId(),
            'name' => $p->getName(),
            'code' => $p->getCode(),
            'valueTotal' => $p->getValueTotal(),
            'costPlanned' => $p->getCostPlanned(),
            'costPlannedNF' => $p->getCostPlannedNF(),
            'costPlannedOther' => $p->getCostPlannedOther(),
            'indicatorOverridePct' => $p->getIndicatorOverridePct(),
            'type' => $p->getType(),
            'contractUrl' => $p->getContractUrl(),
            'dreUrl' => $p->getDreUrl(),
            'startDate' => $p->getStartDate()?->format('Y-m-d'),
            'endDate' => $p->getEndDate()?->format('Y-m-d'),
            'clientId' => $p->getClient()?->getId(),
            'statusId' => $p->getStatus()?->getId(),
            'status' => $p->getStatus()?->getName(),
            'createdAt' => $p->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $p->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $p->getTenant() ? ['id' => $p->getTenant()->getId()] : null,
        ], $projects);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $project = $this->entityManager->getRepository(Project::class)->find($id);
        
        if (!$project) {
            return $this->notFoundResponse('Projeto não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$project->getTenant() || $project->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este projeto');
        }

        return $this->jsonResponse([
            'data' => [
                'id' => $project->getId(),
                'name' => $project->getName(),
                'code' => $project->getCode(),
                'valueTotal' => $project->getValueTotal(),
                'costPlanned' => $project->getCostPlanned(),
                'costPlannedNF' => $project->getCostPlannedNF(),
                'costPlannedOther' => $project->getCostPlannedOther(),
                'indicatorOverridePct' => $project->getIndicatorOverridePct(),
                'type' => $project->getType(),
                'contractUrl' => $project->getContractUrl(),
                'dreUrl' => $project->getDreUrl(),
                'startDate' => $project->getStartDate()?->format('Y-m-d'),
                'endDate' => $project->getEndDate()?->format('Y-m-d'),
                'clientId' => $project->getClient()?->getId(),
                'statusId' => $project->getStatus()?->getId(),
                'status' => $project->getStatus()?->getName(),
                'createdAt' => $project->getCreatedAt()->format('Y-m-d H:i:s'),
                'updatedAt' => $project->getUpdatedAt()->format('Y-m-d H:i:s'),
                'tenant' => $project->getTenant() ? ['id' => $project->getTenant()->getId()] : null,
            ]
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);

        $errors = $this->validateProjectData($data);
        if (!empty($errors)) {
            return $this->validationErrorResponse($errors);
        }

        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não selecionado para o usuário', Response::HTTP_BAD_REQUEST);
        }

        $status = $this->entityManager->getRepository(ProjectStatus::class)->find($data['statusId'] ?? 1);
        if (!$status) {
            return $this->errorResponse('Status não encontrado', Response::HTTP_NOT_FOUND);
        }

        $project = new Project();
        $project->setTenant($tenant);
        $project->setCode($data['code'] ?? '');
        $project->setName($data['name'] ?? '');
        $project->setStatus($status);
        $project->setValueTotal($data['valueTotal'] ?? '0.00');
        $project->setCostPlanned($data['costPlanned'] ?? '0.00');
        
        if (isset($data['costPlannedNF'])) {
            $project->setCostPlannedNF((string) $data['costPlannedNF']);
        }
        if (isset($data['costPlannedOther'])) {
            $project->setCostPlannedOther((string) $data['costPlannedOther']);
        }
        if (isset($data['type'])) {
            $project->setType($data['type']);
        }
        if (isset($data['contractUrl'])) {
            $project->setContractUrl($data['contractUrl']);
        }
        if (isset($data['dreUrl'])) {
            $project->setDreUrl($data['dreUrl']);
        }
        if (isset($data['startDate'])) {
            $project->setStartDate(new \DateTime($data['startDate']));
        }
        if (isset($data['endDate'])) {
            $project->setEndDate(new \DateTime($data['endDate']));
        }
        if (isset($data['indicatorOverridePct'])) {
            $project->setIndicatorOverridePct((string) $data['indicatorOverridePct']);
        }

        if (isset($data['clientId'])) {
            $client = $this->entityManager->getRepository(\App\Entity\Client::class)->find($data['clientId']);
            if ($client) {
                $project->setClient($client);
            }
        }

        if (isset($data['ownerUserId'])) {
            $owner = $this->entityManager->getRepository(\App\Entity\User::class)->find($data['ownerUserId']);
            if ($owner) {
                $project->setOwnerUser($owner);
            }
        }

        $this->entityManager->persist($project);
        $this->entityManager->flush();

        return $this->createdResponse([
            'id' => $project->getId(),
            'name' => $project->getName(),
            'code' => $project->getCode(),
            'valueTotal' => $project->getValueTotal(),
            'costPlanned' => $project->getCostPlanned(),
            'createdAt' => $project->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $project->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $project->getTenant() ? ['id' => $project->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $project = $this->entityManager->getRepository(Project::class)->find($id);
        if (!$project) {
            return $this->notFoundResponse('Projeto não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$project->getTenant() || $project->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este projeto');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['name'])) {
            $project->setName($data['name']);
        }
        if (isset($data['code'])) {
            $project->setCode($data['code']);
        }
        if (isset($data['valueTotal'])) {
            $project->setValueTotal((string) $data['valueTotal']);
        }
        if (isset($data['costPlanned'])) {
            $project->setCostPlanned((string) $data['costPlanned']);
        }
        if (isset($data['statusId'])) {
            $status = $this->entityManager->getRepository(ProjectStatus::class)->find($data['statusId']);
            if ($status) {
                $project->setStatus($status);
            }
        }
        if (isset($data['clientId'])) {
            $client = $this->entityManager->getRepository(\App\Entity\Client::class)->find($data['clientId']);
            $project->setClient($client);
        }
        if (isset($data['costPlannedNF'])) {
            $project->setCostPlannedNF((string) $data['costPlannedNF']);
        }
        if (isset($data['costPlannedOther'])) {
            $project->setCostPlannedOther((string) $data['costPlannedOther']);
        }
        if (isset($data['type'])) {
            $project->setType($data['type']);
        }
        if (isset($data['contractUrl'])) {
            $project->setContractUrl($data['contractUrl']);
        }
        if (isset($data['dreUrl'])) {
            $project->setDreUrl($data['dreUrl']);
        }
        if (isset($data['startDate'])) {
            $project->setStartDate($data['startDate'] ? new \DateTime($data['startDate']) : null);
        }
        if (isset($data['endDate'])) {
            $project->setEndDate($data['endDate'] ? new \DateTime($data['endDate']) : null);
        }
        if (isset($data['indicatorOverridePct'])) {
            $project->setIndicatorOverridePct($data['indicatorOverridePct'] !== null ? (string) $data['indicatorOverridePct'] : null);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'id' => $project->getId(),
            'name' => $project->getName(),
            'code' => $project->getCode(),
            'valueTotal' => $project->getValueTotal(),
            'costPlanned' => $project->getCostPlanned(),
            'createdAt' => $project->getCreatedAt()->format('Y-m-d H:i:s'),
            'updatedAt' => $project->getUpdatedAt()->format('Y-m-d H:i:s'),
            'tenant' => $project->getTenant() ? ['id' => $project->getTenant()->getId()] : null,
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $project = $this->entityManager->getRepository(Project::class)->find($id);
        if (!$project) {
            return $this->notFoundResponse('Projeto não encontrado');
        }

        $selectedTenant = $this->getSelectedTenant($request);
        if (!$selectedTenant || !$project->getTenant() || $project->getTenant()->getId() !== $selectedTenant->getId()) {
            return $this->forbiddenResponse('Acesso negado a este projeto');
        }

        $this->entityManager->remove($project);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Projeto deletado com sucesso']);
    }

    private function validateProjectData(array $data): array
    {
        $errors = [];
        
        if (empty($data['name'])) {
            $errors['name'] = 'Nome é obrigatório';
        }
        if (empty($data['code'])) {
            $errors['code'] = 'Código é obrigatório';
        }
        // tenantId now comes from the authenticated user's selected tenant
        if (empty($data['statusId'])) {
            $errors['statusId'] = 'Status é obrigatório';
        }

        return $errors;
    }
}
