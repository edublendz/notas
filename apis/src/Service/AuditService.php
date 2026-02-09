<?php

namespace App\Service;

use App\Entity\AuditLog;
use App\Entity\User;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Serviço centralizado para auditoria de ações customizadas
 * (login, logout, aprovações, etc)
 */
class AuditService
{
    private EntityManagerInterface $entityManager;
    private RequestStack $requestStack;

    public function __construct(
        EntityManagerInterface $entityManager,
        RequestStack $requestStack
    ) {
        $this->entityManager = $entityManager;
        $this->requestStack = $requestStack;
    }

    /**
     * Registra uma ação no log de auditoria
     *
     * @param string $action Ação realizada (ex: AUTH_LOGIN, EXPENSE_APPROVE)
     * @param string|null $meta Metadados adicionais (email, ID, token, etc)
     * @param User|null $actorUser Usuário que executou a ação (null se não logado)
     * @param Tenant|null $tenant Tenant relacionado (null para ações sem tenant)
     * @param string|null $entityType Tipo da entidade afetada (ex: 'Expense', 'User')
     * @param int|null $entityId ID da entidade afetada
     */
    public function log(
        string $action,
        ?string $meta = null,
        ?User $actorUser = null,
        ?Tenant $tenant = null,
        ?string $entityType = null,
        ?int $entityId = null
    ): void {
        try {
            // Se não foi passado user/tenant, tenta pegar da request
            if (!$actorUser || !$tenant) {
                $request = $this->requestStack->getCurrentRequest();
                if ($request) {
                    $claims = $request->attributes->get('user_claims');
                    
                    if ($claims && !$actorUser) {
                        $userId = $claims['uid'] ?? null; // FIX: JWT usa 'uid', não 'sub'
                        if ($userId) {
                            $actorUser = $this->entityManager->getRepository(User::class)->find($userId);
                        }
                    }
                    
                    if ($claims && !$tenant) {
                        $tenantId = $claims['tenantId'] ?? null;
                        if ($tenantId) {
                            $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
                        }
                    }
                }
            }

            $audit = new AuditLog();
            $audit->setAction($action);
            $audit->setMeta($meta);
            $audit->setActorUser($actorUser);
            $audit->setTenant($tenant);
            $audit->setEntityType($entityType);
            $audit->setEntityId($entityId);

            $this->entityManager->persist($audit);
            // flush() será feito pelo controller que chamou este método
        } catch (\Exception $e) {
            // Silenciosamente ignora erros de auditoria para não quebrar o fluxo principal
            error_log("Erro ao registrar auditoria: " . $e->getMessage());
        }
    }

    /**
     * Atalho para login
     */
    public function logLogin(User $user, string $email): void
    {
        $this->log('AUTH_LOGIN', $email, $user, null);
    }

    /**
     * Atalho para logout
     */
    public function logLogout(?User $user = null, ?string $meta = null): void
    {
        $this->log('AUTH_LOGOUT', $meta, $user, null);
    }

    /**
     * Atalho para troca de tenant
     */
    public function logTenantSwitch(User $user, Tenant $newTenant): void
    {
        $this->log('TENANT_SWITCH', 'Troca de empresa', $user, $newTenant);
    }

    /**
     * Atalho para aprovação de despesa
     */
    public function logExpenseApprove(int $expenseId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('EXPENSE_APPROVE', null, $actor, $tenant, 'Expense', $expenseId);
    }

    /**
     * Atalho para rejeição de despesa
     */
    public function logExpenseReject(int $expenseId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('EXPENSE_REJECT', null, $actor, $tenant, 'Expense', $expenseId);
    }

    /**
     * Atalho para aprovação de nota fiscal
     */
    public function logInvoiceApprove(int $invoiceId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('INVOICE_APPROVE', null, $actor, $tenant, 'Invoice', $invoiceId);
    }

    /**
     * Atalho para rejeição de nota fiscal
     */
    public function logInvoiceReject(int $invoiceId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('INVOICE_REJECT', null, $actor, $tenant, 'Invoice', $invoiceId);
    }

    /**
     * Atalho para aprovação de reembolso
     */
    public function logReimbursementApprove(int $reimbursementId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('REIMBURSEMENT_APPROVE', null, $actor, $tenant, 'Reimbursement', $reimbursementId);
    }

    /**
     * Atalho para rejeição de reembolso
     */
    public function logReimbursementReject(int $reimbursementId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('REIMBURSEMENT_REJECT', null, $actor, $tenant, 'Reimbursement', $reimbursementId);
    }

    /**
     * Atalho para aprovação de usuário
     */
    public function logUserApprove(int $userId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('USER_APPROVE', null, $actor, $tenant, 'User', $userId);
    }

    /**
     * Atalho para rejeição de usuário
     */
    public function logUserReject(int $userId, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('USER_REJECT', null, $actor, $tenant, 'User', $userId);
    }

    /**
     * Atalho para criação de convite
     */
    public function logInviteCreate(string $token, ?User $actor = null, ?Tenant $tenant = null): void
    {
        $this->log('INVITE_CREATE', $token, $actor, $tenant);
    }

    /**
     * Atalho para aceitação de convite
     */
    public function logInviteAccept(string $token, User $newUser): void
    {
        $this->log('INVITE_ACCEPT', $token, $newUser, null);
    }
}
