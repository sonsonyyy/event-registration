<?php

return [
    'registrant_access_path' => env(
        'REGISTRANT_ACCESS_PATH',
        'church-representative-access',
    ),

    'receipts_disk' => env(
        'ONLINE_REGISTRATION_RECEIPTS_DISK',
        in_array(env('APP_ENV', 'local'), ['prod', 'production'], true) ? 's3' : 'local',
    ),

    'receipt_max_kb' => (int) env('ONLINE_REGISTRATION_RECEIPT_MAX_KB', 5120),

    'receipt_directory' => env('ONLINE_REGISTRATION_RECEIPT_DIRECTORY', 'registration-receipts'),

    'receipt_temporary_url_ttl_minutes' => (int) env(
        'ONLINE_REGISTRATION_RECEIPT_URL_TTL_MINUTES',
        5,
    ),
];
