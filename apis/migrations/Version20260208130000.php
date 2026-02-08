<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260208130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Replace client_id/project_id with many-to-many tables (invite_clients, invite_projects)';
    }

    public function up(Schema $schema): void
    {
        // Remove old single-client/project columns
        $this->addSql('ALTER TABLE invites DROP FOREIGN KEY FK_invites_client_id');
        $this->addSql('ALTER TABLE invites DROP FOREIGN KEY FK_invites_project_id');
        $this->addSql('ALTER TABLE invites DROP INDEX IDX_invites_client_id');
        $this->addSql('ALTER TABLE invites DROP INDEX IDX_invites_project_id');
        $this->addSql('ALTER TABLE invites DROP COLUMN client_id');
        $this->addSql('ALTER TABLE invites DROP COLUMN project_id');

        // Create invite_clients junction table
        $this->addSql('CREATE TABLE invite_clients (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            invite_id BIGINT UNSIGNED NOT NULL,
            client_id BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT FK_invite_clients_invite FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
            CONSTRAINT FK_invite_clients_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            CONSTRAINT UK_invite_clients UNIQUE (invite_id, client_id),
            INDEX IDX_invite_clients_invite (invite_id),
            INDEX IDX_invite_clients_client (client_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

        // Create invite_projects junction table
        $this->addSql('CREATE TABLE invite_projects (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            invite_id BIGINT UNSIGNED NOT NULL,
            project_id BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT FK_invite_projects_invite FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
            CONSTRAINT FK_invite_projects_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            CONSTRAINT UK_invite_projects UNIQUE (invite_id, project_id),
            INDEX IDX_invite_projects_invite (invite_id),
            INDEX IDX_invite_projects_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE invite_projects');
        $this->addSql('DROP TABLE invite_clients');
        
        $this->addSql('ALTER TABLE invites ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER role_id');
        $this->addSql('ALTER TABLE invites ADD COLUMN project_id BIGINT UNSIGNED NULL AFTER client_id');
        $this->addSql('ALTER TABLE invites ADD CONSTRAINT FK_invites_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE invites ADD CONSTRAINT FK_invites_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE');
        $this->addSql('CREATE INDEX IDX_invites_client_id ON invites(client_id)');
        $this->addSql('CREATE INDEX IDX_invites_project_id ON invites(project_id)');
    }
}
