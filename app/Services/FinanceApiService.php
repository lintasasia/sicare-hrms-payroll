<?php

namespace App\Services;

use Exception;

/**
 * Service untuk komunikasi aman dengan API Finance ERP (finance.lintas.asia).
 * Digunakan oleh portal siCare untuk mengambil riwayat gaji & status pembayaran slip karyawan.
 */
class FinanceApiService {

    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct(?string $baseUrl = null, ?string $apiKey = null, int $timeout = 10) {
        $this->baseUrl = rtrim($baseUrl ?? $_ENV['FINANCE_API_URL'] ?? 'https://finance.lintas.asia/api/v1', '/');
        $this->apiKey = $apiKey ?? $_ENV['FINANCE_API_KEY'] ?? '';
        $this->timeout = $timeout;
    }

    /**
     * Memverifikasi konektivitas dan keabsahan API Key.
     */
    public function verifyConnection(): bool {
        $res = $this->request('GET', '/auth/verify');
        return !empty($res['success']) && ($res['status'] ?? '') === 'authenticated';
    }

    /**
     * Mengambil daftar riwayat payroll & slip gaji untuk karyawan tertentu.
     * 
     * @param string $employeeId Nomor karyawan (misal 'EMP-001') atau ID karyawan.
     * @param array $filters Filter opsional: 'bulan' (1-12), 'tahun', 'status' (SUDAH_DIBAYAR/BELUM_DIBAYAR/ALL).
     * @return array|null Mengembalikan data payroll atau null jika terjadi error.
     */
    public function getEmployeePayrolls(string $employeeId, array $filters = []): ?array {
        $endpoint = '/payroll/' . rawurlencode(trim($employeeId));
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }

        $res = $this->request('GET', $endpoint);
        if ($res && !empty($res['success'])) {
            return $res['data'] ?? null;
        }

        return null;
    }

    /**
     * Mengambil detail satu slip gaji berdasarkan ID payroll.
     */
    public function getPayrollSlip(int $payrollId): ?array {
        $endpoint = '/payroll/slip/' . intval($payrollId);
        $res = $this->request('GET', $endpoint);
        if ($res && !empty($res['success'])) {
            return $res['data'] ?? null;
        }

        return null;
    }

    /**
     * Eksekusi HTTP Request via cURL dengan standar keamanan TLS.
     */
    private function request(string $method, string $endpoint, ?array $payload = null): ?array {
        $url = $this->baseUrl . $endpoint;

        $ch = curl_init();
        $headers = [
            'Accept: application/json',
            'X-API-KEY: ' . $this->apiKey,
            'User-Agent: siCare-HRMS/1.0'
        ];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($payload) {
                $headers[] = 'Content-Type: application/json';
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            }
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $errNo = curl_errno($ch);
        $errMsg = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errNo) {
            error_log("[FinanceApiService] cURL Error ($errNo): $errMsg on $url");
            return null;
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 400) {
            error_log("[FinanceApiService] API Error HTTP $httpCode: " . ($decoded['message'] ?? $response));
        }

        return is_array($decoded) ? $decoded : null;
    }
}
