<?php

class Action
{
    public static function testDb() {
        $test = DB::query(
            "SELECT * FROM at_image"
        );

        return $test;
    }

    public static function getCanvasPage($courseId) {
        $test = DB::query(
            "SELECT canvas_page FROM at_image WHERE lms_id = %i",
            $courseId
        );

        return $test;
    }

    public static function getAssignmentPage($courseId) {
        $test = DB::query(
            "SELECT assignment_url FROM at_image WHERE lms_id = %i",
            $courseId
        );

        return $test;
    }

    public static function getTopicPage($courseId) {
        $test = DB::query(
            "SELECT topic_url FROM at_image WHERE lms_id = %i",
            $courseId
        );

        return $test;
    }

    public static function updateEditorId($userId, $id, $lockStatus) {
        $editor = DB::query(
                        "UPDATE at_image
                        SET editor=%i 
                        WHERE id=%i",
                        $lockStatus !== "false"?$userId:0, $id
                    );
    }

    public static function getLockStatus($userId, $id) {
        $editor = DB::query(
                        "SELECT editor FROM at_image
                        WHERE id=%i",
                        $id
                    );
        return $editor;
    }

    public static function resetTestImages() {
        if (true) {
            DB::query(
                "UPDATE at_image
                SET editor=NULL, alt_text=NULL, is_decorative=NULL, completed_at=NULL, advanced_type=NULL, pushed_to_canvas=0, is_unusable=0"
            );
        }
        else {
            DB::query(
                "UPDATE at_image
                SET editor=0, alt_text='', is_decorative=NULL, completed_at='0000-00-00', pushed_to_canvas=0, advanced_type=NULL, is_unusable=0
                WHERE id<10"
            );
        }
    }

    public static function sectionVariableSetUp(){
        if (isset($_POST['custom_canvas_course_id'])){
            $_SESSION['courseID'] = $_POST['custom_canvas_course_id'];
            $_SESSION['userID'] = $_POST['custom_canvas_user_id'];
            $_SESSION['login_id'] = $_POST['custom_canvas_user_login_id'];
            $_SESSION['email_primary'] = $_POST['lis_person_contact_email_primary'];
            $_SESSION['name_given'] = $_POST['lis_person_name_given'];
            $_SESSION['user_image'] = $_POST['user_image'];
            $_SESSION['domain'] = $_POST['custom_canvas_api_domain'];
            $_SESSION['canvasURL'] = 'https://'.$_SESSION['domain'];
            $_SESSION['courseName'] = $_POST['context_title'];
            $_SESSION['role'] = $_POST['roles'];
            $_SESSION['roleName'] = $_POST['lis_person_name_full'];

            $lti_secret = "LTISECRET----------------------------------";

            $context = new BLTI($lti_secret, false, false);

            if ($context->valid) {
                $_SESSION['valid'] = true;
            } else {
                echo 'Page can only be accessed through Canvas';
                exit;
            }
        }
    }

    // Http Responses
    public static function jsonResponse($data) {
        header("Content-Type: application/json");
        echo json_encode($data);
        exit;
    }

    public static function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array('error' => 'resource not found'));
        exit;
    }

    public static function authorize() {
        if (!$_SESSION['at_admin']) {
            http_response_code(403);
            echo json_encode(array('error' => "you don't have permission to access this resource"));
            exit;
        }
    }

    public static function getAltTextUpdatedUserInfo($imageUrl){
        if($imageUrl == "all"){
            $userName = DB::query(
                "SELECT * FROM at_alt_text");
            return $userName;
        }
        else{
            $userName = DB::queryFirstRow(
                "SELECT alttext_updated_user, user_url FROM at_alt_text 
                WHERE image_url=%s", $imageUrl);
            return $userName;
        }
    }

    public static function getActiveCourses(){
        $activeCourses = DB::query(
            "SELECT id, course_id FROM at_image 
            WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0
            ORDER BY created_at ASC"
        );

        return $activeCourses;
    }

    // Database Queries
    public static function getImage($selectedCourseId, $userId) {
        if (empty($_SESSION['skippedImages'])) {
            $image = DB::queryFirstRow(
                "SELECT id, image_url, course_id FROM at_image 
                WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0 AND course_id = %i AND editor = %i
                ORDER BY created_at ASC
                LIMIT 1",
                $selectedCourseId, $userId
            );

            if(is_null($image)){
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable=0 AND course_id = %i AND editor = 0
                    ORDER BY created_at ASC
                    LIMIT 1",
                    $selectedCourseId
                );
            }
   
            if (is_null($image)) {
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable = 0 AND editor = %i
                    ORDER BY is_priority DESC, created_at ASC
                    LIMIT 1",
                    $userId
                );

                if(is_null($image)){
                    $image = DB::queryFirstRow(
                        "SELECT id, image_url, course_id FROM at_image 
                        WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type IS NULL AND is_unusable = 0 AND editor = 0
                        ORDER BY is_priority DESC, created_at ASC
                        LIMIT 1"
                    );
                }
            }


        }
        else {
            $image = DB::queryFirstRow(
                "SELECT id, image_url, course_id FROM at_image 
                WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type IS NULL AND is_unusable=0 AND course_id = %i AND editor = %i
                ORDER BY created_at ASC
                LIMIT 1", 
                $_SESSION['skippedImages'], $selectedCourseId, $userId
            );

            if (is_null($image)) {
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type IS NULL AND is_unusable=0 AND course_id = %i AND editor = 0
                    ORDER BY created_at ASC
                    LIMIT 1", 
                    $_SESSION['skippedImages'], $selectedCourseId
                );
            }

            if (is_null($image)) {
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type IS NULL AND is_unusable=0 AND editor = %i
                    ORDER BY is_priority DESC, created_at ASC
                    LIMIT 1", 
                    $_SESSION['skippedImages'], $userId
                );

                if (is_null($image)) {
                    $image = DB::queryFirstRow(
                        "SELECT id, image_url, course_id FROM at_image 
                        WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type IS NULL AND is_unusable=0 AND editor = 0
                        ORDER BY is_priority DESC, created_at ASC
                        LIMIT 1", 
                        $_SESSION['skippedImages']
                    );
                }
            }
        }
    
        return $image;
    }

    public static function getAdvancedImage($advancedType, $selectedCourseId) {
        if (empty($_SESSION['skippedImages'])) {
            $image = DB::queryFirstRow(
                "SELECT id, image_url, course_id FROM at_image 
                WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=%s AND is_unusable=0
                ORDER BY created_at ASC
                LIMIT 1"
                ,$advancedType
            );
            if (is_null($image)) {
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND advanced_type=%s AND is_unusable=0
                    ORDER BY is_priority DESC, created_at ASC
                    LIMIT 1",
                    $advancedType
                );
        
                if (!is_null($image)) {
                    DB::query(
                        "UPDATE at_image
                        SET editor=%i 
                        WHERE id=%i",
                        $userId, $image['id']
                    );
                }
            }
        }
        else {
            $image = DB::queryFirstRow(
                "SELECT id, image_url, course_id FROM at_image 
                WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type=%s AND is_unusable=0
                ORDER BY created_at ASC
                LIMIT 1", 
                $_SESSION['skippedImages'], $advancedType
            );
        
            if (is_null($image)) {
                $image = DB::queryFirstRow(
                    "SELECT id, image_url, course_id FROM at_image 
                    WHERE completed_at = '0000-00-00 00:00:00' AND id NOT IN %li AND advanced_type=%s AND is_unusable=0
                    ORDER BY is_priority DESC, created_at ASC
                    LIMIT 1", 
                    $_SESSION['skippedImages'], $advancedType
                );
        
                if (!is_null($image)) {
                    DB::query(
                        "UPDATE at_image
                        SET editor=%i 
                        WHERE id=%i",
                        $userId, $image['id']
                    );
                }
            }
        }
    
        return $image;
    }

    public static function getUserByLmsId($lmsId) {
        $user = DB::queryFirstRow(
            "SELECT id FROM at_user
            WHERE lms_id=%i
            LIMIT 1",
            $lmsId
        );

        if (is_null($user)) {
            return array(
                'success' => false,
                'message' => 'user does not exist'
            );
        }
        else {
            return array(
                'success' => true,
                'user_id' => $user['id'],
                'lms_id' => $lmsId
            );
        }
    }
    
    public static function setImageCompleted($imageId, $altText, $isDecorative, $currentTime) {
        $image = DB::queryFirstRow(
            "SELECT editor FROM at_image
            WHERE id=%i
            LIMIT 1",
            $imageId
        );
        if (is_null($image['editor'])) {
            return array(
                'success' => false,
                'message' => 'image does not have an editor',
            );
        }
    
        if ($isDecorative) {
            DB::query(
                "UPDATE at_image
                SET alt_text=NULL, is_decorative=%i, completed_at=%t
                WHERE id=%i",
                $isDecorative, $currentTime, $imageId
            );
        }
        else {
            DB::query(
                "UPDATE at_image
                SET alt_text=%s, is_decorative=NULL, completed_at=%t
                WHERE id=%i",
                $altText, $currentTime, $imageId
            );
        }
        
        $counter = DB::affectedRows();
        if ($counter == 1) {
            Action::incrementImagesCompleted($image['editor']);
            return array(
                'success' => true,
                'message' => 'success!',
            );
        }
        return array(
            'success' => false,
            'message' => 'no images were affected',
        );
    }
    
    public static function userExists($userId) {
        $user = DB::queryFirstRow(
            "SELECT 1 FROM at_user
            WHERE id=%i
            LIMIT 1",
            $userId
        );
    
        return !is_null($user);
    }

    public static function lmsIdExists($lmsId) {
        $user = DB::queryFirstRow(
            "SELECT 1 FROM at_user
            WHERE lms_id=%i
            LIMIT 1",
            $lmsId
        );
    
        return !is_null($user);
    }
    
    public static function imageExists($imageId) {
        $image = DB::queryFirstRow(
            "SELECT 1 FROM at_image
            WHERE id=%i
            LIMIT 1",
            $imageId
        );
    
        return !is_null($image);
    }

    public static function courseExists($courseId) {
        $course = DB::queryFirstRow(
            "SELECT 1 from at_course
            WHERE id=%i
            LIMIT 1",
            $courseId
        );

        return !is_null($course);
    }
    
    public static function imageIsCompleted($imageId) {
        $image = DB::queryFirstRow(
            "SELECT completed_at FROM at_image
            WHERE id=%i
            LIMIT 1",
            $imageId
        );
    
        return ($image['completed_at'] != '0000-00-00 00:00:00' && !is_null($image['completed_at']));
    }

    public static function doesAltTextUpdatedUserExist($imageId) {
        $imageUrl = DB::queryFirstRow(
            "SELECT image_url FROM at_image
            WHERE id=%i
            LIMIT 1",
            $imageId
        );

        $image = DB::queryFirstRow(
            "SELECT image_url FROM at_alt_text
            WHERE image_url=%s
            LIMIT 1",
            $imageUrl['image_url']
        );
        
        return array(
            'image_url' => $imageUrl,
            'image' => $image['image_url'],
        );
    }

    public static function updateAltTextUserName($imageUrl, $userName, $userUrl){
        $image = DB::query(
            "UPDATE at_alt_text
            SET alttext_updated_user=%s, user_url=%s
            WHERE image_url=%s",
            $userName, $userUrl, $imageUrl
        );
    }

    public static function createImage($image, $isPriority) {
        $imageExists = DB::queryFirstRow(
            "SELECT 1 FROM at_image
            WHERE lms_id=%i
            LIMIT 1",
            $image['lmsId']
        );
        if (is_null($imageExists)) {
            $canvas_page = isset($image['canvas_page'])?$image['canvas_page']:"";
            $assignment_url = isset($image['assignment_url'])?$image['assignment_url']:"";
            $topic_url = isset($image['topic_url'])?$image['topic_url']:"";

            DB::insert('at_image', [
                'lms_id' => $image['lmsId'],
                'course_id' => $image['courseId'],
                'image_url' => $image['url'],
                'is_priority' => $isPriority,
                'created_at' => new DateTime(),
                'canvas_page' => $canvas_page,
                'assignment_url' => $assignment_url,
                'topic_url' => $topic_url
            ]);

            return true;
        }
        else {

            // $canvas_page = isset($image['canvas_page'])?$image['canvas_page']:"";
            // $assignment_url = isset($image['assignment_url'])?$image['assignment_url']:"";
            // $topic_url = isset($image['topic_url'])?$image['topic_url']:"";

            // DB::query(
            //     "
            //         UPDATE at_image
            //         SET image_url = '{$image['url']}',
            //             canvas_page = '{$canvas_page}',
            //             assignment_url = '{$assignment_url}',
            //             topic_url = '{$topic_url}'
            //         WHERE lms_id = '{$image['lmsId']}'
            //         AND course_id = '{$image['courseId']}'
            //     "
            // );
            
            return false;
        }
    }

    public static function getCompletedImages() {
        return DB::query(
            "SELECT id, lms_id, course_id, alt_text, is_decorative FROM at_image
            WHERE NOT completed_at='0000-00-00 00:00:00' 
            AND pushed_to_canvas=0"
        );
    }

    public static function getCourseCompletedImages($courseId) {
        return DB::query(
            "SELECT id, lms_id, course_id, image_url, alt_text, is_decorative FROM at_image
            WHERE course_id=%i
            AND NOT completed_at='0000-00-00 00:00:00' 
            AND pushed_to_canvas=0",
            $courseId
        );
    }

    public static function getCourseIds() {
        $courses = DB::query("SELECT id FROM at_course");
        $ids = [];

        foreach($courses as $course) {
            array_push($ids, $course['id']);
        }
        return $ids;
    }

    public static function getCourseName($courseId) {
        $course = DB::queryFirstRow(
            "SELECT course_name FROM at_course
            WHERE id=%i
            LIMIT 1",
            $courseId
        );

        return $course['course_name'];
    }

    public static function countTotalImages($courseId) {
        return DB::query(
            "SELECT COUNT(id) FROM at_image
            WHERE course_id=%i",
            $courseId
        )[0]['COUNT(id)'];
    }

    public static function countCompletedImages($courseId) {
        return DB::query(
            "SELECT COUNT(id) FROM at_image
            WHERE course_id=%i
            AND completed_at IS NOT NULL AND completed_at!='0000-00-00 00:00:00'",
            $courseId
        )[0]['COUNT(id)'];
    }

    public static function countPublishedImages($courseId) {
        return DB::query(
            "SELECT COUNT(id) FROM at_image
            WHERE course_id=%i
            AND pushed_to_canvas=1",
            $courseId
        )[0]['COUNT(id)'];
    }

    public static function createUser($lmsId, $displayName) {
        DB::insert('at_user', [
            'created_at' => new DateTime(),
            'lms_id' => $lmsId,
            'display_name' => $displayName,
            'images_completed' => 0
        ]);
    }

    public static function createCourse($courseId, $courseName) {
        DB::insert('at_course', [
            'id' => $courseId,
            'course_name' => $courseName
        ]);
    }

    public static function resetImage($imageId) {
        if (getenv('DEV') == 'true') {
            DB::query(
                "UPDATE at_image
                SET editor=NULL
                WHERE id=%i",
                $imageId
            );
        }
        else {
            DB::query(
                "UPDATE at_image
                SET editor=0
                WHERE id=%i",
                $imageId
            );
        }
    }

    public static function getImageInfo($imageId) {
        $image = DB::queryFirstRow(
            "SELECT course_id, lms_id FROM at_image
            WHERE id=%i",
            $imageId
        );
        return $image;
    }

    public static function markImageAsAdvanced($imageId, $advancedType) {
        DB::query(
            "UPDATE at_image
            SET advanced_type=%s, editor=NULL
            WHERE id=%i",
            $advancedType, $imageId
        );
    }

    public static function markImageAsUnusable($imageId) {
        DB::query(
            "UPDATE at_image
            SET is_unusable=1
            WHERE id=%i",
            $imageId
        );
    }

    private static function setPushedToCanvas($imageId) {
        DB::query(
            "UPDATE at_image
            SET pushed_to_canvas=true
            WHERE id=%i",
            $imageId
        );
    }

    private static function incrementImagesCompleted($userId) {
        $oldVal = DB::queryFirstRow(
            "SELECT images_completed
            FROM at_user
            WHERE id=%i",
            $userId
        )['images_completed'];
        
        $oldVal++;
        DB::query(
            "UPDATE at_user
            SET images_completed=%i
            WHERE id=%i",
            $oldVal, $userId
        );
    }


    // Canvas API functions
    public static function getCourseImages($courseId) {
        $files = curlGet("courses/{$courseId}/files");
        if (is_null($files)) {
            return array(
                'error' => true,
                'message' => 'Course does not contain any images'
            );
        }
        else if (array_key_exists('errors', $files)) {
            return array(
                'error' => true,
                'message' => "Canvas error: {$files['errors'][0]['message']}",
            );
        }
        
        $images = [];
        foreach ($files as $file) {
            if ($file['mime_class'] == 'image') {
                $newImage = [];
                $newImage['lmsId'] = $file['id'];
                $newImage['courseId'] = $courseId;
                $newImage['url'] = $file['url'];
                array_push($images, $newImage);
            }
        }

        $imagesInUse = Action::findCourseImages($images, $courseId);

        return $imagesInUse;
    }

    public static function updateCourseImages($images) {
        $courseId = $images[0]['course_id'];
        $pushedImages = 0;

        foreach ($images as $image) {
            $imageId = $image['lms_id'];

            $canvas_page = Action::getCanvasPage($imageId);
            if(!is_null($canvas_page) && $canvas_page[0]['canvas_page'] != ""){

                $canvas_page_url = $canvas_page[0]['canvas_page'];

                $delimiter = ";";
                $pageArray = explode($delimiter, $canvas_page_url);
                $main_url = $pageArray[0];

                $delimiter_1 = "/";
                $mainArray = explode($delimiter_1, $main_url);
                $prefix = implode("/",array_slice($mainArray, 0, -1));

                foreach($pageArray as $element){
                    $canvas_page_url = "";

                    if($element == $main_url){
                        $canvas_page_url = $main_url;
                    }
                    else {
                        $canvas_page_url = $prefix . "/" . $element;
                    }

                    $response = curlGet($canvas_page_url);
        
                    if (key_exists('errors', $response)) {
                        return -1;
                    }

                    $body = $response['body'];

                    $oldBody = $body;
                    $body = Action::replaceImages($body, $image, $courseId);
                    if ($body != $oldBody) {
                        $pushedImages++;
                    }

                    $url = explode("/", $canvas_page_url);
                    $url = end($url);
        
                    Action::updatePage($courseId, $url, $body);
                }
            }

            $assignment_page = Action::getAssignmentPage($imageId);
            if(!is_null($assignment_page) && $assignment_page[0]['assignment_url'] != ""){
                $assignment_page_url = $assignment_page[0]['assignment_url'];

                $delimiter = ";";
                $pageArray = explode($delimiter, $assignment_page_url);
                $main_url = $pageArray[0];

                $delimiter_1 = "/";
                $mainArray = explode($delimiter_1, $main_url);
                $prefix = implode("/",array_slice($mainArray, 0, -1));

                foreach($pageArray as $element){
                    $assignment_page_url = "";

                    if($element == $main_url){
                        $assignment_page_url = $main_url;
                    }
                    else {
                        $assignment_page_url = $prefix . "/" . $element;
                    }

                    $response = curlGet($assignment_page_url);
        
                    if (key_exists('errors', $response)) {
                        return -1;
                    }

                    $body = $response['description'];

                    $oldBody = $body;
                    $body = Action::replaceImages($body, $image, $courseId);
                    if ($body != $oldBody) {
                        $pushedImages++;
                    }

                    $url = explode("/", $assignment_page_url);
                    $url = end($url);
        
                    Action::updateAssignment($courseId, $url, $body);
                }
            }

            $topic_page = Action::getTopicPage($imageId);
            if(!is_null($topic_page) && $topic_page[0]['topic_url'] != ""){
                $topic_page_url = $topic_page[0]['topic_url'];

                $delimiter = ";";
                $pageArray = explode($delimiter, $topic_page_url);
                $main_url = $pageArray[0];

                $delimiter_1 = "/";
                $mainArray = explode($delimiter_1, $main_url);
                $prefix = implode("/",array_slice($mainArray, 0, -1));

                foreach($pageArray as $element){
                    $topic_page_url = "";

                    if($element == $main_url){
                        $topic_page_url = $main_url;
                    }
                    else {
                        $topic_page_url = $prefix . "/" . $element;
                    }

                    $response = curlGet($topic_page_url);
        
                    if (key_exists('errors', $response)) {
                        return -1;
                    }

                    $body = $response['message'];

                    $oldBody = $body;
                    $body = Action::replaceImages($body, $image, $courseId);
                    if ($body != $oldBody) {
                        $pushedImages++;
                    }

                    $url = explode("/", $topic_page_url);
                    $url = end($url);
        
                    Action::updateDiscussion($courseId, $url, $body);
                }
            }
        }

        return $pushedImages;
    }

    public static function findUsagePages($imageId, $courseId) {
        $foundUrls = [];

        $canvas_page = Action::getCanvasPage($imageId);
        if(!is_null($canvas_page) && $canvas_page[0]['canvas_page'] != ""){
            $canvas_page_url = $canvas_page[0]['canvas_page'];
            array_push($foundUrls, $canvas_page_url);
        }

        $assignment_page = Action::getAssignmentPage($imageId);
        if(!is_null($assignment_page) && $assignment_page[0]['assignment_url'] != ""){
            $assignment_page_id = $assignment_page[0]['assignment_url'];
            array_push($foundUrls, $assignment_page_id);
        }

        $discussions_page = Action::getTopicPage($imageId);
        if(!is_null($discussions_page) && $discussions_page[0]['topic_url'] != ""){
            $topic_page_id = $discussions_page[0]['topic_url'];
            array_push($foundUrls, $topic_page_id);
        }

        return $foundUrls;
    }

    public static function getBody($url) {
        if (strpos($url, 'pages')) {
            $body = curlGet($url)['body'];
        }
        else if (strpos($url, 'assignments')) {
            $body = curlGet($url)['description'];
        }
        else if (strpos($url, 'discussion_topics')) {
            $body = curlGet($url)['message'];
        }
        else {
            $body = "<p>Invalid URL.</p>";
        }

        return $body;
    }

    public static function getCourseNameCanvas($courseId) {
        $name = curlGet("courses/{$courseId}")['name'];
        return $name;
    }

    public static function updateAltText($imageUrl, $newAltText) {
        DB::query(
            "UPDATE at_image
            SET alt_text=%s
            WHERE image_url=%s",
            $newAltText, $imageUrl
        );
        return array('imageUrl' => $imageUrl, 'newAltText' => $newAltText);
    }

    public static function altTextUpdatedUser($imageUrl, $newUser) {
        DB::query(
            "UPDATE at_image
            SET alttext_updated_user=%s
            WHERE image_url=%s",
            $newUser, $imageUrl
        );
        return array('imageUrl' => $imageUrl, 'newUser' => $newUser);
    }

    public static function insertAltTextUser($imageUrl, $username, $userUrl){
        DB::insert('at_alt_text', [
            'image_url' => $imageUrl['image_url'],
            'alttext_updated_user' => $username,
            'user_url' => $userUrl
        ]);
    }
    
    private static function findCourseImages($images, $courseId) {
        $imagesInUse = [];

        // Find images used in pages
        $pages = curlGet("courses/{$courseId}/pages");
        if (!is_null($pages)) {
            foreach ($pages as $page) {
                $bodyUrl = $page['html_url'];
                $bodyUrl = str_replace('https://usu.instructure.com/', '', $bodyUrl);
                $response = curlGet($bodyUrl);
                $body = $response['body'];
                $newImages = Action::findUsedImages($images, $body, $courseId, $imagesInUse, $bodyUrl, "pages");
                $imagesInUse = $imagesInUse + $newImages;
            }
        }


        // Find images used in assignments (including quizzes)
        $assignments = curlGet("courses/{$courseId}/assignments");
        if (!is_null($assignments)) {
            foreach ($assignments as $assignment) {
                $body = $assignment['description'];
                $url = $assignment["html_url"];
                $url = str_replace('https://usu.instructure.com/', '', $url);
                $newImages = Action::findUsedImages($images, $body, $courseId, $imagesInUse, $url, "assignment");
                $imagesInUse = $imagesInUse + $newImages;
            }
        }

        // Find images used in discussions
        $discussions = curlGet("courses/{$courseId}/discussion_topics");
        if (!is_null($discussions)) {
            foreach ($discussions as $discussion) {
                $body = $discussion['message'];
                $url = $discussion["html_url"];
                $url = str_replace('https://usu.instructure.com/', '', $url);
                // $topic_url = isset($discussion["topic_url"])?$discussion["topic_url"]:0;
                $newImages = Action::findUsedImages($images, $body, $courseId, $imagesInUse, $url, "discussion");
                $imagesInUse = $imagesInUse + $newImages;
            }
        }

        return $imagesInUse;
    }


    private static function findUsedImages($images, $body, $courseId, &$imagesInUse, $value, $type) {
        if ($body == "") {
            return [];
        }

        $newImages = [];
        foreach ($images as $image) {
            $id = $image['lmsId'];
            // Extract each image tag that contains a link to the image
            $search = "/(?<=)(?:[^\<\>]+courses\/{$courseId}\/files\/{$id}[^\<\>]+)(?=\/?>)/";
            $fileNameSearch = '/(?i)alt=[\'\"]([^\.]+\.(?:jpeg|jpg|jpe|jif|jfif|jfi|png|gif|webp|tiff|tif|psd|raw|bmp|dib|heif|heic|ind|indd|indt|svg|svgz|ai|eps)[\'\"])/';
            $matches = [];
            if (preg_match($search, $body, $matches)) {

                $needsAltText = false;
                foreach ($matches as $match) {
                    if (!strpos($match, 'alt=') || strpos($match, 'alt=""') ||
                        preg_match($fileNameSearch, $match) ||
                        strpos($match, 'alt="Uploaded Image"')
                    ) {
                        $needsAltText = true;
                        break;
                    }   
                }

                if ($needsAltText && !Action::imageInArray($image, $newImages) && !Action::imageInArray($image, $imagesInUse)) {
                    if($type == "pages"){
                        $image['canvas_page'] = $value? $value:"";
                    }
                    else if($type == "assignment"){
                        $image['assignment_url'] = $value? $value:"";
                    }
                    else if($type == "discussion"){
                        $image["topic_url"] = $value? $value:"";
                    }
                    array_push($imagesInUse, $image);
                }
                else if(Action::imageInArray($image, $imagesInUse)){
                    if($type == "pages"){
                        foreach ($imagesInUse as &$element) {
                            if ($element['url'] == $image['url'] && array_key_exists('canvas_page', $element)) {
                                if($element['canvas_page'] == ""){
                                    $element['canvas_page'] = $value? $value:"";
                                }
                                else{
                                    $delimiter = "/";
                                    $array = explode($delimiter, $value? $value:"");
                                    $page = end($array);
                                    $element['canvas_page'] = $element['canvas_page'] . ";" . $page;
                                }
                            }
                        }
                    }
                    else if($type == "assignment"){
                        // $image['assignment_url'] = $value? $value:"";
                        foreach ($imagesInUse as &$element) {
                            if ($element['url'] == $image['url'] && array_key_exists('assignment_url', $element)) {
                                if($element['assignment_url'] == ""){
                                    $element['assignment_url'] = $value? $value:"";
                                }
                                else{
                                    $delimiter = "/";
                                    $array = explode($delimiter, $value? $value:"");
                                    $page = end($array);
                                    $element['assignment_url'] = $element['assignment_url'] . ";" . $page;
                                }
                            }
                        }
                    }
                    else if($type == "discussion"){
                        // $image["topic_url"] = $value? $value:"";
                        foreach ($imagesInUse as &$element) {
                            if ($element['url'] == $image['url'] && array_key_exists('topic_url', $element)) {
                                if($element['topic_url'] == ""){
                                    $element['topic_url'] = $value? $value:"";
                                }
                                else{
                                    $delimiter = "/";
                                    $array = explode($delimiter, $value? $value:"");
                                    $page = end($array);
                                    $element['topic_url'] = $element['topic_url'] . ";" . $page;
                                }
                            }
                        }
                    }
                }
            }
        }

        return $imagesInUse;
    }    
  

    private static function updatePage($courseId, $pageUrl, $body) {
        $data = array('wiki_page[body]' => $body);
        curlPut("courses/{$courseId}/pages/{$pageUrl}", $data);
    }

    private static function updateAssignment($courseId, $assignmentId, $body) {
        $data = array('assignment[description]' => $body);
        curlPut("courses/{$courseId}/assignments/{$assignmentId}", $data);
    }

    private static function updateDiscussion($courseId, $discussionId, $body) {
        $data = array('message' => $body);
        curlPut("courses/{$courseId}/discussion_topics/{$discussionId}", $data);
    }

    private static function updateQuizDescription($courseId, $quizId, $body) {
        $data = array('quiz[description]' => $body);
        curlPut("courses/{$courseId}/quizzes/{$quizId}", $data);
    }

    private static function imageInArray($image, $imageArray) {
        foreach ($imageArray as $element) {
            if ($element['url'] == $image['url']) {
                return true;
            }
        }

        return false;
    }

    private static function imageInBody($courseId, $imageId, $body) {
        if ($body == "") {
            return false;
        }
        
        $search = "/(?<=)(?:[^\<\>]+courses\/{$courseId}\/files\/{$imageId}[^\<\>]+)(?=\/?>)/";
        return preg_match($search, $body);
    }

    private static function replaceImages($body, $image, $courseId) {
        $id = $image['lms_id'];

        // Extract each image tag that contains a link to the image and update it as needed
        $search = "/(?<=)(?:[^\<\>]+courses\/{$courseId}\/files\/{$id}[^\<\>]+)(?=\/?>)/";
        $fileNameSearch = '/(?i)alt=[\'\"]([^\'\"]*)[\'\"]/';
        $matches = [];
        $fileNameMatches = [];  
  
        if (preg_match($search, $body, $matches)) {
            foreach ($matches as $match) {
                if (!strpos($match, 'alt=')) {
                    if ($image['is_decorative']) {
                        $body = preg_replace(
                            "/(https:\/\/usu.instructure.com\/courses\/{$courseId}\/files\/{$id}.*?\")/", 
                            "$1 alt=\"\"",
                            $body
                        );
                    }
                    else {
                        $body = preg_replace(
                            "/(https:\/\/usu.instructure.com\/courses\/{$courseId}\/files\/{$id}.*?\")/", 
                            "$1 alt=\"{$image['alt_text']}\"",
                            $body
                        );
                    }
                }
                else if ((preg_match($fileNameSearch, $match, $fileNameMatches))) {
                    if ($image['is_decorative']) {
                        $body = preg_replace(
                            "/(https:\/\/usu.instructure.com\/courses\/{$courseId}\/files\/{$id}.*?)alt=[\'\"].*?[\'\"]/", 
                            "$1 alt=\"\"",
                            $body
                        );
                    }
                    else {
                        $body = preg_replace(
                            "/(https:\/\/usu.instructure.com\/courses\/{$courseId}\/files\/{$id}.*?)alt=[\'\"].*?[\'\"]/", 
                            "$1 alt=\"{$image['alt_text']}\"",
                            $body
                        );
                    }
                }
            }
        }

        Action::setPushedToCanvas($image['id']);
        return $body;
    }
}
?>
