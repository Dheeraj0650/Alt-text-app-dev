import React, { useState } from 'react';

import CoursesTable from './CoursesTable';
import ReviewModal from './ReviewModal';

import { Overlay, Flex, Spinner, Mask, Text, Button, Alert } from '@instructure/ui';

import axios from 'axios';

export default function ReviewPublishPage(props) {
  if (!document.cookie.match(/^.*[;]?at_admin=true[;]?.*$/)) {
    return (
      <p>You are not authorized to access this page</p>
    )
  }

  const [courses, setCourses] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [courseUnderReview, setCourseUnderReview] = useState({});
  const [completedImages, setCompletedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  function updateMondayBoard(courseId, pushed_images){
    for(var idx = 0; idx < courses.length;idx++){
      if(courses[idx].id === courseId){
        if(courses[idx].total_images === (Number(courses[idx].published_images) + pushed_images).toString()){
          var data = {
            "course_id": courseId,
            "action": "updateMondayBoard"
          };
      
          axios({
            method:'post',
            url:`https://apswgda2p5.execute-api.us-east-1.amazonaws.com/default/getData`,
            data: data,
          })
          .then(response => {
            // handle success
          })
          .catch(error => {
            // handle error
            console.log(error.message);
          });
        }
      }
    }
  }

  function loadTable(courseId = null, pushed_images) {
    axios.get(
      `${props.basePath}/task.php?task=get_courses_info`
    )
    .then((response) => {

      var loadJson = {};

      if(typeof response.data === "string"){
        const jsonRegex = /\[.*\]/;
        const jsonMatch = response.data.match(jsonRegex);
  
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          loadJson = JSON.parse(jsonString);
        }
      }
      else {
        loadJson = response.data;
      }

      setCourses(loadJson);

      if(courseId){
        updateMondayBoard(courseId, pushed_images);
      }
    })
  }

  function handleReview(courseId, courseName) {

    axios.get(
      `${props.basePath}/task.php?task=get_completed_images&course_id=${courseId}`
    )
    .then((response) => {

      var loadJson = {};

      if(typeof response.data === "string"){
        const jsonRegex = /\[.*\]/;
        const jsonMatch = response.data.match(jsonRegex);
  
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          loadJson = JSON.parse(jsonString);
        }
      }
      else {
        loadJson = response.data;
      }

      if (!loadJson.message) {
        setCompletedImages(loadJson); 
      } else {
        setCompletedImages([]);
      }
      // open review modal
      setReviewOpen(true);
      // set current review course
      setCourseUnderReview({
        courseId,
        courseName
      });     
    })
  }

  function handlePublishAll() {
    setIsLoading(true);
    axios.post(
      `${props.basePath}/task.php?task=push_images`
    )
    .then((response) => {

      var loadJson = {};

      if(typeof response.data === "string"){
        const jsonRegex = /{[^}]+}/;
        const jsonMatch = response.data.match(jsonRegex);
  
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          loadJson = JSON.parse(jsonString);
        }
      }
      else {
        loadJson = response.data;
      }

      if ("failed_image_ids" in loadJson) {
        setPushMessage(`The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas. The alt text for the following image ids failed to push to canvas: ${loadJson.failed_image_ids}`);
      }
      else if (loadJson.pushed_images == 0) {
        setPushMessage('Everything is already up to date.');
      }
      else {
        setPushMessage(`Success! The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas.`)
      }

      loadTable();
    })
    .catch(error => {
      setPushMessage('An error occurred while pushing the alt text to canvas')
    })
    .finally(() => setIsLoading(false));
  }


  return (
    <>
      {!reviewOpen && <div className='space-children'>
        <Button color='success' onClick={() => handlePublishAll()} >Publish All Courses</Button>
        <CoursesTable 
          basePath={props.basePath} 
          courses={courses} 
          loadTable={loadTable}
          handleReview={handleReview} 
          setCourses={setCourses}
          setIsLoading={setIsLoading}
          setPushMessage={setPushMessage}
        />
        <br />
        {pushMessage != '' ? <Alert
          onDismiss={() => setPushMessage('')}
          variant="info"
          renderCloseButtonLabel="Close"
          margin="small"
        >
          {pushMessage}
        </Alert> : <></>}
      <Overlay 
        open={isLoading} 
        label="Pushing Images"  
        shouldContainFocus 
      >
        <Mask fullscreen> 
          <Flex direction='column' justifyItems='center' alignItems='center'>
            <Flex.Item>
                <Text as='p'>This may take some time depending on the size of the course</Text>
            </Flex.Item>
            <Flex.Item>
                <Spinner renderTitle="Loading" size="large" margin="auto" />
            </Flex.Item>
          </Flex>
        </Mask>
      </Overlay>
    </div>}

    {reviewOpen && <ReviewModal 
      basePath={props.basePath}
      open={reviewOpen}
      onDismiss={() => setReviewOpen(false)}
      courseUnderReview={courseUnderReview}
      completedImages={completedImages}
      setCompletedImages={setCompletedImages}
    />}
  </>
  )
}