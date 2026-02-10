<?php

namespace App\Controller\Api;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/api/download', name: 'api_download_')]
class DownloadController extends AbstractController
{
    #[Route('/{type}/{filename}', name: 'file', requirements: ['type' => 'invoices|reimbursements', 'filename' => '.+'], methods: ['GET'])]
    public function downloadFile(Request $request, string $type, string $filename)
    {
        // Verifica se o token JWT foi enviado
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !preg_match('/^Bearer\s+.+/', $authHeader)) {
            return $this->json([
                'error' => 'Token de autenticação não fornecido'
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Segurança básica: impede path traversal
        if (strpos($filename, '..') !== false) {
            return $this->json(['error' => 'Nome de arquivo inválido'], Response::HTTP_BAD_REQUEST);
        }

        $baseDir = $this->getParameter('kernel.project_dir') . '/public/uploads/' . $type;
        $filePath = $baseDir . '/' . $filename;

        if (!file_exists($filePath) || !is_file($filePath)) {
            return $this->json(['error' => 'Arquivo não encontrado'], Response::HTTP_NOT_FOUND);
        }

        $response = new BinaryFileResponse($filePath);
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $filename
        );
        return $response;
    }
}
