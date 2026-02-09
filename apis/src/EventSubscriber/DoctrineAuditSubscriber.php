<?php

namespace App\EventSubscriber;

use App\Entity\AuditLog;
use App\Entity\User;
use App\Entity\Tenant;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Events;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Event Subscriber para auditoria automática de todas as entidades via Doctrine
 * Usa onFlush (padrão correto) em vez de postPersist/postUpdate/preRemove
 */
class DoctrineAuditSubscriber implements EventSubscriber
{
    private RequestStack $requestStack;

    // Entidades que NÃO devem ser auditadas automaticamente
    private array $excludedEntities = [
        AuditLog::class, // Evita loop infinito
    ];

    public function __construct(RequestStack $requestStack)
    {
        $this->requestStack = $requestStack;
    }

    public function getSubscribedEvents()
    {
        return [
            Events::onFlush,
        ];
    }

    /**
     * onFlush: Evento correto para auditoria sem causar flush recursivo
     */
    public function onFlush(OnFlushEventArgs $args): void
    {
        $em = $args->getObjectManager();
        $uow = $em->getUnitOfWork();

        // INSERTS (CREATE)
        foreach ($uow->getScheduledEntityInsertions() as $entity) {
            if ($this->shouldSkip($entity)) {
                continue;
            }

            $audit = $this->buildAudit('CREATE', $entity, $em);
            $em->persist($audit);

            $meta = $em->getClassMetadata(AuditLog::class);
            $uow->computeChangeSet($meta, $audit);
        }

        // UPDATES
        foreach ($uow->getScheduledEntityUpdates() as $entity) {
            if ($this->shouldSkip($entity)) {
                continue;
            }

            $audit = $this->buildAudit('UPDATE', $entity, $em);
            $em->persist($audit);

            $meta = $em->getClassMetadata(AuditLog::class);
            $uow->computeChangeSet($meta, $audit);
        }

        // DELETES
        foreach ($uow->getScheduledEntityDeletions() as $entity) {
            if ($this->shouldSkip($entity)) {
                continue;
            }

            $audit = $this->buildAudit('DELETE', $entity, $em);
            $em->persist($audit);

            $meta = $em->getClassMetadata(AuditLog::class);
            $uow->computeChangeSet($meta, $audit);
        }
    }

    /**
     * Verifica se deve pular a auditoria desta entidade
     */
    private function shouldSkip(object $entity): bool
    {
        foreach ($this->excludedEntities as $excludedClass) {
            if ($entity instanceof $excludedClass) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gera o nome da ação (ex: EXPENSE_CREATE, USER_UPDATE)
     */
    private function getActionName(object $entity, string $operation): string
    {
        $className = (new \ReflectionClass($entity))->getShortName();
        return strtoupper($className) . '_' . $operation;
    }

    /**
     * Obtém o ID da entidade usando reflection
     */
    private function getEntityId(object $entity): ?int
    {
        try {
            $reflection = new \ReflectionClass($entity);
            if ($reflection->hasMethod('getId')) {
                $id = $entity->getId();
                return $id ? (int)$id : null;
            }
        } catch (\Exception $e) {
            // Ignora se não conseguir pegar o ID
        }
        return null;
    }

    /**
     * Obtém o tipo da entidade (nome curto da classe)
     */
    private function getEntityType(object $entity): string
    {
        return (new \ReflectionClass($entity))->getShortName();
    }

    /**
     * Constrói o objeto AuditLog sem dar flush
     */
    private function buildAudit(string $operation, object $entity, $em): AuditLog
    {
        $action = $this->getActionName($entity, $operation);

        $audit = new AuditLog();
        $audit->setAction($action);
        $audit->setEntityType($this->getEntityType($entity));
        $audit->setEntityId($this->getEntityId($entity));
        
        // Extrai informação representativa da entidade para o meta
        $meta = $this->extractEntityInfo($entity);
        if ($meta) {
            $audit->setMeta($meta);
        }

        // Tenta obter user e tenant do JWT
        $request = $this->requestStack->getCurrentRequest();
        if ($request) {
            $claims = $request->attributes->get('user_claims');
            
            if ($claims) {
                $userId = $claims['uid'] ?? null;
                $tenantId = $claims['tenantId'] ?? null;

                // Usa getReference() em vez de find() (não faz query, só cria proxy)
                if ($userId) {
                    $actorUser = $em->getReference(User::class, $userId);
                    $audit->setActorUser($actorUser);
                }

                if ($tenantId) {
                    $tenant = $em->getReference(Tenant::class, $tenantId);
                    $audit->setTenant($tenant);
                }
            }
        }

        // Se a própria entidade tem tenant, usa ela (sobrescreve)
        if (method_exists($entity, 'getTenant') && $entity->getTenant()) {
            $audit->setTenant($entity->getTenant());
        }

        return $audit;
    }

    /**
     * Extrai informação representativa da entidade para mostrar no meta
     */
    private function extractEntityInfo(object $entity): ?string
    {
        $parts = [];
        
        // Tenta pegar código/identificador
        if (method_exists($entity, 'getCode') && $entity->getCode()) {
            $parts[] = $entity->getCode();
        }
        
        // Tenta pegar nome/título
        if (method_exists($entity, 'getName') && $entity->getName()) {
            $parts[] = $entity->getName();
        } elseif (method_exists($entity, 'getTitle') && $entity->getTitle()) {
            $parts[] = $entity->getTitle();
        }
        
        // Tenta pegar descrição (apenas primeiros 50 chars)
        if (empty($parts) && method_exists($entity, 'getDescription') && $entity->getDescription()) {
            $desc = $entity->getDescription();
            $parts[] = strlen($desc) > 50 ? substr($desc, 0, 50) . '...' : $desc;
        }
        
        // Para User, pega email
        if (empty($parts) && method_exists($entity, 'getEmail') && $entity->getEmail()) {
            $parts[] = $entity->getEmail();
        }
        
        return !empty($parts) ? implode(' - ', $parts) : null;
    }
}
