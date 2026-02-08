# Configuração de Serviços - JWT Authentication

Para que a autenticação JWT funcione, é necessário registrar os serviços no Symfony.

## Arquivo config/services.yaml

Certifique-se de que este arquivo existe e contém:

```yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true

  # JWT Token Provider
  App\Service\JwtTokenProvider:
    arguments:
      $appSecret: '%env(APP_SECRET)%'

  # Event Subscriber de Autenticação
  App\EventSubscriber\AuthenticationSubscriber:
    arguments:
      $tokenProvider: '@App\Service\JwtTokenProvider'
    tags:
      - { name: kernel.event_subscriber }

  # Security - AuthUser
  App\Security\AuthUser:
    arguments:
      $userRepository: '@App\Repository\UserRepository'

  # Controllers
  App\Controller\Api\:
    resource: '../src/Controller/Api'
    tags: ['controller.service_arguments']
```

## Variáveis de Ambiente

No arquivo `.env` ou `.env.local`, certifique-se de que `APP_SECRET` está definido:

```
APP_SECRET=your-secret-key-here
```

Gerar uma chave segura:
```bash
php -r 'echo bin2hex(random_bytes(16));'
# Copiar o output e colar em APP_SECRET
```

## Passos para Configurar

1. **Instalar JWT**
```bash
composer require lcobucci/jwt
```

2. **Verificar config/services.yaml** - Deve conter os serviços acima

3. **Limpar cache** (se necessário)
```bash
php bin/console cache:clear
# ou
rm -rf var/cache/*
```

4. **Testar**
```bash
curl http://localhost:8000/api/health
```

## Estrutura de Arquivos Criados

```
src/
├── Controller/Api/
│   └── AuthController.php       # Endpoints de autenticação
├── Service/
│   └── JwtTokenProvider.php     # Geração/validação de JWT
├── EventSubscriber/
│   └── AuthenticationSubscriber.php  # Validação de token em requisições
├── Security/
│   └── AuthUser.php             # Classe para acessar user autenticado
└── Repository/
    └── UserRepository.php        # (já existia)
```

## Como Usar em Controllers

```php
namespace App\Controller\Api;

use App\Security\AuthUser;

class MyController extends BaseController
{
    public function myAction(Request $request, AuthUser $authUser): JsonResponse
    {
        // Extrair claims do request
        $authUser->setClaimsFromRequest($request);
        
        // Verificar autenticação
        if (!$authUser->isAuthenticated()) {
            return $this->unauthorizedResponse();
        }

        // Obter informações do usuário
        $userId = $authUser->getId();
        $email = $authUser->getEmail();
        $role = $authUser->getRole();
        $user = $authUser->getUser();

        // ...
    }
}
```

## Environment Variables

```bash
# .env ou .env.local
APP_ENV=dev
APP_DEBUG=1
APP_SECRET=your-secure-secret-key-32-chars-min

DATABASE_URL="mysql://root:@127.0.0.1:3306/notas?serverVersion=mariadb-10.4.32"

DEFAULT_URI=http://api.notas.local
```

## Troubleshooting

### "Service not found"

Verifique se o arquivo `config/services.yaml` existe e está bem formatado.

### "APP_SECRET not defined"

Defina em `.env`, `.env.local`, ou passe como variável de ambiente:
```bash
APP_SECRET="your-key" php -S 127.0.0.1:8000 -t public
```

### CORS Headers (Para frontend em outro domínio)

Se o frontend estiver em outro domínio, adicione em `public/index.php`:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

## Segurança

1. **APP_SECRET** - Usar chave forte e secreta
2. **HTTPS** - Sempre usar HTTPS em produção
3. **Token expiration** - Padrão é 1 hora (3600s)
4. **Rate limiting** - Implementar para login
5. **Password hashing** - Usar bcrypt em produção
