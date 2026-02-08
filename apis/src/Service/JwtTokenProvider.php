<?php

namespace App\Service;

use App\Entity\User;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Token\UnencryptedToken;
use Lcobucci\JWT\Validation\RequiredConstraintsViolated;
use Lcobucci\Clock\SystemClock;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\ValidAt;
use DateTimeZone;

use DateTimeImmutable;
use Psr\Log\LoggerInterface;

class JwtTokenProvider
{
    private Configuration $config;
    private string $secret;
    private int $expiresIn = 3600; // 1 hora
    private LoggerInterface $logger;

public function __construct(string $appSecret, LoggerInterface $logger)
{
    $this->secret = $appSecret;
    $this->logger = $logger;

    // 1) cria a config primeiro
    $this->config = Configuration::forSymmetricSigner(
        new Sha256(),
        InMemory::plainText($appSecret)
    );

    // 2) agora sim define as constraints
    $clock = new SystemClock(new DateTimeZone('UTC'));

    $this->config->setValidationConstraints(
        new SignedWith($this->config->signer(), $this->config->signingKey()),
        new ValidAt($clock)
    );
}


    /**
     * Gera um JWT token para um usuário
     */
    public function generateToken(User $user): string
    {
        $now = (new \DateTimeImmutable())->setTimestamp(time()); // zera microsegundos
        $expiresAt = $now->modify("+{$this->expiresIn} seconds");

        $token = $this->config->builder()
            ->issuedAt($now)
            ->expiresAt($expiresAt)
            ->withClaim('uid', $user->getId())
            ->withClaim('email', $user->getEmail())
            ->withClaim('name', $user->getName())
            ->withClaim('role', $user->getRole()->getCode())
            ->getToken($this->config->signer(), $this->config->signingKey());

        return $token->toString();
    }


    /**
     * Valida e decodifica um JWT token
     */
    public function validateToken(string $token): ?array
{
    // só pra não explodir log com token inteiro
    $tokenPreview = substr($token, 0, 60) . '...';

    try {
        // 1) Parse
        $parsed = $this->config->parser()->parse($token);

        

        // 3) Debug de claims básicos antes de validar
        $claims = $parsed->claims();

        $iat = $claims->has('iat') ? $claims->get('iat') : null;
        $exp = $claims->has('exp') ? $claims->get('exp') : null;

        // iat/exp no lcobucci geralmente são DateTimeImmutable
        $iatStr = $iat instanceof \DateTimeInterface ? $iat->format('Y-m-d H:i:s') : (string)$iat;
        $expStr = $exp instanceof \DateTimeInterface ? $exp->format('Y-m-d H:i:s') : (string)$exp;

        $nowUtc = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));

        $this->logger->info('JWT: parsed OK (pre-validate)', [
            'preview' => $tokenPreview,
            'uid'     => $claims->has('uid') ? $claims->get('uid') : null,
            'iat'     => $iatStr,
            'exp'     => $expStr,
            'nowUtc'  => $nowUtc->format('Y-m-d H:i:s'),
        ]);

        // 4) Validar constraints (assinatura + exp/iat)
        $this->config->validator()->assert(
            $parsed,
            ...$this->config->validationConstraints()
        );

        // 5) Passou: retorna dados
        return [
            'uid'   => $claims->get('uid'),
            'email' => $claims->get('email'),
            'name'  => $claims->get('name'),
            'role'  => $claims->get('role'),
        ];

    } catch (RequiredConstraintsViolated $e) {
        $violations = [];
        foreach ($e->violations() as $v) {
            $violations[] = (string) $v; // já vem descritivo
        }

        $this->logger->error('JWT: constraints violated', [
            'preview'     => $tokenPreview,
            'violations'  => $violations,
            'constraints' => array_map(fn($c) => get_class($c), $this->config->validationConstraints()),
        ]);

        return null;

    } catch (\Throwable $e) {
        $this->logger->error('JWT: parsing/validation exception', [
            'preview'   => $tokenPreview,
            'ex'        => get_class($e) . ': ' . $e->getMessage(),
            'traceTop'  => substr($e->getTraceAsString(), 0, 400),
        ]);

        return null;
    }
}



    /**
     * Extrai o token do header Authorization
     */
    public static function extractToken(string $authHeader): ?string
    {
        if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return null;
        }
        return $matches[1];
    }
}
