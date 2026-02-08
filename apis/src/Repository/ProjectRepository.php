<?php

namespace App\Repository;

use App\Entity\Project;
use App\Entity\Tenant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }

    public function findByTenant(Tenant $tenant, ?int $limit = null): array
    {
        $qb = $this->createQueryBuilder('p')
            ->where('p.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->orderBy('p.createdAt', 'DESC');

        if ($limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    public function findByCode(Tenant $tenant, string $code): ?Project
    {
        return $this->createQueryBuilder('p')
            ->where('p.tenant = :tenant')
            ->andWhere('p.code = :code')
            ->setParameter('tenant', $tenant)
            ->setParameter('code', $code)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
