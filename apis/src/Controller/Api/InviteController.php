<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Invite;
use App\Entity\User;
use App\Entity\Role;
use App\Entity\UserStatus;
use App\Entity\Client;
use App\Entity\Project;
use App\Entity\Tenant;
use App\Entity\InviteClient;
use App\Entity\InviteProject;
use App\Entity\InviteTenant;
use App\Repository\InviteRepository;
use App\Service\PasswordHasher;
use App\Service\AuditService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

class InviteController extends BaseController
{
    private PasswordHasher $passwordHasher;
    private AuditService $auditService;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        PasswordHasher $passwordHasher,
        AuditService $auditService,
        private InviteRepository $inviteRepository
    ) {
        parent::__construct($entityManager, $serializer);
        $this->passwordHasher = $passwordHasher;
        $this->auditService = $auditService;
    }

    #[Route('/api/invites', name: 'api_invites_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        // Return ALL invites from database (not filtered by tenant)
        $invites = $this->inviteRepository->createQueryBuilder('i')
            ->leftJoin('i.inviteClients', 'ic')
            ->leftJoin('ic.client', 'c')
            ->leftJoin('i.inviteProjects', 'ip')
            ->leftJoin('ip.project', 'p')
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $data = array_map(function($inv) {
            // Get all clients for this invite
            $clients = array_map(fn($ic) => [
                'id' => $ic->getClient()->getId(),
                'name' => $ic->getClient()->getName(),
            ], $inv->getInviteClients()->toArray());

            // Get all projects for this invite
            $projects = array_map(fn($ip) => [
                'id' => $ip->getProject()->getId(),
                'name' => $ip->getProject()->getName(),
            ], $inv->getInviteProjects()->toArray());

            $tenants = array_map(fn($it) => [
                'id' => $it->getTenant()->getId(),
                'name' => $it->getTenant()->getName(),
            ], $inv->getInviteTenants()->toArray());

            return [
                'id' => $inv->getId(),
                'email' => $inv->getEmail(),
                'role' => $inv->getRole() ? [
                    'id' => $inv->getRole()->getId(),
                    'code' => $inv->getRole()->getCode(),
                    'name' => $inv->getRole()->getName(),
                ] : null,
                'clients' => $clients,
                'projects' => $projects,
                'tenants' => $tenants,
                'expiresAt' => $inv->getExpiresAt()->format('Y-m-d H:i:s'),
                'acceptedAt' => $inv->getAcceptedAt()?->format('Y-m-d H:i:s'),
                'status' => $inv->getAcceptedAt() ? 'ACCEPTED' : (new \DateTime() > $inv->getExpiresAt() ? 'EXPIRED' : 'ACTIVE'),
                'createdAt' => $inv->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }, $invites);

        return $this->jsonResponse(['data' => $data]);
    }

    #[Route('/api/invites', name: 'api_invites_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = $this->getJsonBody($request);
            $email = trim($data['email'] ?? '');
            $roleId = $data['roleId'] ?? null;
            $tenantLinks = $data['tenants'] ?? [];
            $expiresInDays = $data['expiresInDays'] ?? 7;

            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->errorResponse('Email inválido', 400, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            if (!$roleId) {
                return $this->errorResponse('Role ID obrigatório', 400, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            if (empty($tenantLinks) || !is_array($tenantLinks)) {
                return $this->errorResponse('Selecione pelo menos um tenant', 400, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            $role = $this->entityManager->getRepository(Role::class)->find($roleId);
            if (!$role) {
                return $this->errorResponse('Role não encontrado', 404, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            $tenants = [];
            $clients = [];
            $projects = [];
            $seenClientIds = [];
            $seenProjectIds = [];

            foreach ($tenantLinks as $link) {
                $tenantId = $link['tenantId'] ?? null;
                if (!$tenantId) {
                    return $this->errorResponse('Tenant inválido', 400, [
                        'debug' => [
                            'data' => $data,
                            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                        ]
                    ]);
                }

                $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
                if (!$tenant) {
                    return $this->errorResponse("Tenant ID {$tenantId} não encontrado", 404, [
                        'debug' => [
                            'data' => $data,
                            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                        ]
                    ]);
                }
                $tenants[$tenantId] = $tenant;

                $clientIds = $link['clientIds'] ?? [];
                if (!is_array($clientIds)) {
                    return $this->errorResponse('Clientes inválidos', 400, [
                        'debug' => [
                            'data' => $data,
                            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                        ]
                    ]);
                }

                if (empty($clientIds)) {
                    $tenantClients = $this->entityManager->getRepository(Client::class)
                        ->findBy(['tenant' => $tenant]);

                    if (empty($tenantClients)) {
                        return $this->errorResponse('Nenhum cliente disponível para este tenant', 400, [
                            'debug' => [
                                'data' => $data,
                                'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                            ]
                        ]);
                    }

                    foreach ($tenantClients as $client) {
                        $clientId = $client->getId();
                        if (isset($seenClientIds[$clientId])) {
                            continue;
                        }
                        $clients[] = $client;
                        $seenClientIds[$clientId] = true;
                    }
                } else {
                    foreach ($clientIds as $clientId) {
                        if (isset($seenClientIds[$clientId])) {
                            continue;
                        }

                        $client = $this->entityManager->getRepository(Client::class)->find($clientId);
                        if (!$client) {
                            return $this->errorResponse("Cliente ID {$clientId} não encontrado", 404, [
                                'debug' => [
                                    'data' => $data,
                                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                                ]
                            ]);
                        }
                        if ($client->getTenant()->getId() !== $tenant->getId()) {
                            return $this->errorResponse('Cliente não pertence ao tenant selecionado', 400, [
                                'debug' => [
                                    'data' => $data,
                                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                                ]
                            ]);
                        }

                        $clients[] = $client;
                        $seenClientIds[$clientId] = true;
                    }
                }

                $projectIds = $link['projectIds'] ?? [];
                if (!empty($projectIds) && is_array($projectIds)) {
                    foreach ($projectIds as $projectId) {
                        if (isset($seenProjectIds[$projectId])) {
                            continue;
                        }

                        $project = $this->entityManager->getRepository(Project::class)->find($projectId);
                        if (!$project) {
                            return $this->errorResponse("Projeto ID {$projectId} não encontrado", 404, [
                                'debug' => [
                                    'data' => $data,
                                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                                ]
                            ]);
                        }
                        if ($project->getTenant()->getId() !== $tenant->getId()) {
                            return $this->errorResponse('Projeto não pertence ao tenant selecionado', 400, [
                                'debug' => [
                                    'data' => $data,
                                    'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                                ]
                            ]);
                        }

                        $projects[] = $project;
                        $seenProjectIds[$projectId] = true;
                    }
                }
            }

            $primaryTenant = array_values($tenants)[0] ?? null;
            if (!$primaryTenant) {
                return $this->errorResponse('Tenant não encontrado', 400, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            // Check if invite already exists for this email/tenant
            $existing = $this->inviteRepository->findOneBy([
                'tenant' => $primaryTenant,
                'email' => $email,
            ]);

            if ($existing && !$existing->getAcceptedAt() && new \DateTime() < $existing->getExpiresAt()) {
                return $this->errorResponse('Convite já existe para este email', 409, [
                    'debug' => [
                        'data' => $data,
                        'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS)
                    ]
                ]);
            }

            // Generate token
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);

            $invite = new Invite();
            $invite->setTenant($primaryTenant);
            $invite->setEmail($email);
            $invite->setRole($role);
            $invite->setTokenHash($tokenHash);
            
            $expiresAt = new \DateTime();
            $expiresAt->modify("+{$expiresInDays} days");
            $invite->setExpiresAt($expiresAt);

            // Add clients
            foreach ($clients as $client) {
                $inviteClient = new InviteClient();
                $inviteClient->setClient($client);
                $invite->addInviteClient($inviteClient);
            }

            foreach ($tenants as $tenant) {
                $inviteTenant = new InviteTenant();
                $inviteTenant->setTenant($tenant);
                $invite->addInviteTenant($inviteTenant);
            }

            // Add projects
            foreach ($projects as $project) {
                $inviteProject = new InviteProject();
                $inviteProject->setProject($project);
                $invite->addInviteProject($inviteProject);
            }

            $this->entityManager->persist($invite);
            $this->entityManager->flush();

            // Registrar criação de convite na auditoria
            $userId = $this->getCurrentUserId($request);
            $actor = $userId ? $this->entityManager->getRepository(User::class)->find($userId) : null;
            $this->auditService->logInviteCreate($token, $actor, $primaryTenant);

            return $this->createdResponse([
                'id' => $invite->getId(),
                'email' => $invite->getEmail(),
                'token' => $token, // Return full token only on creation
                'expiresAt' => $invite->getExpiresAt()->format('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Erro inesperado ao criar convite', 500, [
                'debug' => [
                    'exception' => $e->getMessage(),
                    'trace' => $e->getTrace(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ]);
        }
    }

    #[Route('/api/invites/{id}', name: 'api_invites_revoke', methods: ['DELETE'])]
    public function revoke(Request $request, int $id): JsonResponse
    {
        $tenant = $this->getSelectedTenant($request);
        if (!$tenant) {
            return $this->errorResponse('Tenant não encontrado', 400);
        }

        $invite = $this->inviteRepository->find($id);
        if (!$invite) {
            return $this->notFoundResponse('Convite não encontrado');
        }

        if ($invite->getTenant()->getId() !== $tenant->getId()) {
            return $this->forbiddenResponse('Acesso negado');
        }

        if ($invite->getAcceptedAt()) {
            return $this->errorResponse('Convite já foi aceito', 400);
        }

        $this->entityManager->remove($invite);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Convite revogado com sucesso']);
    }

    #[Route('/api/public/invites/validate', name: 'api_invites_validate', methods: ['POST'])]
    public function validate(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        $token = $data['token'] ?? '';

        if (!$token) {
            return $this->errorResponse('Token obrigatório', 400);
        }

        $tokenHash = hash('sha256', $token);
        $invite = $this->inviteRepository->findOneBy(['tokenHash' => $tokenHash]);

        if (!$invite) {
            return $this->errorResponse('Convite inválido', 404);
        }

        if ($invite->getAcceptedAt()) {
            return $this->errorResponse('Convite já foi aceito', 400);
        }

        if (new \DateTime() > $invite->getExpiresAt()) {
            return $this->errorResponse('Convite expirado', 400);
        }

        return $this->jsonResponse([
            'valid' => true,
            'email' => $invite->getEmail(),
            'tenant' => [
                'id' => $invite->getTenant()->getId(),
                'name' => $invite->getTenant()->getName(),
            ],
            'role' => [
                'id' => $invite->getRole()->getId(),
                'code' => $invite->getRole()->getCode(),
                'name' => $invite->getRole()->getName(),
            ],
        ]);
    }

    #[Route('/api/public/invites/accept', name: 'api_invites_accept', methods: ['POST'])]
    public function accept(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        $token = $data['token'] ?? '';
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$token || !$name || !$email || !$password) {
            return $this->errorResponse('Todos os campos são obrigatórios', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Email inválido', 400);
        }

        $tokenHash = hash('sha256', $token);
        
        // Find invite (simple query, just like UserController does simple finds)
        $invite = $this->inviteRepository->findOneBy(['tokenHash' => $tokenHash]);

        if (!$invite) {
            return $this->errorResponse('Convite inválido', 404);
        }

        if ($invite->getAcceptedAt()) {
            return $this->errorResponse('Convite já foi aceito', 400);
        }

        if (new \DateTime() > $invite->getExpiresAt()) {
            return $this->errorResponse('Convite expirado', 400);
        }

        // Check if user already exists
        $existingUser = $this->entityManager->getRepository(User::class)
            ->findOneBy(['email' => $email]);

        if ($existingUser) {
            return $this->errorResponse('Email já cadastrado', 409);
        }

        // Get Role and Status from database (exactly like UserController does)
        $role = $this->entityManager->getRepository(Role::class)->find($invite->getRole()->getId());
        $status = $this->entityManager->getRepository(UserStatus::class)->findOneBy(['code' => 'PENDING']);

        if (!$role || !$status) {
            return $this->errorResponse('Role ou Status não encontrado', 500);
        }

        // Create user (exactly like UserController does)
        $user = new User();
        $user->setName($name);
        $user->setEmail($email);
        $user->setPasswordHash($this->passwordHasher->hash($user, $password));
        $user->setRole($role);
        $user->setStatus($status);
        $user->setActive(true);

        $this->entityManager->persist($user);

        // Load invite tenants, clients and projects (if needed)
        $inviteTenants = $this->entityManager->getRepository(InviteTenant::class)
            ->findBy(['invite' => $invite]);

        $inviteClients = $this->entityManager->getRepository(\App\Entity\InviteClient::class)
            ->findBy(['invite' => $invite]);
        
        $inviteProjects = $this->entityManager->getRepository(\App\Entity\InviteProject::class)
            ->findBy(['invite' => $invite]);

        // Create one UserTenant per tenant (avoid duplicate composite keys)
        $seenTenantIds = [];
        $tenantsToLink = [];
        if (!empty($inviteTenants)) {
            foreach ($inviteTenants as $inviteTenant) {
                $tenant = $inviteTenant->getTenant();
                $tenantsToLink[$tenant->getId()] = $tenant;
            }
        } else {
            foreach ($inviteClients as $inviteClient) {
                $tenant = $inviteClient->getClient()->getTenant();
                $tenantsToLink[$tenant->getId()] = $tenant;
            }
        }

        foreach ($tenantsToLink as $tenantId => $tenant) {
            if (isset($seenTenantIds[$tenantId])) {
                continue;
            }

            $existingUserTenant = $this->entityManager->getRepository(\App\Entity\UserTenant::class)
                ->findOneBy(['user' => $user, 'tenant' => $tenant]);

            if (!$existingUserTenant) {
                $userTenant = new \App\Entity\UserTenant();
                $userTenant->setUser($user);
                $userTenant->setTenant($tenant);
                $userTenant->setRole($role); // CRITICAL: UserTenant also needs role_id
                $this->entityManager->persist($userTenant);
            }

            $seenTenantIds[$tenantId] = true;
        }

        // Create ProjectUser relationship for each project in the invite
        foreach ($inviteProjects as $inviteProject) {
            $projectUser = new \App\Entity\ProjectUser();
            $projectUser->setProject($inviteProject->getProject());
            $projectUser->setUser($user);
            $this->entityManager->persist($projectUser);
        }

        // Mark invite as accepted
        $invite->setAcceptedAt(new \DateTime());
        
        $this->entityManager->flush();

        // Registrar aceitação de convite na auditoria
        $this->auditService->logInviteAccept($token, $user);

        return $this->createdResponse([
            'message' => 'Cadastro realizado com sucesso. Aguarde aprovação.',
            'userId' => $user->getId(),
            'status' => 'PENDING',
        ]);
    }
}
