<?php

namespace App\Controller\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/api/upload', name: 'api_upload_')]
class UploadController extends AbstractController
{
    #[Route('/reimbursement', name: 'reimbursement', methods: ['POST'])]
    public function uploadReimbursement(Request $request): JsonResponse
    {
        return $this->handleUpload($request, 'reimbursements');
    }

    #[Route('/invoice', name: 'invoice', methods: ['POST'])]
    public function uploadInvoice(Request $request): JsonResponse
    {
        return $this->handleUpload($request, 'invoices');
    }

    private function handleUpload(Request $request, string $type): JsonResponse
    {
        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');
        if (!$file) {
            return new JsonResponse(['error' => 'Arquivo não enviado'], Response::HTTP_BAD_REQUEST);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = substr(preg_replace('/[^a-zA-Z0-9-_]/', '_', $originalName), 0, 40);
        $uniqueName = $safeName . '-' . uniqid() . '.' . $file->guessExtension();

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/' . $type;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        try {
            $file->move($uploadDir, $uniqueName);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Falha ao salvar arquivo'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $publicUrl = '/uploads/' . $type . '/' . $uniqueName;
        return new JsonResponse(['url' => $publicUrl], Response::HTTP_OK);
    }
}
