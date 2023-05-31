<?php
ini_set("error_reporting", "true");
error_reporting(E_ALL);

define('ENV_TYPE', 'dev');

// Load environment variables
require ROOT_DIR . '/lib/DotEnv.php';
$dotEnv = new DotEnv(ROOT_DIR . '/.env');
$dotEnv->load();

// Load the other dependencies
require ROOT_DIR . '/lib/meekrodb.2.3.class.php';
require ROOT_DIR . '/lib/ims-blti/blti.php';
require ROOT_DIR . '/lib/canvasAPI.php';

// Database connection information for Template Wizard
if (getenv('DEV') == "true") {
    DB::$host = getenv('DB_HOST');
    DB::$user = getenv('DB_USER');
    DB::$password = getenv('DB_PASSWORD');
    DB::$dbName = getenv('DB_NAME');
}
else {
    DB::$host = getenv('DB_HOST');
    DB::$user = getenv('DB_USER');
    DB::$password = getenv('DB_PASSWORD');
    DB::$dbName = getenv('DB_NAME');
}


$path = getenv('DEV') == 'true' ? '/' : '/accessibility/alt-text';

if (PHP_VERSION_ID < 70300) {
    // Hack to set SAMESITE=NONE and SECURE=TRUE for the session cookie
    session_set_cookie_params(0, "{$path}; samesite=none", NULL, TRUE, FALSE);
} 
else {
    $cookieOptions = [
        'lifetime' => 0,
        'path' => $path,
        'domain' => NULL,
        'samesite' => 'None',
        'secure' => TRUE,
        'httponly' => FALSE,
        'authenticated' => FALSE
    ];
    @session_set_cookie_params($cookieOptions);
}

ini_set('max_execution_time', 900); // set the time limit to 60 seconds

session_start();
