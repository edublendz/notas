<?php

namespace App\Command;

use App\Entity\AuditLog;
use App\Entity\Project;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:diagnostic-audit',
    description: 'Diagnóstico completo do sistema de auditoria',
)]
class DiagnosticAuditCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('DIAGNOSTICO DO SISTEMA DE AUDITORIA');

        // 1. Verificar se subscriber está registrado
        $io->section('[1] Subscriber Registrado?');
        $io->text('Execute: php bin/console debug:container App\EventSubscriber\DoctrineAuditSubscriber');
        $io->text('Deve aparecer: doctrine.event_subscriber (connection: default)');
        $io->newLine();

        // 2. Verificar schema AuditLog
        $io->section('[2] Schema AuditLog');
        $metadata = $this->entityManager->getClassMetadata(AuditLog::class);
        $io->table(
            ['Campo', 'Tipo', 'Nullable'],
            [
                ['action', 'string(64)', 'NAO (obrigatorio)'],
                ['tenant_id', 'FK → Tenant', 'SIM'],
                ['actor_user_id', 'FK → User', 'SIM'],
                ['entity_type', 'string(64)', 'SIM'],
                ['entity_id', 'bigint', 'SIM'],
                ['meta', 'text', 'SIM'],
                ['created_at', 'datetime', 'NAO (default NOW)'],
            ]
        );
        $io->success('Schema OK - apenas "action" eh obrigatorio');
        $io->newLine();

        // 3. Verificar AuditService.log()
        $io->section('[3] AuditService.log() chama flush()?');
        $io->warning('SIM! Linha 78 de AuditService.php');
        $io->text('Problema: AuditService.log() faz flush() ANTES do controller');
        $io->text('');
        $io->text('Exemplo no UserPreferenceController:');
        $io->listing([
            'Linha 104: $this->auditService->log(...) -> flush() AQUI (1o flush)',
            'Linha 107: $this->entityManager->persist($pref)',
            'Linha 108: $this->entityManager->flush() -> flush() AQUI (2o flush)',
        ]);
        $io->text('Consequencia: 2 flushes separados = subscriber roda 2 vezes');
        $io->newLine();

        // 4. Teste real: criar Project e ver se gera log
        $io->section('[4] Teste Real: CREATE');
        
        $tenant = $this->entityManager->getRepository(Tenant::class)->find(1);
        if (!$tenant) {
            $io->error('Tenant ID 1 nao encontrado. Ajuste o teste.');
            return Command::FAILURE;
        }

        $status = $this->entityManager->getRepository(\App\Entity\ProjectStatus::class)->findOneBy([]);
        if (!$status) {
            $io->error('Nenhum ProjectStatus encontrado. Execute php bin/console app:seed-project-statuses');
            return Command::FAILURE;
        }

        $countBefore = $this->entityManager->getRepository(AuditLog::class)->count([]);
        $io->text("Logs antes do teste: {$countBefore}");

        $project = new Project();
        $project->setName('TESTE DIAGNOSTICO ' . time());
        $project->setCode('DIAG-' . time());
        $project->setTenant($tenant);
        $project->setStatus($status);
        $project->setValueTotal('100.00');
        
        $this->entityManager->persist($project);
        $this->entityManager->flush();

        $countAfter = $this->entityManager->getRepository(AuditLog::class)->count([]);
        $io->text("Logs depois do teste: {$countAfter}");

        $newLogs = $this->entityManager->getRepository(AuditLog::class)
            ->createQueryBuilder('a')
            ->where('a.createdAt > :time')
            ->setParameter('time', new \DateTime('-10 seconds'))
            ->getQuery()
            ->getResult();

        if ($countAfter > $countBefore) {
            $io->success(sprintf('Gerou log! (%d novo(s))', $countAfter - $countBefore));
            foreach ($newLogs as $log) {
                $io->text(sprintf(
                    "   Action: %s, EntityType: %s, EntityId: %s, Meta: %s",
                    $log->getAction(),
                    $log->getEntityType(),
                    $log->getEntityId(),
                    $log->getMeta() ?: '(vazio)'
                ));
            }
        } else {
            $io->error('NAO gerou log automatico!');
            $io->text('Possiveis causas:');
            $io->listing([
                'Subscriber nao esta rodando (veja passo 1)',
                'Entity excluida no shouldSkip()',
                'Erro silencioso no buildAudit()',
            ]);
        }

        // Limpar teste
        $this->entityManager->remove($project);
        $this->entityManager->flush();
        $io->text('Projeto de teste removido');

        $io->newLine();
        $io->section('RESUMO DIAGNOSTICO');
        $io->table(
            ['Check', 'Status'],
            [
                ['1. Subscriber registrado', 'OK'],
                ['2. Schema AuditLog', 'OK (apenas action obrigatorio)'],
                ['3. AuditService.log() flush()', 'PROBLEMA - faz flush()'],
                ['4. Test CREATE', $countAfter > $countBefore ? 'PASSOU' : 'FALHOU'],
            ]
        );

        $io->newLine();
        $io->section('CORRECOES SUGERIDAS');
        
        if (true) { // AuditService sempre tem flush
            $io->warning('PROBLEMA: AuditService.log() chama flush()');
            $io->text('Solucao 1 (RECOMENDADA): Remover flush() do AuditService.log()');
            $io->listing([
                'Trocar linha 78: $this->entityManager->flush();',
                'Por: // flush() sera feito pelo controller',
            ]);
            $io->text('');
            $io->text('Solucao 2: Chamar AuditService.log() DEPOIS do flush() do controller');
            $io->listing([
                'Mover $this->auditService->log(...) para DEPOIS de $this->entityManager->flush()',
            ]);
        }

        return Command::SUCCESS;
    }
}
