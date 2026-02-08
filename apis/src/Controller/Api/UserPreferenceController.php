<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\UserPreference;
use App\Entity\User;
use App\Entity\Tenant;
use App\Entity\UserTenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/user-preference', name: 'api_user_preference_')]
class UserPreferenceController extends BaseController
{
    public function __construct(EntityManagerInterface $entityManager, SerializerInterface $serializer)
    {
        parent::__construct($entityManager, $serializer);
    }

    #[Route('', name: 'get', methods: ['GET'])]
    public function getPreference(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', 401);
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', 404);
        }
        $repo = $this->entityManager->getRepository(UserPreference::class);
        $pref = $repo->findOneBy(['user' => $user]);
        if (!$pref) {
            return $this->notFoundResponse('Preference not found');
        }
        $data = [
            'drawerFull' => $pref->isDrawerFull(),
            'currentMonth' => $pref->getCurrentMonth(),
            'currentView' => $pref->getCurrentView(),
            'selectedTenant' => $pref->getSelectedTenant() ? [
                'id' => $pref->getSelectedTenant()->getId(),
                'name' => $pref->getSelectedTenant()->getName(),
            ] : null,
        ];
        return new JsonResponse($data);
    }

    #[Route('', name: 'update', methods: ['PUT'])]
    public function updatePreference(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', 401);
        }

        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', 404);
        }
        $repo = $this->entityManager->getRepository(UserPreference::class);
        $pref = $repo->findOneBy(['user' => $user]);
        if (!$pref) {
            $pref = new UserPreference();
            $pref->setUser($user);
        }
        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['drawerFull'])) $pref->setDrawerFull((bool)$data['drawerFull']);
        if (isset($data['currentMonth'])) $pref->setCurrentMonth($data['currentMonth']);
        if (isset($data['currentView'])) $pref->setCurrentView($data['currentView']);
        if (isset($data['selectedTenant']['id'])) {
            $tenantId = (int) $data['selectedTenant']['id'];

            $tenantRepo = $this->entityManager->getRepository(Tenant::class);
            $tenant = $tenantRepo->find($tenantId);
            if (!$tenant) {
                return $this->errorResponse('Tenant inválido', 400);
            }

            // 🔒 garante que o usuário tenha vínculo com este tenant
            $userTenantRepo = $this->entityManager->getRepository(UserTenant::class);
            $userTenant = $userTenantRepo->findOneBy(['user' => $user, 'tenant' => $tenant]);
            if (!$userTenant) {
                return $this->errorResponse('Usuário sem acesso a este tenant', 403);
            }

            $pref->setSelectedTenant($tenant);
        }
        $pref->setUpdatedAt(new \DateTime());
        $this->entityManager->persist($pref);
        $this->entityManager->flush();
        return $this->jsonResponse(['ok' => true]);
    }
}
