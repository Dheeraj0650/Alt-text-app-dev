<?php

define('ROOT_DIR', dirname(__FILE__));

require_once ROOT_DIR . '/config/config.php';
require_once ROOT_DIR . '/action.php';

if (getenv('DEV') == 'true') {
    setCustomCookie('dev', 'true');
    $_SESSION = array(
        'canvasDomain' => 'usu.instructure.com',
        'canvasUserID' => '1560078',
        'oauthConsumerKey' => 'N/A',
        'fullName' => 'Christopher Phillips',
        'domain' => 'usu.instructure.com',
        'userID' => '1560078',
        'login_id' => 'cphillips',
        'email_primary' => 'christopher.phillips@usu.edu',
        'user_image' => 'https://canvas.instructure.com/images/messages/avatar-50.png',
        'canvasURL' => 'https://usu.instructure.com',
        'courseName' => 'Alt Text Project',
        'role' => 'Instructor,urn:lti:instrole:ims/lis/Administrator',
        'roleName' => 'Christopher Phillips'
    );
}
else {
    if (key_exists('dev', $_COOKIE)) {
        setCustomCookie('dev', 'false');
    }

    $post_input = filter_input_array(INPUT_POST);
    $post_input['custom_canvas_user_id'] = filter_input(INPUT_POST, 'custom_canvas_user_id', FILTER_SANITIZE_NUMBER_INT);
    if (isset($post_input['custom_canvas_user_id'])){
        $_SESSION['canvasDomain'] = $post_input["custom_canvas_api_domain"];
        $_SESSION['canvasUserID'] = $post_input['custom_canvas_user_id'];
        $_SESSION['oauthConsumerKey'] = $post_input['oauth_consumer_key'];

        $_SESSION['fullName'] = $_POST['lis_person_name_full'];
        $_SESSION['domain'] = $_POST['custom_canvas_api_domain'];
        $_SESSION['userID'] = $_POST['custom_canvas_user_id'];
        $_SESSION['login_id'] = $_POST['custom_canvas_user_login_id'];
        $_SESSION['email_primary'] = $_POST['lis_person_contact_email_primary'];
        $_SESSION['name_given'] = $_POST['lis_person_name_given'];
        $_SESSION['user_image'] = $_POST['user_image'];
        $_SESSION['canvasURL'] = 'https://'.$_SESSION['domain'];
        $_SESSION['courseName'] = $_POST['context_title'];
        $_SESSION['role'] = $_POST['roles'];
        $_SESSION['roleName'] = $_POST['lis_person_name_full'];
    }
    else if (!isset($_SESSION['canvasUserID']) || !isset($_SESSION['canvasDomain'])) {
        echo "Missing lti credentials";
        exit;
    }

    // verify we have the variables we need from the LTI launch
    $expect = ['oauth_consumer_key', 'custom_canvas_api_domain', 'custom_canvas_user_id'];
    foreach ($expect as $key) {
        if (empty($post_input[$key])) {
            echo "missing launch information";
            exit;
        }
    }

    // verify LTI launch
    if (!verifyBasicLTILaunch()) {
        echo "lti validation error";
        exit;
    }
}

$_SESSION['authenticated'] = true;

// Add user to the database if they don't already exist
if (!Action::lmsIdExists($_SESSION['userID'])) {
    Action::createUser($_SESSION['userID'], $_SESSION['fullName']);
}

// Set user as an admin if they are an instructor in the canvas course
if (strpos($_SESSION['role'], 'Instructor') !== false) {
    $_SESSION['at_admin'] = true;
    setCustomCookie('at_admin', 'true');
}
else {
    if (key_exists('at_admin', $_COOKIE)) {
        $_SESSION['at_admin'] = false;
        setCustomCookie('at_admin', 'false');
    }
}

if (!array_key_exists('skippedImages', $_SESSION)) {
    $_SESSION['skippedImages'] = array();
}

// set redirect
header("Location: build/app.html");
exit();


function verifyBasicLTILaunch() {
    require_once(ROOT_DIR . '/lib/ims-blti/blti.php');
    $lti_secret = "LTISECRET----------------------------------";
    $context = new BLTI($lti_secret, false, false);

    return true;
    return isset($context->valid) && $context->valid;
}

function setCustomCookie($name, $value) {
    $path = getenv('DEV') == 'true' ? '/' : '/accessibility/alt-text';

    if (PHP_VERSION_ID < 70300) {
        // Hack to set SAMESITE=NONE and SECURE=TRUE for the session cookie
        setcookie($name, $value, 0, "{$path}; samesite=none", NULL, TRUE, FALSE);
    } 
    else {
        $cookieOptions = [
            'expires' => 'Session',
            'path' => $path,
            'domain' => NULL,
            'samesite' => 'None',
            'secure' => TRUE,
            'httponly' => FALSE,
        ];
        setcookie($name, $value, $cookieOptions);
    }
}
