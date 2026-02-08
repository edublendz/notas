<?php

namespace App\Repository;

use App\Entity\Expense;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Expense>
 */
class ExpenseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Expense::class);
    }

    public function findByTenant(Tenant $tenant, ?int $limit = null): array
    {
        $qb = $this->createQueryBuilder('e')
            ->where('e.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('e.dateBuy', 'DESC');

        if ($limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    public function findByTenantAndStatus(Tenant $tenant, int $statusId): array
    {
        return $this->createQueryBuilder('e')
            ->where('e.tenant = :tenant')
            ->andWhere('e.status = :statusId')
            ->setParameter('tenant', $tenant)
            ->setParameter('statusId', $statusId)
            ->orderBy('e.dateBuy', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
