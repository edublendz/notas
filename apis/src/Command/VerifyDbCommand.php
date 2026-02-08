<?php

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:verify-db', description: 'Verifica a conexão com o banco e a presença da tabela users')]
class VerifyDbCommand extends Command
{
    private EntityManagerInterface $em;

    public function __construct(EntityManagerInterface $em)
    {
        parent::__construct();
        $this->em = $em;
    }

    protected function configure(): void
    {
        // Sem argumentos adicionais
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $conn = $this->em->getConnection();
            $dbName = $conn->getDatabase();
            $output->writeln("DB: " . $dbName);

            $stmt = $conn->executeQuery("SHOW TABLES");
            $tables = $stmt->fetchAllAssociative();
            $tableNames = array_map(function($row){ return array_values($row)[0]; }, $tables);
            $output->writeln("Tables: " . implode(', ', $tableNames));

            if (in_array('users', $tableNames)) {
                $output->writeln("Table 'users' exists.");
            } else {
                $output->writeln("Table 'users' NOT found!");
            }

            // Sample query
            $sample = $conn->executeQuery("SELECT id, email, password_hash FROM users LIMIT 5");
            $rows = $sample->fetchAllAssociative();
            foreach ($rows as $r) {
                $output->writeln(print_r($r, true));
            }

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $output->writeln("Error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
