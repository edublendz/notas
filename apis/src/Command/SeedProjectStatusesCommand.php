<?php

namespace App\Command;

use App\Entity\ProjectStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:seed-project-statuses',
    description: 'Seeds the project_status table with default statuses'
)]
class SeedProjectStatusesCommand extends Command
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $statuses = [
            ['code' => 'TO_START', 'name' => 'A iniciar'],
            ['code' => 'IN_PROGRESS', 'name' => 'Em andamento'],
            ['code' => 'READY_TO_INVOICE', 'name' => 'Liberado para Faturamento'],
            ['code' => 'INVOICED', 'name' => 'Faturado'],
        ];

        $repo = $this->entityManager->getRepository(ProjectStatus::class);

        foreach ($statuses as $statusData) {
            $existing = $repo->findOneBy(['code' => $statusData['code']]);
            if (!$existing) {
                $status = new ProjectStatus();
                $status->setCode($statusData['code']);
                $status->setName($statusData['name']);
                $this->entityManager->persist($status);
                $output->writeln("✅ Criado: {$statusData['name']}");
            } else {
                $output->writeln("⏭️ Já existe: {$statusData['name']}");
            }
        }

        $this->entityManager->flush();
        $output->writeln("✅ Status de projeto populados!");

        return Command::SUCCESS;
    }
}
