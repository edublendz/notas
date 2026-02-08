<?php

namespace App\Repository;

use App\Entity\Invoice;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Invoice>
 */
class InvoiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invoice::class);
    }

    public function findByTenant(Tenant $tenant, ?int $limit = null): array
    {
        $qb = $this->createQueryBuilder('i')
            ->where('i.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('i.monthIssue', 'DESC');

        if ($limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    public function findByCode(Tenant $tenant, string $code): ?Invoice
    {
        return $this->createQueryBuilder('i')
            ->where('i.tenant = :tenant')
            ->andWhere('i.code = :code')
            ->setParameter('tenant', $tenant)
            ->setParameter('code', $code)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
