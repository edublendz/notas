-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: notas
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `actor_user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `entity_type` varchar(64) DEFAULT NULL,
  `entity_id` bigint(20) unsigned DEFAULT NULL,
  `meta` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_tenant_date` (`tenant_id`,`created_at`),
  KEY `idx_audit_actor_date` (`actor_user_id`,`created_at`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-08 09:15:46'),(2,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-08 09:40:02'),(3,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-08 09:53:53'),(4,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-08 10:04:04'),(5,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-08 12:13:24'),(6,1,1,'TENANT_SWITCH',NULL,NULL,'Troca de empresa','2026-02-08 12:18:06'),(7,2,1,'TENANT_SWITCH',NULL,NULL,'Troca de empresa','2026-02-08 12:18:15'),(8,NULL,1,'AUTH_LOGIN',NULL,NULL,'master@corp.com','2026-02-09 02:06:47'),(9,2,1,'TENANT_SWITCH',NULL,NULL,'De \'Typic\' para \'Diapason\'','2026-02-09 02:06:57'),(10,1,1,'TENANT_SWITCH',NULL,NULL,'De \'Diapason\' para \'Typic\'','2026-02-09 02:18:48'),(11,1,NULL,'PROJECT_CREATE','Project',NULL,NULL,'2026-02-09 02:22:01'),(12,1,NULL,'PROJECT_DELETE','Project',20,NULL,'2026-02-09 02:22:01'),(13,1,1,'EXPENSE_UPDATE','Expense',17,NULL,'2026-02-09 02:22:18'),(14,1,NULL,'PROJECT_CREATE','Project',NULL,'DIAG-1770603932 - TESTE DIAGNOSTICO 1770603932','2026-02-09 02:25:32'),(15,1,NULL,'PROJECT_DELETE','Project',21,'DIAG-1770603932 - TESTE DIAGNOSTICO 1770603932','2026-02-09 02:25:32'),(16,1,1,'EXPENSE_UPDATE','Expense',17,NULL,'2026-02-09 02:25:56'),(17,1,1,'PROJECT_UPDATE','Project',1,'TYPIC-PRJ-1001 - Projeto Typic 01 A2','2026-02-09 02:26:45'),(18,1,1,'REIMBURSEMENT_UPDATE','Reimbursement',8,'Nova','2026-02-09 02:26:59'),(19,1,1,'CLIENT_UPDATE','Client',8,'CLI-003 - Kikos','2026-02-09 02:27:11'),(20,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:39:44'),(21,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:40:20'),(22,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:40:33'),(23,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:40:43'),(24,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:43:47'),(25,NULL,NULL,'USERPREFERENCE_UPDATE','UserPreference',NULL,NULL,'2026-02-09 02:45:33');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(128) NOT NULL,
  `doc` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clients_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_clients_tenant_id` (`tenant_id`,`id`),
  KEY `idx_clients_tenant` (`tenant_id`),
  CONSTRAINT `fk_clients_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,1,'CLI-1001','Squadra','00.000.000/0001-01','2026-02-06 00:11:06'),(2,1,'CLI-1002','PrimeControl','00.000.000/0001-02','2026-02-06 00:11:06'),(3,2,'CLI-2001','Expo Canabis','00.000.000/0001-03','2026-02-06 00:11:06'),(4,2,'CLI-2002','Tabu','00.000.000/0001-04','2026-02-06 00:11:06'),(5,3,'CLI-3001','Cliente VDT 01','00.000.000/0001-05','2026-02-06 00:11:06'),(6,3,'CLI-3002','Cliente VDT 02','00.000.000/0001-06','2026-02-06 00:11:06'),(8,1,'CLI-003','Kikos','111111111111111112','2026-02-08 06:58:08');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctrine_migration_versions`
--

DROP TABLE IF EXISTS `doctrine_migration_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctrine_migration_versions`
--

LOCK TABLES `doctrine_migration_versions` WRITE;
/*!40000 ALTER TABLE `doctrine_migration_versions` DISABLE KEYS */;
INSERT INTO `doctrine_migration_versions` VALUES ('DoctrineMigrations\\Version20260207120000','2026-02-07 03:53:17',5),('DoctrineMigrations\\Version20260208100000','2026-02-08 06:47:41',151),('DoctrineMigrations\\Version20260208120000','2026-02-08 07:49:21',403),('DoctrineMigrations\\Version20260208130000','2026-02-08 07:55:29',175);
/*!40000 ALTER TABLE `doctrine_migration_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_status`
--

DROP TABLE IF EXISTS `expense_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_expense_status_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_status`
--

LOCK TABLES `expense_status` WRITE;
/*!40000 ALTER TABLE `expense_status` DISABLE KEYS */;
INSERT INTO `expense_status` VALUES (1,'APPROVED','Aprovada'),(2,'SENT','Enviada'),(3,'REJECTED','Reprovada'),(4,'INVOICED','Faturada');
/*!40000 ALTER TABLE `expense_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned DEFAULT NULL,
  `service_id` bigint(20) unsigned DEFAULT NULL,
  `status_id` bigint(20) unsigned NOT NULL,
  `requester_user_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `complement` varchar(255) DEFAULT NULL,
  `value` decimal(14,2) NOT NULL,
  `date_buy` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_expenses_tenant_id` (`tenant_id`,`id`),
  KEY `idx_exp_tenant_date` (`tenant_id`,`date_buy`),
  KEY `idx_exp_tenant_status` (`tenant_id`,`status_id`),
  KEY `idx_exp_project` (`project_id`),
  KEY `idx_exp_service` (`service_id`),
  KEY `idx_exp_requester` (`requester_user_id`),
  KEY `fk_exp_status` (`status_id`),
  KEY `fk_exp_project_tenant` (`tenant_id`,`project_id`),
  CONSTRAINT `fk_exp_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_exp_project_tenant` FOREIGN KEY (`tenant_id`, `project_id`) REFERENCES `projects` (`tenant_id`, `id`),
  CONSTRAINT `fk_exp_requester` FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exp_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_exp_status` FOREIGN KEY (`status_id`) REFERENCES `expense_status` (`id`),
  CONSTRAINT `fk_exp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,3,9,1,1,7,NULL,'Uber aeroporto',180.00,'2026-01-05','2026-02-06 01:03:16','2026-02-06 01:03:16'),(2,3,10,2,1,7,NULL,'Almoço com cliente',95.50,'2026-01-06','2026-02-06 01:03:16','2026-02-06 01:03:16'),(3,3,9,3,1,7,NULL,'teste',50.00,'2026-01-16','2026-02-06 01:03:16','2026-02-06 01:03:16'),(4,3,9,3,1,7,NULL,'teste',2.00,'2026-01-18','2026-02-06 01:03:16','2026-02-06 01:03:16'),(5,3,9,2,1,7,NULL,'dasd',222.00,'2026-01-18','2026-02-06 01:03:16','2026-02-06 01:03:16'),(6,1,1,4,1,1,NULL,NULL,50.00,'2026-01-20','2026-02-06 01:03:16','2026-02-06 01:03:16'),(7,1,1,4,1,1,NULL,'ssss',222.00,'2026-01-20','2026-02-06 01:03:16','2026-02-06 01:03:16'),(8,1,1,4,1,1,NULL,'aaaa',2222.00,'2026-01-20','2026-02-06 01:03:16','2026-02-06 01:03:16'),(9,1,1,4,1,1,NULL,'x',26.00,'2026-01-21','2026-02-06 01:03:16','2026-02-06 01:03:16'),(10,1,1,4,1,1,NULL,'testeadc',26000.00,'2026-01-31','2026-02-06 01:03:16','2026-02-08 06:54:10'),(11,1,2,4,1,1,NULL,'dssd',10000.00,'2026-01-07','2026-02-06 01:03:16','2026-02-06 01:03:16'),(12,1,3,4,1,1,NULL,'limite',26.25,'2026-01-21','2026-02-06 01:03:16','2026-02-06 01:03:16'),(13,1,3,4,1,1,NULL,'limite',26250.00,'2026-01-21','2026-02-06 01:03:16','2026-02-06 01:03:16'),(16,1,3,5,1,1,NULL,'nova des',50.00,'2026-01-09','2026-02-08 04:32:33','2026-02-08 01:46:19'),(17,1,1,5,1,1,NULL,'teste4xA',55.60,'2026-02-08','2026-02-08 10:10:19','2026-02-08 23:25:56');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invite_clients`
--

DROP TABLE IF EXISTS `invite_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invite_clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invite_id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_invite_clients` (`invite_id`,`client_id`),
  KEY `IDX_invite_clients_invite` (`invite_id`),
  KEY `IDX_invite_clients_client` (`client_id`),
  CONSTRAINT `FK_invite_clients_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_invite_clients_invite` FOREIGN KEY (`invite_id`) REFERENCES `invites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invite_clients`
--

LOCK TABLES `invite_clients` WRITE;
/*!40000 ALTER TABLE `invite_clients` DISABLE KEYS */;
INSERT INTO `invite_clients` VALUES (6,6,1,'2026-02-08 08:11:34');
/*!40000 ALTER TABLE `invite_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invite_projects`
--

DROP TABLE IF EXISTS `invite_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invite_projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invite_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_invite_projects` (`invite_id`,`project_id`),
  KEY `IDX_invite_projects_invite` (`invite_id`),
  KEY `IDX_invite_projects_project` (`project_id`),
  CONSTRAINT `FK_invite_projects_invite` FOREIGN KEY (`invite_id`) REFERENCES `invites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_invite_projects_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invite_projects`
--

LOCK TABLES `invite_projects` WRITE;
/*!40000 ALTER TABLE `invite_projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `invite_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invites`
--

DROP TABLE IF EXISTS `invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invites` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires_at` datetime NOT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invites_email` (`tenant_id`,`email`),
  UNIQUE KEY `uk_invites_token_hash` (`token_hash`),
  KEY `idx_invites_tenant` (`tenant_id`),
  KEY `idx_invites_role` (`role_id`),
  CONSTRAINT `fk_invites_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_invites_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invites`
--

LOCK TABLES `invites` WRITE;
/*!40000 ALTER TABLE `invites` DISABLE KEYS */;
INSERT INTO `invites` VALUES (1,3,'novo@vdt.com.br',2,'dd56126495f266309b28a3579364c09a839f041dbb55de524d03c198c4236057','2026-02-13 01:14:15',NULL,'2026-02-06 01:14:15'),(2,2,'user@diapason.com.br',2,'f4fc641eee9039f66cd7bc398e517c1be8658cccc7f538081924dd7efa247f19','2026-02-11 01:14:42',NULL,'2026-02-06 01:14:42'),(6,1,'eduardo@teste.com.br',1,'e38bec0385afe06448badd7731040555082333908dbe119fa7a30853a0ca9b39','2026-02-15 08:11:34','2026-02-08 08:30:56','2026-02-08 08:11:34');
/*!40000 ALTER TABLE `invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_expenses`
--

DROP TABLE IF EXISTS `invoice_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_expenses` (
  `invoice_id` bigint(20) unsigned NOT NULL,
  `expense_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`tenant_id`,`invoice_id`,`expense_id`),
  KEY `idx_ie_expense` (`expense_id`),
  KEY `fk_ie_expense_tenant` (`tenant_id`,`expense_id`),
  CONSTRAINT `fk_ie_expense_tenant` FOREIGN KEY (`tenant_id`, `expense_id`) REFERENCES `expenses` (`tenant_id`, `id`),
  CONSTRAINT `fk_ie_invoice_tenant` FOREIGN KEY (`tenant_id`, `invoice_id`) REFERENCES `invoices` (`tenant_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_expenses`
--

LOCK TABLES `invoice_expenses` WRITE;
/*!40000 ALTER TABLE `invoice_expenses` DISABLE KEYS */;
INSERT INTO `invoice_expenses` VALUES (19,11,1),(1,1,3),(1,2,3),(1,3,3),(1,4,3),(1,5,3);
/*!40000 ALTER TABLE `invoice_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `invoice_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `value` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_it_invoice` (`invoice_id`),
  KEY `idx_it_project` (`project_id`),
  KEY `idx_invoice_items_tenant_invoice` (`tenant_id`,`invoice_id`),
  KEY `idx_invoice_items_tenant_project` (`tenant_id`,`project_id`),
  CONSTRAINT `fk_invoice_items_invoice_tenant` FOREIGN KEY (`tenant_id`, `invoice_id`) REFERENCES `invoices` (`tenant_id`, `id`),
  CONSTRAINT `fk_invoice_items_project_tenant` FOREIGN KEY (`tenant_id`, `project_id`) REFERENCES `projects` (`tenant_id`, `id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (1,1,6,1,'Transporte',50.00),(2,1,7,1,'Transporte • ssss',222.00),(3,1,8,1,'Transporte • aaaa',2222.00),(4,1,9,1,'Transporte • ete',26000.00),(5,1,9,1,'Transporte • x',26.00),(6,1,10,3,'Transporte • limite',26250.00),(7,1,10,3,'Transporte • limite',26.25),(8,3,1,10,'Serviço suporte',6000.00),(9,3,1,9,'Serviço consultoria',9000.00),(10,3,2,9,'Transporte • Uber aeroporto',180.00),(11,3,3,10,'Alimentação • Almoço com cliente',95.50),(12,3,4,9,'Passeio • teste',2.00),(13,3,4,9,'Passeio • teste',50.00),(14,3,5,9,'Alimentação • dasd',222.00),(16,1,19,2,'Transporte',10000.00);
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_status`
--

DROP TABLE IF EXISTS `invoice_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoice_status_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_status`
--

LOCK TABLES `invoice_status` WRITE;
/*!40000 ALTER TABLE `invoice_status` DISABLE KEYS */;
INSERT INTO `invoice_status` VALUES (1,'SENT','Enviada'),(2,'PAID','Paga'),(3,'APPROVED','Aprovada'),(4,'REJECTED','Reprovada');
/*!40000 ALTER TABLE `invoice_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `issuer_user_id` bigint(20) unsigned DEFAULT NULL,
  `status_id` bigint(20) unsigned NOT NULL,
  `total` decimal(14,2) NOT NULL,
  `total_readonly` tinyint(1) NOT NULL DEFAULT 0,
  `month_competency` date NOT NULL,
  `month_issue` date NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoices_tenant_id` (`tenant_id`,`id`),
  UNIQUE KEY `uk_invoices_code` (`tenant_id`,`code`),
  KEY `idx_nf_tenant_month` (`tenant_id`,`month_issue`),
  KEY `idx_nf_tenant_status` (`tenant_id`,`status_id`),
  KEY `idx_nf_issuer` (`issuer_user_id`),
  KEY `fk_nf_status` (`status_id`),
  CONSTRAINT `fk_nf_issuer` FOREIGN KEY (`issuer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_nf_status` FOREIGN KEY (`status_id`) REFERENCES `invoice_status` (`id`),
  CONSTRAINT `fk_nf_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'INV-000001',3,7,1,15000.00,0,'2025-12-01','2026-01-01','NF_0001.pdf',NULL,'2026-01-16 14:46:39','2026-02-06 01:22:16'),(2,'INV-000002',3,7,1,180.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-18 15:31:01','2026-02-06 01:22:16'),(3,'INV-000003',3,7,1,95.50,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-18 15:34:28','2026-02-06 01:22:16'),(4,'INV-000004',3,7,1,52.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-18 15:34:56','2026-02-06 01:22:16'),(5,'INV-000005',3,7,1,222.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-18 15:35:54','2026-02-06 01:22:16'),(6,'INV-000006',1,1,2,50.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-21 01:45:35','2026-02-06 01:22:16'),(7,'INV-000007',1,1,3,222.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-21 02:34:31','2026-02-06 01:22:16'),(8,'INV-000008',1,1,3,2222.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-21 03:04:25','2026-02-06 01:22:16'),(9,'INV-000009',1,1,3,26026.00,1,'2026-01-01','2026-01-01','NF_mock.pdf',NULL,'2026-01-21 03:04:51','2026-02-06 01:22:16'),(10,'INV-000010',1,1,2,26276.25,1,'2026-01-01','2026-01-01','https://',NULL,'2026-01-21 03:20:26','2026-02-08 02:06:11'),(16,NULL,1,1,1,26000.00,0,'2026-07-01','2026-03-01','teste',NULL,'2026-02-08 05:03:45','2026-02-08 05:03:45'),(17,NULL,1,1,4,26000.00,0,'2026-01-01','2026-01-01','x',NULL,'2026-02-08 05:04:05','2026-02-08 02:04:13'),(18,NULL,1,1,1,26.00,0,'2026-01-01','2026-01-01','x',NULL,'2026-02-08 05:04:41','2026-02-08 05:04:41'),(19,NULL,1,1,2,10000.00,0,'2026-01-01','2026-01-01','ete',NULL,'2026-02-08 05:13:30','2026-02-08 02:13:41');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_status`
--

DROP TABLE IF EXISTS `project_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_status_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_status`
--

LOCK TABLES `project_status` WRITE;
/*!40000 ALTER TABLE `project_status` DISABLE KEYS */;
INSERT INTO `project_status` VALUES (1,'IN_PROGRESS','Em andamento'),(2,'BACKLOG','A iniciar'),(3,'READY_TO_BILL','Liberado para faturamento'),(4,'BILLED','Faturado'),(5,'TO_START','A iniciar'),(6,'READY_TO_INVOICE','Liberado para Faturamento'),(7,'INVOICED','Faturado');
/*!40000 ALTER TABLE `project_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_users`
--

DROP TABLE IF EXISTS `project_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_users` (
  `project_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`project_id`,`user_id`),
  UNIQUE KEY `uk_project_users` (`project_id`,`user_id`),
  KEY `idx_pu_user` (`user_id`),
  CONSTRAINT `fk_pu_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_pu_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_users`
--

LOCK TABLES `project_users` WRITE;
/*!40000 ALTER TABLE `project_users` DISABLE KEYS */;
INSERT INTO `project_users` VALUES (9,7),(10,7);
/*!40000 ALTER TABLE `project_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned DEFAULT NULL,
  `owner_user_id` bigint(20) unsigned DEFAULT NULL,
  `status_id` bigint(20) unsigned NOT NULL,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(128) NOT NULL,
  `value_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cost_planned` decimal(14,2) NOT NULL DEFAULT 0.00,
  `cost_planned_nf` decimal(14,2) DEFAULT NULL,
  `cost_planned_other` decimal(14,2) DEFAULT NULL,
  `indicator_override_pct` decimal(6,4) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `contract_url` varchar(512) DEFAULT NULL,
  `dre_url` varchar(512) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_projects_code` (`tenant_id`,`code`),
  UNIQUE KEY `uk_projects_tenant_id` (`tenant_id`,`id`),
  KEY `idx_projects_tenant` (`tenant_id`),
  KEY `idx_projects_client` (`client_id`),
  KEY `idx_projects_owner` (`owner_user_id`),
  KEY `idx_projects_status` (`tenant_id`,`status_id`),
  KEY `fk_projects_status` (`status_id`),
  KEY `fk_projects_client_tenant` (`tenant_id`,`client_id`),
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_projects_client_tenant` FOREIGN KEY (`tenant_id`, `client_id`) REFERENCES `clients` (`tenant_id`, `id`),
  CONSTRAINT `fk_projects_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_projects_status` FOREIGN KEY (`status_id`) REFERENCES `project_status` (`id`),
  CONSTRAINT `fk_projects_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,1,1,5,2,'TYPIC-PRJ-1001','Projeto Typic 01 A2',65000.00,60000.00,50000.00,10000.00,NULL,'Projeto','','',NULL,NULL,'2026-02-06 00:11:06','2026-02-08 23:26:45'),(2,1,1,5,1,'TYPIC-PRJ-1002','Projeto Typic 02 B',70000.00,31500.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(3,1,2,5,1,'TYPIC-PRJ-1003','Projeto Typic 03 A',75000.00,26250.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(4,1,2,5,1,'TYPIC-PRJ-1004','Projeto Typic 04 B',80000.00,32000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(5,2,3,5,1,'DIAPASON-PRJ-1005','Projeto Diapason 01 A',85000.00,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-08 03:32:14'),(6,2,3,5,1,'DIAPASON-PRJ-1006','Projeto Diapason 02 B',90000.00,31500.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(7,2,4,5,1,'DIAPASON-PRJ-1007','Projeto Diapason 03 A',95000.00,38000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(8,2,4,5,1,'DIAPASON-PRJ-1008','Projeto Diapason 04 B',100000.00,45000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(9,3,5,5,1,'VDT-PRJ-1009','Projeto VDT 01 A',105000.00,36750.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(10,3,5,5,1,'VDT-PRJ-1010','Projeto VDT 02 B',110000.00,44000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(11,3,6,5,1,'VDT-PRJ-1011','Projeto VDT 03 A',115000.00,51750.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06'),(12,3,6,5,1,'VDT-PRJ-1012','Projeto VDT 04 B',120000.00,42000.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-06 00:11:06','2026-02-06 00:11:06');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursement_status`
--

DROP TABLE IF EXISTS `reimbursement_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reimbursement_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reimb_status_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursement_status`
--

LOCK TABLES `reimbursement_status` WRITE;
/*!40000 ALTER TABLE `reimbursement_status` DISABLE KEYS */;
INSERT INTO `reimbursement_status` VALUES (1,'APPROVED','Aprovado'),(2,'REQUESTED','Solicitado'),(3,'REJECTED','Reprovado');
/*!40000 ALTER TABLE `reimbursement_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursement_type`
--

DROP TABLE IF EXISTS `reimbursement_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reimbursement_type` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reimbursement_type_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursement_type`
--

LOCK TABLES `reimbursement_type` WRITE;
/*!40000 ALTER TABLE `reimbursement_type` DISABLE KEYS */;
INSERT INTO `reimbursement_type` VALUES (1,'TRANSPORT','Transporte',1),(2,'SOFTWARE','Software',1),(3,'FOOD','Alimentação',1),(4,'OTHER','Outros',1);
/*!40000 ALTER TABLE `reimbursement_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reimbursements`
--

DROP TABLE IF EXISTS `reimbursements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reimbursements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `project_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `status_id` bigint(20) unsigned NOT NULL,
  `type_id` bigint(20) unsigned DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `complement` varchar(255) DEFAULT NULL,
  `value` decimal(14,2) NOT NULL,
  `date_buy` date NOT NULL,
  `proof_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rb_tenant_date` (`tenant_id`,`date_buy`),
  KEY `idx_rb_tenant_status` (`tenant_id`,`status_id`),
  KEY `idx_rb_project` (`project_id`),
  KEY `idx_rb_user` (`user_id`),
  KEY `fk_rb_status` (`status_id`),
  KEY `idx_rb_type` (`type_id`),
  CONSTRAINT `fk_rb_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_rb_status` FOREIGN KEY (`status_id`) REFERENCES `reimbursement_status` (`id`),
  CONSTRAINT `fk_rb_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_rb_type` FOREIGN KEY (`type_id`) REFERENCES `reimbursement_type` (`id`),
  CONSTRAINT `fk_rb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reimbursements`
--

LOCK TABLES `reimbursements` WRITE;
/*!40000 ALTER TABLE `reimbursements` DISABLE KEYS */;
INSERT INTO `reimbursements` VALUES (1,3,9,7,1,1,NULL,'Pedágio',32.40,'2026-01-03',NULL,'2026-01-13 18:46:39'),(2,1,1,9,1,2,'a','Licença ferramenta',149.90,'2026-01-02',NULL,'2026-01-10 18:46:39'),(3,3,9,7,2,1,NULL,'x',222.00,'2026-01-18',NULL,'2026-01-18 15:30:55'),(4,1,1,1,1,2,'xxas','xxxx',222.00,'2026-01-20','sss','2026-01-21 02:22:48'),(8,1,1,1,3,2,'Nova',NULL,50.00,'2026-02-08',NULL,'2026-02-08 04:31:20'),(9,1,1,1,2,3,'Mais uma',NULL,200.00,'2026-02-08',NULL,'2026-02-08 04:31:53');
/*!40000 ALTER TABLE `reimbursements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'MASTER','Master'),(2,'OPERADOR','Operador');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_type`
--

DROP TABLE IF EXISTS `sale_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_type` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sale_type_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_type`
--

LOCK TABLES `sale_type` WRITE;
/*!40000 ALTER TABLE `sale_type` DISABLE KEYS */;
INSERT INTO `sale_type` VALUES (1,'PROJECT','Projeto'),(2,'MONTHLY_FEE','Fee mensal');
/*!40000 ALTER TABLE `sale_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `client_id` bigint(20) unsigned DEFAULT NULL,
  `type_id` bigint(20) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `value_total` decimal(14,2) NOT NULL,
  `planned_cost` decimal(14,2) NOT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sales_tenant_date` (`tenant_id`,`created_at`),
  KEY `idx_sales_client` (`client_id`),
  KEY `idx_sales_type` (`type_id`),
  KEY `idx_sales_created_by` (`created_by`),
  KEY `fk_sales_client_tenant` (`tenant_id`,`client_id`),
  CONSTRAINT `fk_sales_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_sales_client_tenant` FOREIGN KEY (`tenant_id`, `client_id`) REFERENCES `clients` (`tenant_id`, `id`),
  CONSTRAINT `fk_sales_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_sales_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_sales_type` FOREIGN KEY (`type_id`) REFERENCES `sale_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `name` varchar(128) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_services_name` (`tenant_id`,`name`),
  KEY `idx_services_tenant` (`tenant_id`),
  CONSTRAINT `fk_services_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,3,'Transporte','2026-02-06 01:01:00','2026-02-06 01:01:00'),(2,3,'Alimentação','2026-02-06 01:01:00','2026-02-06 01:01:00'),(3,3,'Passeio','2026-02-06 01:01:00','2026-02-06 01:01:00'),(4,1,'Transporte','2026-02-06 01:01:00','2026-02-06 01:01:00'),(5,1,'Alimentação','2026-02-06 01:01:00','2026-02-06 01:01:00'),(6,1,'Passeio','2026-02-06 01:01:00','2026-02-06 01:01:00'),(8,1,'Serviço X','2026-02-07 03:30:49','2026-02-07 03:30:49');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `refresh_token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user` (`user_id`),
  KEY `idx_sessions_tenant` (`tenant_id`),
  KEY `idx_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(128) NOT NULL,
  `doc` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `indicator_pct` decimal(6,4) NOT NULL DEFAULT 0.0000,
  `require_project_link` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenants_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'typic','Typic','11.111.111/0001-11',0.1800,0,'2026-02-06 00:11:05','2026-02-08 05:50:44'),(2,'diapason','Diapason','22.222.222/0001-22',0.4500,0,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(3,'vdt','Vou de Trip','33.333.333/0001-33',0.4500,0,'2026-02-06 00:11:05','2026-02-06 00:11:05');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `user_id` bigint(20) unsigned NOT NULL,
  `selected_tenant_id` bigint(20) unsigned DEFAULT NULL,
  `drawer_full` tinyint(1) NOT NULL DEFAULT 0,
  `current_month` char(7) DEFAULT NULL,
  `current_view` varchar(32) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  KEY `idx_user_preferences_selected_tenant` (`selected_tenant_id`),
  CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_user_preferences_selected_tenant` FOREIGN KEY (`selected_tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES (1,1,0,NULL,NULL,'2026-02-07 12:50:49','2026-02-09 02:45:33'),(33,1,0,NULL,NULL,'2026-02-08 08:31:02','2026-02-08 08:31:02');
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_status`
--

DROP TABLE IF EXISTS `user_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_status_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_status`
--

LOCK TABLES `user_status` WRITE;
/*!40000 ALTER TABLE `user_status` DISABLE KEYS */;
INSERT INTO `user_status` VALUES (1,'APPROVED','Aprovado'),(2,'PENDING','Pendente'),(3,'INVITED','Convidado'),(4,'REJECTED','Reprovado'),(5,'BLOCKED','Bloqueado'),(6,'INACTIVE','Inativo');
/*!40000 ALTER TABLE `user_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_tenants`
--

DROP TABLE IF EXISTS `user_tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tenants` (
  `user_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`tenant_id`),
  KEY `idx_ut_tenant` (`tenant_id`),
  KEY `idx_ut_role` (`role_id`),
  CONSTRAINT `fk_ut_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_ut_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_ut_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_tenants`
--

LOCK TABLES `user_tenants` WRITE;
/*!40000 ALTER TABLE `user_tenants` DISABLE KEYS */;
INSERT INTO `user_tenants` VALUES (1,1,1),(1,2,1),(1,3,1),(2,2,1),(3,3,1),(4,1,1),(5,1,1),(5,2,1),(5,3,1),(6,1,1),(6,2,1),(33,1,1),(7,3,2),(8,2,2),(9,1,2),(9,2,2),(9,3,2);
/*!40000 ALTER TABLE `user_tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  `status_id` bigint(20) unsigned NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`status_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_users_status` FOREIGN KEY (`status_id`) REFERENCES `user_status` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Master','master@corp.com','$2y$13$Bf5K7qu75Ri0yNN/3K8T0eR2kl3c1CfMjuOGY4yg5A6nO8Ua9oH3i',1,1,1,'2026-02-06 00:11:05','2026-02-06 23:19:16'),(2,'Diego Rigolino','diego@diapason.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1,'2026-02-06 00:11:05','2026-02-08 04:27:11'),(3,'Eduardo','eduardo@vdt.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(4,'Felipe','felipe@typic.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(5,'Rafael','rafael@blendz.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(6,'Bruno Rigolino','bruno@corp.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(7,'Talita','talita@vdt.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',2,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(8,'Batata','batata@diapason.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',2,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(9,'Carol','carol@typic.com.br','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',2,1,1,'2026-02-06 00:11:05','2026-02-06 00:11:05'),(33,'EDUARDO SILVA PEREZ ALVAREZ','eduardo@teste.com.br','$2y$13$2FFWJxAngo7fJa0CBHDXgeJ6CTEaMtsCDtsFYV8pfE.b13YOYn2Ym',1,2,1,'2026-02-08 08:30:55','2026-02-08 08:30:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-09  9:46:43
