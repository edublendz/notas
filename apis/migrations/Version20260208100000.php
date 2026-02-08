<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260208100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add additional fields to projects table (type, URLs, dates, cost breakdown)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE projects ADD COLUMN cost_planned_nf DECIMAL(14,2) NULL AFTER cost_planned');
        $this->addSql('ALTER TABLE projects ADD COLUMN cost_planned_other DECIMAL(14,2) NULL AFTER cost_planned_nf');
        $this->addSql('ALTER TABLE projects ADD COLUMN type VARCHAR(32) NULL AFTER indicator_override_pct');
        $this->addSql('ALTER TABLE projects ADD COLUMN contract_url VARCHAR(512) NULL AFTER type');
        $this->addSql('ALTER TABLE projects ADD COLUMN dre_url VARCHAR(512) NULL AFTER contract_url');
        $this->addSql('ALTER TABLE projects ADD COLUMN start_date DATE NULL AFTER dre_url');
        $this->addSql('ALTER TABLE projects ADD COLUMN end_date DATE NULL AFTER start_date');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE projects DROP COLUMN cost_planned_nf');
        $this->addSql('ALTER TABLE projects DROP COLUMN cost_planned_other');
        $this->addSql('ALTER TABLE projects DROP COLUMN type');
        $this->addSql('ALTER TABLE projects DROP COLUMN contract_url');
        $this->addSql('ALTER TABLE projects DROP COLUMN dre_url');
        $this->addSql('ALTER TABLE projects DROP COLUMN start_date');
        $this->addSql('ALTER TABLE projects DROP COLUMN end_date');
    }
}
