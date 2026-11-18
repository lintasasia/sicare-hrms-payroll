<?php
// HR Operations / Admin / Superadmin — Sinkronisasi Payroll Finance ERP
if (session_status() === PHP_SESSION_NONE) session_start();

$role = $_SESSION['role'] ?? 'hr_ops';
$roleFolder = 'hrops';
if ($role === 'superadmin') {
    $roleFolder = 'superadmin';
} elseif ($role === 'admin') {
    $roleFolder = 'admin';
}

$db = \App\Config\Database::getInstance()->getConnection();

// Cek konfigurasi Finance API
$stmtCfg = $db->query("SELECT `key`, `value` FROM global_settings WHERE `key` IN ('finance_api_url', 'finance_api_key', 'finance_api_timeout')");
$cfg = [];
while ($row = $stmtCfg->fetch(\PDO::FETCH_ASSOC)) {
    $cfg[$row['key']] = $row['value'];
}

$financeApiUrl = $cfg['finance_api_url'] ?? 'https://finance.lintas.asia/api/v1';
$financeApiKeySet = !empty($cfg['finance_api_key']);

// Hitung statistik Karir
$totalLocalPayroll = (int)$db->query("SELECT COUNT(*) FROM employee_payroll")->fetchColumn();
$totalEmployeesWithId = (int)$db->query("SELECT COUNT(*) FROM users WHERE employee_id IS NOT NULL AND employee_id != ''")->fetchColumn();

// Ambil daftar karyawan dengan ID & status payroll terbaru di Karir
$stmtEmployees = $db->query("
    SELECT 
        u.id, u.employee_id, u.first_name, u.last_name, u.email, u.job_title, u.profile_picture, u.role,
        (SELECT ep.month_year FROM employee_payroll ep WHERE ep.user_id = u.id ORDER BY ep.created_at DESC LIMIT 1) AS last_period,
        (SELECT ep.status FROM employee_payroll ep WHERE ep.user_id = u.id ORDER BY ep.created_at DESC LIMIT 1) AS last_status,
        (SELECT ep.net_salary FROM employee_payroll ep WHERE ep.user_id = u.id ORDER BY ep.created_at DESC LIMIT 1) AS last_net_salary,
        (SELECT COUNT(*) FROM employee_payroll ep WHERE ep.user_id = u.id) AS total_slips
    FROM users u
    WHERE u.employee_id IS NOT NULL AND u.employee_id != ''
    ORDER BY u.first_name ASC
");
$employees = $stmtEmployees->fetchAll(\PDO::FETCH_ASSOC);

// Cek status koneksi Finance API saat memuat halaman
$financeApi = new \App\Services\FinanceApiService();
$isOnline = false;
$apiError = '';
try {
    $isOnline = $financeApi->verifyConnection();
} catch (\Throwable $e) {
    $apiError = $e->getMessage();
}
?>

<div class="space-y-6">

    <!-- ── Header ── -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1">
            <div class="flex items-center gap-2">
                <h1 class="font-headline text-3xl font-extrabold text-primary tracking-tight">Sinkronisasi Finance ERP</h1>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold <?= $isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200' ?>">
                    <span class="w-2 h-2 rounded-full <?= $isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500' ?>"></span>
                    <?= $isOnline ? 'API Online' : 'API Terputus' ?>
                </span>
            </div>
            <p class="text-on-surface-variant font-medium text-sm">
                Sinkronisasikan riwayat pembayaran gaji karyawan dari aplikasi <strong>Finance ERP (finance.lintas.asia)</strong> secara langsung ke sistem siCare.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <a href="/<?= $roleFolder ?>/payroll" data-spa class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-neutral-50 rounded-xl text-xs font-bold transition-all shadow-sm">
                <span class="material-symbols-outlined text-sm">arrow_back</span>
                Kembali ke Payroll
            </a>
            <button id="btnSyncNow" onclick="runFinanceSync()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,6,102,0.2)] hover:shadow-[0_6px_20px_rgba(0,6,102,0.3)] cursor-pointer">
                <span class="material-symbols-outlined text-base">sync</span>
                Sinkronkan Sekarang
            </button>
        </div>
    </div>

    <!-- ── Notice Banner Non-Destruktif ── -->
    <div class="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/60 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <span class="material-symbols-outlined text-xl">shield_check</span>
        </div>
        <div class="space-y-1">
            <h3 class="text-sm font-bold text-primary">Sinkronisasi Aman &amp; Non-Destruktif (Upsert Protected)</h3>
            <p class="text-xs text-on-surface-variant leading-relaxed">
                Data historis penggajian yang sudah ada di database siCare <strong>tidak akan dihapus atau hilang</strong>. Sistem hanya mencocokkan ID Karyawan (<code class="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono font-semibold">employee_id</code>) dengan Finance ERP dan memperbarui atau menambahkan slip gaji periode terkini yang telah dibayarkan oleh bagian Keuangan.
            </p>
        </div>
    </div>

    <!-- ── KPI Cards ── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Status API -->
        <div class="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Koneksi Finance ERP</span>
                <span class="material-symbols-outlined text-xl <?= $isOnline ? 'text-emerald-600' : 'text-red-500' ?>">
                    <?= $isOnline ? 'cloud_done' : 'cloud_off' ?>
                </span>
            </div>
            <div class="text-xl font-black text-on-surface">
                <?= $isOnline ? 'Terhubung' : 'Gagal' ?>
            </div>
            <p class="text-[11px] text-on-surface-variant truncate mt-1" title="<?= htmlspecialchars($financeApiUrl) ?>">
                <?= htmlspecialchars($financeApiUrl) ?>
            </p>
        </div>

        <!-- KPI 2: Karyawan Terpetakan -->
        <div class="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Karyawan Terpetakan</span>
                <span class="material-symbols-outlined text-xl text-primary">badge</span>
            </div>
            <div class="text-xl font-black text-primary">
                <?= $totalEmployeesWithId ?> <span class="text-xs font-medium text-on-surface-variant">Orang</span>
            </div>
            <p class="text-[11px] text-on-surface-variant mt-1">Memiliki ID Karyawan valid</p>
        </div>

        <!-- KPI 3: Total Slip di siCare -->
        <div class="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Slip di siCare</span>
                <span class="material-symbols-outlined text-xl text-indigo-600">receipt_long</span>
            </div>
            <div class="text-xl font-black text-on-surface">
                <?= $totalLocalPayroll ?> <span class="text-xs font-medium text-on-surface-variant">Record</span>
            </div>
            <p class="text-[11px] text-on-surface-variant mt-1">Data historis tersimpan aman</p>
        </div>

        <!-- KPI 4: Akses Pengaturan -->
        <div class="bg-white border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Kredensial API</span>
                <span class="material-symbols-outlined text-xl text-amber-500">vpn_key</span>
            </div>
            <div class="text-xs font-semibold text-on-surface">
                <?= $financeApiKeySet ? 'API Key Terpasang' : 'Belum Dikonfigurasi' ?>
            </div>
            <a href="/<?= in_array($roleFolder, ['admin', 'superadmin']) ? $roleFolder : 'hrops' ?>/settings" data-spa class="text-[11px] text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1">
                Ubah Pengaturan <span class="material-symbols-outlined text-xs">open_in_new</span>
            </a>
        </div>
    </div>

    <!-- ── Data Table Karyawan & Status Sinkronisasi ── -->
    <div class="bg-white border border-outline-variant/20 rounded-2xl shadow-sm overflow-hidden">
        <div class="p-5 border-b border-outline-variant/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h2 class="font-headline text-lg font-bold text-on-surface">Daftar Karyawan &amp; Status Slip Penggajian</h2>
                <p class="text-xs text-on-surface-variant">Pemetaan akun siCare dengan nomor karyawan di aplikasi Finance ERP</p>
            </div>
            <div class="flex items-center gap-2">
                <input type="text" id="filterEmp" onkeyup="filterEmployeeRows()" placeholder="Cari karyawan / ID..." 
                    class="bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-primary w-48 sm:w-60" />
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="bg-neutral-50/70 border-b border-outline-variant/15 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                        <th class="py-3.5 px-5">Karyawan</th>
                        <th class="py-3.5 px-4">ID Karyawan (Finance)</th>
                        <th class="py-3.5 px-4">Role / Posisi</th>
                        <th class="py-3.5 px-4">Periode Terakhir</th>
                        <th class="py-3.5 px-4">Take Home Pay</th>
                        <th class="py-3.5 px-4 text-center">Status di Karir</th>
                        <th class="py-3.5 px-5 text-right">Total Slip</th>
                    </tr>
                </thead>
                <tbody id="employeeTableBody" class="divide-y divide-outline-variant/10 text-on-surface">
                    <?php if (empty($employees)): ?>
                        <tr>
                            <td colspan="7" class="py-8 text-center text-on-surface-variant">
                                Belum ada data karyawan dengan Employee ID. Silakan lengkapi data master karyawan terlebih dahulu.
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($employees as $emp): ?>
                            <?php
                                $fullName = trim($emp['first_name'] . ' ' . ($emp['last_name'] ?? ''));
                                $emailHash = md5(strtolower(trim($emp['email'] ?? '')));
                                $avatar = !empty($emp['profile_picture'])
                                    ? $emp['profile_picture']
                                    : "https://www.gravatar.com/avatar/{$emailHash}?d=identicon&s=120";
                                $statusClass = 'bg-neutral-100 text-neutral-600';
                                if ($emp['last_status'] === 'Paid') {
                                    $statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                } elseif ($emp['last_status'] === 'Approved') {
                                    $statusClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                                } elseif ($emp['last_status'] === 'Draft') {
                                    $statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                                }
                            ?>
                            <tr class="hover:bg-neutral-50/80 transition emp-row" data-name="<?= strtolower($fullName) ?>" data-id="<?= strtolower($emp['employee_id']) ?>">
                                <td class="py-3.5 px-5">
                                    <div class="flex items-center gap-3">
                                        <img src="<?= htmlspecialchars($avatar) ?>" alt="<?= htmlspecialchars($fullName) ?>" class="w-9 h-9 rounded-full object-cover border border-outline-variant/20 shadow-xs" onerror="window.handleAvatarError(this, '<?= $emailHash ?>')" />
                                        <div>
                                            <div class="font-bold text-on-surface text-sm"><?= htmlspecialchars($fullName) ?></div>
                                            <div class="text-[11px] text-on-surface-variant"><?= htmlspecialchars($emp['job_title'] ?: 'Karyawan') ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3.5 px-4 font-mono font-bold text-primary">
                                    <?= htmlspecialchars($emp['employee_id']) ?>
                                </td>
                                <td class="py-3.5 px-4">
                                    <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                                        <?= htmlspecialchars($emp['role']) ?>
                                    </span>
                                </td>
                                <td class="py-3.5 px-4 font-semibold text-on-surface">
                                    <?= $emp['last_period'] ? htmlspecialchars($emp['last_period']) : '<span class="text-neutral-400 font-normal">Belum ada</span>' ?>
                                </td>
                                <td class="py-3.5 px-4 font-mono font-bold">
                                    <?= $emp['last_net_salary'] !== null ? ('Rp ' . number_format((float)$emp['last_net_salary'], 0, ',', '.')) : '<span class="text-neutral-400 font-normal">-</span>' ?>
                                </td>
                                <td class="py-3.5 px-4 text-center">
                                    <?php if ($emp['last_status']): ?>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold <?= $statusClass ?>">
                                            <?= htmlspecialchars($emp['last_status']) ?>
                                        </span>
                                    <?php else: ?>
                                        <span class="text-neutral-400 text-xs">-</span>
                                    <?php endif; ?>
                                </td>
                                <td class="py-3.5 px-5 text-right font-bold text-primary">
                                    <?= (int)$emp['total_slips'] ?> Slip
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

</div>

<script>
function filterEmployeeRows() {
    const q = (document.getElementById('filterEmp').value || '').toLowerCase();
    const rows = document.querySelectorAll('.emp-row');
    rows.forEach(r => {
        const name = r.getAttribute('data-name') || '';
        const id = r.getAttribute('data-id') || '';
        if (name.includes(q) || id.includes(q)) {
            r.style.display = '';
        } else {
            r.style.display = 'none';
        }
    });
}

function runFinanceSync() {
    const btn = document.getElementById('btnSyncNow');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span> Menghubungkan...';

    fetch('/<?= $roleFolder ?>/payroll/sync-finance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(r => r.json())
    .then(data => {
        btn.disabled = false;
        btn.innerHTML = originalText;

        if (data.success) {
            Swal.fire({
                title: 'Sinkronisasi Berhasil!',
                text: data.message,
                icon: 'success',
                confirmButtonColor: '#000666',
                confirmButtonText: 'Segarkan Halaman'
            }).then(() => {
                if (window.loadSpaContent) {
                    window.loadSpaContent(window.location.pathname);
                } else {
                    window.location.reload();
                }
            });
        } else {
            Swal.fire({
                title: 'Gagal Sinkronisasi',
                text: data.message || 'Terjadi kesalahan saat sinkronisasi data dari Finance ERP.',
                icon: 'error',
                confirmButtonColor: '#000666'
            });
        }
    })
    .catch(err => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        Swal.fire({
            title: 'Kesalahan Sistem',
            text: err.message || 'Gagal memproses permintaan.',
            icon: 'error',
            confirmButtonColor: '#000666'
        });
    });
}
</script>
