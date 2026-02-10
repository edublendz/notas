<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260210120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add invite_tenants junction table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE invite_tenants (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            invite_id BIGINT UNSIGNED NOT NULL,
            tenant_id BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT FK_invite_tenants_invite FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE,
            CONSTRAINT FK_invite_tenants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            CONSTRAINT UK_invite_tenants UNIQUE (invite_id, tenant_id),
            INDEX IDX_invite_tenants_invite (invite_id),
            INDEX IDX_invite_tenants_tenant (tenant_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE invite_tenants');
    }
}
