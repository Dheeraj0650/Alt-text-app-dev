# Alt Text App

## Starting the Dev Server
To start the dev server, first set the DEV environment variable to "true" in the .env file. Then navigate to the root directory and run the following command: `php -S localhost:8000`

## API Documentation
### Get An Image
    GET task.php?task=get_image

This endpoint finds the next image in the queue, assigns the current user as the editor, and returns the image information. If the user is already assigned to an image that is not completed, the information for that image is returned. The current user is identified by their php session.

#### Response

The response body will contain the following json if the operation is successful:

    {
        image_id: {integer},
        url: {string}
    }

#### Errors
If there are no images in the queue, the response body will contain the following json:

    {
        error: true, 
        no_images: true,
        message: "no images in queue"
    }

If the user does not exist, the response body will contain the following json:

    {
        error: true,
        no_images: false,
        message: "user not found"
    }


### Set Image As Completed
    POST task.php?task=set_image_completed

This endpoint finds the images with the given id in the database and updates the images `alt_text`, `is_decorative`, and `completed_at` columns.

The request body must contain json data in the following form:

    {
        image_id: {integer},
        alt_text: {string},
        is_decorative: {boolean},
    }

If `is_decorative` is set to true, the `alt_text` parameter should be either null or an empty string.

#### Response

The response body will contain the following json if the operation is successful:

    {
        image_id: {integer},
        alt_text: {string},
        is_decorative: {boolean},
        date_completed: {datetime}
    }

#### Errors
If the image does not exist, the response body will contain the following json:

    {
        error: true,
        message: "image not found"
    }

If the image is already completed, the response body will contain the following json:

    {
        error: true,
        message: "image is already completed"
    }

If the image id is not an integer greater than 0, the response body will contain the following json:

    {
        error: true,
        message: "invalid image id"
    }

If the request body is invalid, the response body will contain the following json:

    {
        error: true,
        message: "invalid request body"
    }


### Load Images
    POST task.php?task=load_images

This endpoint searches the canvas course with the given id for images that are in use and that don't have alt text. These images are then loaded into the database and queued for users to add alt text to them.

The request body must contain json data in the following form:

    {
        course_id: {integer}
    }

#### Response

The response body will contain the following json if the operation is successful:

    {
        images_added: {integer}
    }

#### Errors
If images are found that already exist in the database, the response body will contain the following json:

    {
        message: "{integer} image(s) were found that are already in the database"
    }

If canvas returns an error while checking the course files or pages, the response body will contain the following json:

    {
        error: true,
        message: "Canvas error: {canvas error message}"
    }

If the course id is not an integer greater than 0, the response body will contain the following json:

    {
        error: true,
        message: "invalid course id"
    }

If the request body is invalid, the response body will contain the following json:

    {
        error: true,
        message: "invalid request body"
    }


### Push Images
    POST task.php?task=push_images

This endpoint pushes the alt text for all the completed images to canvas. It also markes that the images have been pushed to canvas so that they aren't pushed multiple times.

#### Response

The response body will contain the following json if the operation is successful:

    {
        'pushed_images': {integer},
    }

#### Errors
If there are no completed image in the database that have not already been pushed to canvas, the response body will contain the following json:

    {
        pushed_images: 0,
        message: "There are no images that are ready to be pushed back to canvas"
    }

If an error is received from canvas while pushing the alt text to canvas, the response body will contain the following json:

    {
        pushed_images: {integer},
        failed_image_ids: {comma delimited list of failed course ids},
        message: "images failing to push is usually caused by the course no longer existing in canvas"
    }
