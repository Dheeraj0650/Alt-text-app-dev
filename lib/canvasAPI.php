<?php
// This page contains a variety of functions that can be used to access the Canvas API
$token = getenv('CANVAS_ACCESS_TOKEN');
// $token = "1009~DG8gfHpHu80jXy33tP4J523YdBRps5TzMPfe49uMaZXDAkAjTBcmXzrcet7v9Ir4";
// CANVAS_ACCESS_TOKEN=1009~KEWzW91PbZ7CXYCReDyG3uUQAdnqj2QaafyaDpvqtVF7UeubMZ6krPPD1WL3KH1v
// Display any php errors (for development purposes)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// This is the header containing the authorization token from Canvas
$tokenHeader = array("Authorization: Bearer ".$token);
$domain = 'usu.instructure.com';

// The following functions run the GET and POST calls
if (!function_exists('http_parse_headers')) {
    function http_parse_headers($raw_headers) {
        $headers = array();
        $key = '';

        foreach(explode("\n", $raw_headers) as $i => $h) {
            $h = explode(':', $h, 2);

            if (isset($h[1])) {
                if (!isset($headers[$h[0]]))
                    $headers[$h[0]] = trim($h[1]);
                else if (is_array($headers[$h[0]])) {
                    $headers[$h[0]] = array_merge($headers[$h[0]], array(trim($h[1])));
                }
                else {
                    $headers[$h[0]] = array_merge(array($headers[$h[0]]), array(trim($h[1])));
                }

                $key = $h[0];
            }
            else {
                if (substr($h[0], 0, 1) == "\t")
                    $headers[$key] .= "\r\n\t".trim($h[0]);
                else if (!$key)
                    $headers[0] = trim($h[0]);
                }
        }

        return $headers;
    }
}

// Returns an array that contains other associative arrays containing the json information
// Endpoints that give a single result will results in an array of length 1 being returned
function curlGet($url) {
    global $token;
    $ch = curl_init($url);
    if (strpos($url, $GLOBALS['domain']) !== false) {
        curl_setopt ($ch, CURLOPT_URL, $url);
    } else {
        curl_setopt ($ch, CURLOPT_URL, 'https://'.$GLOBALS['domain'].'/api/v1/'.$url);
    }
    curl_setopt ($ch, CURLOPT_HTTPHEADER, $GLOBALS['tokenHeader']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // ask for results to be returned
    curl_setopt($ch, CURLOPT_VERBOSE, 1); //Requires to load headers
    curl_setopt($ch, CURLOPT_HEADER, 1);  //Requires to load headers
    $result = curl_exec($ch);
    # Parse header information from body response
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($result, 0, $header_size);
    $body = substr($result, $header_size);
    curl_close($ch);

    if ($body == '[]') {
        return null;
    }

    $data = json_decode($body, true);
    # Parse Link Information
    $header_info = http_parse_headers($header);
    if (isset($header_info['Link'])){
        $links = explode(',', $header_info['Link']);
        foreach ($links as $value) {
            if (preg_match('/^\s*<(.*?)>;\s*rel="(.*?)"/', $value, $match)) {
                $links[$match[2]] = $match[1];
            }
        }
    }
    else if (isset($header_info['link'])){
        $links = explode(',', $header_info['link']);
        foreach ($links as $value) {
            if (preg_match('/^\s*<(.*?)>;\s*rel="(.*?)"/', $value, $match)) {
                $links[$match[2]] = $match[1];
            }
        }
    }

    # Check for Pagination
    if (isset($links['next'])) {
        // Remove the API url so it is not added again in the get call
        $next_link = str_replace('https://'.$GLOBALS['domain'].'/api/v1/', '', $links['next']);
        $next_data = curlGet($next_link);
        $data = array_merge($data,$next_data);
        return $data;
    } 
    else {
        return $data;
    }
}

function curlPost($url, $data) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $_SESSION['canvasURL'].'/api/v1/'.$url);
    curl_setopt ($ch, CURLOPT_HTTPHEADER, $GLOBALS['tokenHeader']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // ask for results to be returned

    // Send to remote and return data to caller.
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

function curlPut($url, $data) {
    $ch = curl_init();
    // curl_setopt($ch, CURLOPT_URL, $_SESSION['canvasURL'].'/api/v1/'.$url);
    curl_setopt($ch, CURLOPT_URL, 'https://usu.instructure.com'.'/api/v1/'.$url);
    curl_setopt ($ch, CURLOPT_HTTPHEADER, $GLOBALS['tokenHeader']);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // ask for results to be returned

    // Send to remote and return data to caller.
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}


function getCourse($courseID) {
    $apiUrl = "courses/".$courseID."?include[]=terms&include[]=teachers";
    $response = curlGet($apiUrl);
    return $response;
}

function getuser($userID) {
    $apiUrl = "users/".$userID."/profile";
    $response = curlGet($apiUrl);
    return $response;
}

?>
