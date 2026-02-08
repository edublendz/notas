<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260208120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add client_id and project_id to invites table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE invites ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER role_id');
        $this->addSql('ALTER TABLE invites ADD COLUMN project_id BIGINT UNSIGNED NULL AFTER client_id');
        
        $this->addSql('ALTER TABLE invites ADD CONSTRAINT FK_invites_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invites ADD CONSTRAINT FK_invites_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE');
        
        $this->addSql('CREATE INDEX IDX_invites_client_id ON invites(client_id)');
        $this->addSql('CREATE INDEX IDX_invites_project_id ON invites(project_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE invites DROP FOREIGN KEY FK_invites_client_id');
        $this->addSql('ALTER TABLE invites DROP FOREIGN KEY FK_invites_project_id');
        $this->addSql('ALTER TABLE invites DROP INDEX IDX_invites_client_id');
        $this->addSql('ALTER TABLE invites DROP INDEX IDX_invites_project_id');
        $this->addSql('ALTER TABLE invites DROP COLUMN client_id');
        $this->addSql('ALTER TABLE invites DROP COLUMN project_id');
    }
}
