<?php

namespace App\Repository;

use App\Entity\ReimbursementStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReimbursementStatus>
 */
class ReimbursementStatusRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReimbursementStatus::class);
    }
}
