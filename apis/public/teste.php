<?php
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

// ====== CONFIG ======
$dsn  = 'mysql:host=127.0.0.1;port=3306;dbname=notas;charset=utf8mb4';
$user = 'root';
$pass = '';

function print_line(string $s = ''): void { echo $s . "\n"; }

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    print_line("✅ Conectou no banco com sucesso!");
    print_line("DB: " . (string)$pdo->query("SELECT DATABASE()")->fetchColumn());
    print_line();
} catch (Throwable $e) {
    print_line("❌ Erro ao conectar no banco:");
    print_line($e->getMessage());
    exit(1);
}

// ====== QUERY ======
// 1) tenta query com JOIN em roles/statuses (se existirem)
// 2) se falhar, faz query simples só na users

$sqlJoin = <<<SQL
SELECT
  u.id,
  u.name,
  u.email,
  u.role_id,
  r.name  AS role_name,
  u.status_id,
  s.name  AS status_name,
  u.active,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN roles r    ON r.id = u.role_id
LEFT JOIN statuses s ON s.id = u.status_id
ORDER BY u.id DESC
LIMIT :limit
SQL;

$sqlSimple = <<<SQL
SELECT
  id,
  name,
  email,
  role_id,
  status_id,
  active,
  created_at,
  updated_at
FROM users
ORDER BY id DESC
LIMIT :limit
SQL;

$limit = 10;

try {
    $stmt = $pdo->prepare($sqlJoin);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    print_line("🔎 Query com JOIN (roles/statuses) OK — últimos {$limit}:");
    print_line(str_repeat('-', 70));

} catch (Throwable $e) {
    print_line("⚠️ Não deu pra rodar JOIN (normal se não tiver roles/statuses).");
    print_line("Motivo: " . $e->getMessage());
    print_line();
    print_line("➡️ Rodando query simples só em users...");
    print_line();

    try {
        $stmt = $pdo->prepare($sqlSimple);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        print_line("🔎 Query simples OK — últimos {$limit}:");
        print_line(str_repeat('-', 70));

    } catch (Throwable $e2) {
        print_line("❌ Erro ao executar query simples:");
        print_line($e2->getMessage());
        exit(2);
    }
}

if (!$rows) {
    print_line("(nenhum usuário encontrado)");
    exit(0);
}

foreach ($rows as $u) {
    $id = $u['id'] ?? '';
    $name = $u['name'] ?? '';
    $email = $u['email'] ?? '';
    $active = (int)($u['active'] ?? 0);

    $roleInfo = isset($u['role_name']) ? "{$u['role_id']} ({$u['role_name']})" : (string)($u['role_id'] ?? '');
    $statusInfo = isset($u['status_name']) ? "{$u['status_id']} ({$u['status_name']})" : (string)($u['status_id'] ?? '');

    print_line("- [{$id}] {$name} <{$email}> | role={$roleInfo} | status={$statusInfo} | active={$active}");
}
