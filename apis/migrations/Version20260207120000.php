<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260207120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Baseline migration - Database schema already exists with all tables and relationships';
    }

    public function up(Schema $schema): void
    {
        // This is a baseline migration
        // All tables were created manually in the existing database
        // This migration serves as a checkpoint for future schema changes
    }

    public function down(Schema $schema): void
    {
        // Intentionally left empty - this is a baseline migration
    }
}
