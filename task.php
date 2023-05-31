<?php

define('ROOT_DIR', dirname(__FILE__));
 
require_once ROOT_DIR . '/config/config.php';
require ROOT_DIR . '/action.php';
// require_once ROOT_DIR . '/index.php';

if (!array_key_exists('authenticated', $_SESSION) || !$_SESSION) {

    if($_SERVER['REQUEST_METHOD'] === "POST"){
        $requestBody = json_decode(file_get_contents('php://input'), true);
        if (empty($requestBody) 
            || !array_key_exists('course_id', $requestBody)
            || !array_key_exists('is_priority', $requestBody)
            || !array_key_exists('oauth_consumer_key', $requestBody)
            || gettype($requestBody['is_priority']) != 'boolean'
        ) {
            http_response_code(401);
            echo "This resource can only be accessed from within canvas a";
            exit;
        }
        else {
            if(!($requestBody['oauth_consumer_key'] == getenv('CANVAS_ACCESS_TOKEN'))){
                http_response_code(401);
                echo "This resource can only be accessed from within canvas b";
                exit;
            }
        }
    }
    else {
        http_response_code(401);
        echo "This resource can only be accessed from within canvas";
        exit;
    }
}



switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($_GET['task']);
        break;
    case 'POST':
        handlePost($_GET['task']);
        break;
    default:
        Action::notFoundResponse();
}   

function handleGet($task) {
    // Get an image for a user. The user id comes from the current session.
    // task.php?task=get_image
    switch ($task) {
       
        case 'get_user_details':
            $userdetails = array(
                "username" => $_SESSION['name_given'],
                "userimage" => $_SESSION['user_image'],
                "role" => $_SESSION['role']
            );
            Action::jsonResponse($userdetails);
            break;

        case 'get_version':
            $data = array('version' => phpversion());
            Action::jsonResponse($data);
            break;
        
        case 'get_active_courses':
            $courses = [];
            $courseList = Action::getActiveCourses();

            foreach($courseList as $element){
                $courseId = $element["course_id"];
                $courseName = Action::getCourseName($courseId);
                array_push($courses, array('id' => $courseId, 'course_name' => $courseName));
            }

            Action::jsonResponse($courses);
            break;

        case 'update_course_id':
            $user = Action::getUserByLmsId($_SESSION['userID']);
            if ($user['success']) {
                $userId = $user['user_id'];
            }
            else {
                $data = array(
                    'error' => true,
                    'no_images' => false,
                    'message' => 'lms id does not exist'
                );
                Action::jsonResponse($data);
            }
            
            if (isset($_GET['lock'])) {

                $editorValue = DB::query(
                    "SELECT editor FROM at_image
                    WHERE id=%i",
                    $_GET['image_id']
                );


                if(count($editorValue) !== 0 && $editorValue[0]['editor'] != 0 && $editorValue[0]['editor'] != $userId){
                    $data = array(
                        'error' => "Image has been locked by other user. loading next image",
                    );
                    Action::jsonResponse($data);
                }
                else{
                    Action::updateEditorId($userId, $_GET['image_id'], $_GET['lock']);
                }
            }
            break;
        
        case 'get_lock_status':
            $user = Action::getUserByLmsId($_SESSION['userID']);
            if ($user['success']) {
                $userId = $user['user_id'];
            }
            else {
                $data = array(
                    'error' => true,
                    'no_images' => false,
                    'message' => 'lms id does not exist'
                );
                Action::jsonResponse($data);
            }

            $data = Action::getLockStatus($userId, $_GET['image_id']);
            Action::jsonResponse(array(
                                    'locked' => count($data) === 0 ? false:$data[0]['editor'] == $userId
                                ));
            break;

    
        case 'get_image':
            $user = Action::getUserByLmsId($_SESSION['userID']);
            if ($user['success']) {
                $userId = $user['user_id'];
            }
            else {
                $data = array(
                    'error' => true,
                    'no_images' => false,
                    'message' => 'lms id does not exist'
                );
                Action::jsonResponse($data);
            }

            validateUserId($userId);

            $selectedCourseId = isset($_GET['selectedCourse']) ? $_GET['selectedCourse'] : 0;

            if (isset($_GET['advanced_type'])) {
                validateAdvancedType($_GET['advanced_type']);
                $image = Action::getAdvancedImage($_GET['advanced_type'], $selectedCourseId);
            }
            else {
                $image = Action::getImage($selectedCourseId, $userId);
            }

            $courseName = Action::getCourseName($image['course_id']);

            if (is_null($image)) {
                $data = array(
                    'error' => true,
                    'no_images' => true,
                    'message' => 'no images in queue',
                );
            }
            else {
                $data = array(
                    'image_id' => $image['id'],
                    'url' => $image['image_url'],
                    'course_name' => $courseName
                );
            }
        
            Action::jsonResponse($data);
            break;
            
        case 'get_courses_info':
            $courseIds = Action::getCourseIds();
            $data = [];

            foreach($courseIds as $courseId) {
                $courseName = Action::getCourseName($courseId);
                $totalImages = Action::countTotalImages($courseId);
                $completedImages = Action::countCompletedImages($courseId);
                $publishedImages = Action::countPublishedImages($courseId);

                array_push($data, array(
                    'id' => $courseId,
                    'name' => $courseName,
                    'total_images' => $totalImages,
                    'completed_images' => $completedImages,
                    'published_images' => $publishedImages
                ));
            }

            Action::jsonResponse($data);
            break;

        case 'get_completed_images':
            if (isset($_GET['course_id'])) {
                $courseId = $_GET['course_id'];
            } else {
                $data = array(
                    'error' => true,
                    'message' => 'course_id not set'
                );
                Action::jsonResponse($data);
            }

            $completedImages = Action::getCourseCompletedImages($courseId);
            if ($completedImages == null) {
                $data = array(
                    'message' => 'there are no completed images for this course'
                );
                Action::jsonResponse($data);
            }
            
            $data = [];
            foreach($completedImages as $image) {

                array_push($data, array(
                    'image_url' => $image['image_url'],
                    'alt_text' => $image['alt_text'],
                    'image_id' => $image['id']
                ));
            }

            Action::jsonResponse($data);
            break;

        case 'get_image_usage':
            if (key_exists('image_id', $_GET)) {
                $imageId = $_GET['image_id'];
                validateImageId($imageId);

                $image = Action::getImageInfo($imageId);
                $courseId = $image['course_id'];
                $imageLmsId = $image['lms_id'];
            }
            else {
                $data = array(
                    'error' => true,
                    'message' => 'invalid parameters'
                );
                Action::jsonResponse($data);
            }

            $foundPageIds = Action::findUsagePages($imageLmsId, $courseId);
            $data = array(
                'image_id' => $imageLmsId,
                'course_id' => $courseId,
                'pages' => implode(', ', $foundPageIds)
            );
            Action::jsonResponse($data);
            break;

        case 'get_body':
            if (key_exists('page_url', $_GET)) {
                $pageUrl = $_GET['page_url'];
                $body = Action::getBody($pageUrl);
            }

            Action::jsonResponse(array('body' => $body));
            break;
        
        case 'count_completed_images':
            $data = array('completed_image_count' => count(Action::getCompletedImages()));
            Action::jsonResponse($data);
            break;

        case 'is_admin':
            $data = array('is_admin' => $_SESSION['admin']);
            Action::jsonResponse($data);
            break;

        case 'test':
            $test = Action::testDb();
            $data = array('test' => $test);
            Action::jsonResponse($data);
            break;

        case 'reset_test_images':
            $_SESSION['skippedImages'] = [];
            Action::resetTestImages();
            $data = array('done' => true);
            Action::jsonResponse($data);
            break;
        
        default:
            Action::notFoundResponse();
            break;
    }
}

function handlePost($task) {
    // Load all the images from a canvas course that need alt text. The required course id is the course's six-digit canvas id
    // task.php?task=load_images
    switch ($task) {
            case 'load_images':
                $requestBody = json_decode(file_get_contents('php://input'), true);
                if(empty($requestBody) || !array_key_exists('oauth_consumer_key', $requestBody)){
                    if (empty($requestBody) 
                        || !array_key_exists('course_id', $requestBody)
                        || !array_key_exists('is_priority', $requestBody)
                        || gettype($requestBody['is_priority']) != 'boolean'
                    ) {
                        $data = array(
                            'error' => true,
                            'message' => 'invalid request body',
                        );
                        Action::jsonResponse($data);
                    }
                    Action::authorize();
                }
                else {
                    if (empty($requestBody) 
                        || !array_key_exists('course_id', $requestBody)
                        || !array_key_exists('is_priority', $requestBody)
                        || !array_key_exists('oauth_consumer_key', $requestBody)
                        || gettype($requestBody['is_priority']) != 'boolean'
                    ) {
                        $data = array(
                            'error' => true,
                            'message' => 'invalid request body',
                        );
                        Action::jsonResponse($data);
                    }

                    if(!($requestBody['oauth_consumer_key'] == getenv('CANVAS_ACCESS_TOKEN'))){
                        Action::authorize();
                    }

                }

                $courseId = $requestBody['course_id'];
                validateCourseId($courseId);
                // Fetch the course name from the Canvas API and add the course to the courses table if it doesn't already exist
                if (!Action::courseExists($courseId)) {
                    $courseName = Action::getCourseNameCanvas($courseId);
                    Action::createCourse($courseId, $courseName);
                }

                $images = Action::getCourseImages($courseId);  
        
                if (array_key_exists('error', $images)) {

                    $data = array(
                        'error' => true,
                        'message' => $images['message'],
                    );
                    Action::jsonResponse($data);
                }
            
                $errors = 0;
                $imagesAdded = 0;
                foreach ($images as $image) {
                    $success = Action::createImage($image, $requestBody['is_priority']);
                    if ($success) {
                        $imagesAdded++;
                    }
                    else {
                        $errors++;
                    }
                }
            
                if ($errors == 0) {
                    $data = array(
                        'images_added' => $imagesAdded,
                    );
                    Action::jsonResponse($data);
                }
                else {
                    $message = $errors == 1 ? 
                        'additional image was found that is already in the database' : 
                        'additional images were found that are already in the database';
                    $data = array(
                        'images_added' => $imagesAdded,
                        'message' => "{$errors} {$message}",
                    );
                    Action::jsonResponse($data);   
                }
                break;

            case 'get_alt_text_updated_user_name':
                // retrieve and validate the request body
                $requestBody = json_decode(file_get_contents('php://input'), true);
                if (empty($requestBody) || 
                    !array_key_exists('image_url', $requestBody)
                ) {
                    $data = array(
                        'error' => true,
                        'message' => 'invalid request body',
                    );
                    Action::jsonResponse($data);
                }

                $imageUrl = $requestBody['image_url'];
                $username = Action::getAltTextUpdatedUserInfo($imageUrl);

                if($imageUrl == "all"){
                    Action::jsonResponse($username);   
                }
                else{
                    $data = array(
                        'username' => $username['alttext_updated_user'],
                        'userurl' => $username['user_url']
                    );
                    Action::jsonResponse($data);   
                }


                break;

            // Set an image as completed. The image id must be the image id in the database.
            // task.php?task=set_image_completed
            case 'set_image_completed':
                // retrieve and validate the request body
                $requestBody = json_decode(file_get_contents('php://input'), true);
                if (empty($requestBody) || 
                    !array_key_exists('image_id', $requestBody) ||
                    !array_key_exists('alt_text', $requestBody) ||
                    !array_key_exists('is_decorative', $requestBody) ||
                    !array_key_exists('username', $requestBody) ||
                    !array_key_exists('userurl', $requestBody) ||
                    gettype($requestBody['is_decorative']) != "boolean" ||
                    ($requestBody['alt_text'] == '' && !$requestBody['is_decorative'])
                ) {
                    $data = array(
                        'error' => true,
                        'message' => 'invalid request body',
                    );
                    Action::jsonResponse($data);
                }
    
                $imageId = $requestBody['image_id'];
                validateImageId($imageId);
            
                if (Action::imageIsCompleted($imageId)) {
                    $data = array(
                        'error' => true,
                        'message' => 'image is already completed',
                    );
                    Action::jsonResponse($data);
                }
                
                
                $isDecorative = $requestBody['is_decorative'];
                $altText = $isDecorative ? null : htmlspecialchars($requestBody['alt_text'], ENT_QUOTES);
                $currentTime = new DateTime();

                $image = Action::doesAltTextUpdatedUserExist($requestBody['image_id']);

                if(!is_null($image['image'])){
                    Action::updateAltTextUserName($imageUrl, $requestBody['username'], $requestBody['userurl']);
                }
                else{
                    Action::insertAltTextUser($image['image_url'], $requestBody['username'], $requestBody['userurl']);
                }

                $status = Action::setImageCompleted($imageId, $altText, $isDecorative, $currentTime);
                if ($status['success']) {
                    $data = array(
                        'image_id' => $imageId,
                        'alt_text' => $altText,
                        'is_decorative' => $isDecorative,
                        'date_completed' => $currentTime,
                    );
                }
                else {
                    $data = array(
                        'error' => true,
                        'message' => $status['message'],
                    );
                }
            
                Action::jsonResponse($data);
                break;
        // Push the alt text for the completed images back to canvas.
        // task.php?task=push_image
        case 'push_image':
            Action::authorize();
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) || !array_key_exists('course_id', $requestBody)) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body',
                );
                Action::jsonResponse($data);
            }

            $courseId = $requestBody['course_id'];
            validateCourseId($courseId);

            $images = Action::getCourseCompletedImages($courseId);
            if (is_null($images) || empty($images)) {
                $data = array(
                    'pushed_images' => 0,
                    'message' => 'there are no images that are ready to be pushed back to canvas'
                );
                Action::jsonResponse($data);
            }

            $pushedImages = 0;
            $failedImages = [];
            $newPushedImages = Action::updateCourseImages($images);
            if ($newPushedImages == -1) {
                array_push($failedImages, $images[0]['course_id']);
            }
            else {
                $pushedImages += $newPushedImages;
            }

            $data = array('pushed_images' => $pushedImages);
            if (!empty($failedImages)) {
                $data['failed image ids'] = implode(', ', $failedImages);
                $data['message'] = 'images failing to push is usually caused by the course no longer existing in canvas';
            }

            // Action::updateMondayBoard($courseId);
            Action::jsonResponse($data);
            break;

        // Push the alt text for the completed images back to canvas.
        // task.php?task=push_images
        case 'push_images':
            Action::authorize();
            $images = Action::getCompletedImages();
            if (is_null($images)) {
                $data = array(
                    'pushed_images' => 0,
                    'message' => 'there are no images that are ready to be pushed back to canvas'
                );
                Action::jsonResponse($data);
            }

            // Sort the images into individual arrays for each course
            $courses = [];
            foreach ($images as $image) {
                if (!key_exists($image['course_id'], $courses)) {
                    $courses[$image['course_id']] = array($image);
                }
                else {
                    array_push($courses[$image['course_id']], $image);
                }
            }

            $pushedImages = 0;
            $failedImages = [];
            foreach ($courses as $images) {
                $newPushedImages = Action::updateCourseImages($images);
                if ($newPushedImages == -1) {
                    array_push($failedImages, $images[0]['course_id']);
                }
                else {
                    $pushedImages += $newPushedImages;
                }
            }

            $data = array('pushed_images' => $pushedImages);
            if (!empty($failedImages)) {
                $data['failed image ids'] = implode(', ', $failedImages);
                $data['message'] = 'images failing to push is usually caused by the course no longer existing in canvas';
            }

            Action::jsonResponse($data);
            break;

        // Skip an image. This only lasts as long as the user's session.
        // task.php?task=skip_image
        case 'skip_image':
            // retrieve and validate the request body
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) || !array_key_exists('image_id', $requestBody)
            ) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body',
                );
                Action::jsonResponse($data);
            }

            $imageId = $requestBody['image_id'];
            validateImageId($imageId);

            array_push($_SESSION['skippedImages'], $imageId);

            Action::resetImage($imageId);

            $data = array('error' => false);
            Action::jsonResponse($data);

        case 'mark_image_as_advanced':
            // retrieve and validate the request body
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) || 
                !array_key_exists('image_id', $requestBody) || 
                !array_key_exists('advanced_type', $requestBody)
            ) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body',
                );
                Action::jsonResponse($data);
            }

            $imageId = $requestBody['image_id'];
            validateImageId($imageId);
            
            $advancedType = $requestBody['advanced_type'];
            validateAdvancedType($advancedType);

            Action::markImageAsAdvanced($imageId, $advancedType);
            $data = array('error' => false);
            Action::jsonResponse($data);
        case 'update_image_alt_text':
            // retrieve and validate the request body
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) ||
                !array_key_exists('image_url', $requestBody) ||
                !array_key_exists('new_alt_text', $requestBody)
            ) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body',
                );
                Action::jsonResponse($data);    
            }

            $data = Action::updateAltText($requestBody['image_url'], $requestBody['new_alt_text']);
            
            Action::jsonResponse($data);
            break;
        case 'update_user_alt_text':
            // retrieve and validate the request body
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) ||
                !array_key_exists('image_url', $requestBody) ||
                !array_key_exists('new_user', $requestBody) ||
                !array_key_exists('user_url', $requestBody)
            ) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body',
                );
                Action::jsonResponse($data);    
            }

            $data = Action::updateAltTextUserName($requestBody['image_url'], $requestBody['new_user'], $requestBody['user_url']);
            
            Action::jsonResponse($data);
            break;
        case 'mark_image_as_unusable':
            // retrieve and validate the request body
            $requestBody = json_decode(file_get_contents('php://input'), true);
            if (empty($requestBody) || 
                !array_key_exists('image_id', $requestBody)
            ) {
                $data = array(
                    'error' => true,
                    'message' => 'invalid request body'
                );
                Action::jsonResponse($data);
            }

            if (!Action::imageExists($requestBody['image_id'])) {
                $data = array(
                    'error' => true,
                    'message' => "image id doesn't exist"
                );
                Action::jsonResponse($data);
            }

            Action::markImageAsUnusable($requestBody['image_id']);
            $data = array(
                'error' => false,
                'image_id' => $requestBody['image_id'],
            );
            Action::jsonResponse($data);

        default:
            Action::notFoundResponse();
            break;
    }
}

// Validation functions
function validateImageId($imageId) {
    if (!preg_match('/^[0-9]*$/', $imageId) || intval($imageId) <= 0) {
        $data = array(
            'error' => true,
            'message' => 'invalid request body',
        );
        Action::jsonResponse($data);
        exit;
    }
    else if (!Action::imageExists($imageId)) {
        $data = array(
            'error' => true,
            'message' => 'image not found',
        );
        Action::jsonResponse($data);
        exit;
    }
}

function validateUserId($userId) {
    if (!preg_match('/^[0-9]*$/', $userId) || intval($userId) <= 0) {
        $data = array(
            'error' => true,
            'no_images' => false,
            'message' => 'invalid user id',
        );
        Action::jsonResponse($data);
    }

    if (!Action::userExists($userId)) {
        $data = array(
            'error' => true,
            'no_images' => false,
            'message' => 'user not found',
        );
        Action::jsonResponse($data);
    }
}

function validateCourseId($courseId) {
    if (!preg_match('/^[0-9]{6}$/', $courseId)) {
        $data = array(
            'error' => true,
            'message' => 'invalid course id',
        );
        Action::jsonResponse($data);
    }
}

function validateAdvancedType($advancedType) {
    require ROOT_DIR . '/advancedTypes.php';

    if (!in_array($advancedType, $ADVANCED_TYPES)) {
        $data = array(
            'error' => true,
            'message' => 'invalid advanced type',
        );
        Action::jsonResponse($data);
    }
}

?>