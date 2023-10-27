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
  const [courseFilter, setCourseFilter] = useState("");

  function handleFilterChange(e){
    setCourseFilter(e.target.value.trim());
  }

  function updateMondayBoard(courseId, pushed_images, needs_conversion){
    for(var idx = 0; idx < courses.length;idx++){
      console.log(courses[idx].id)
      console.log(courseId)
      console.log(courses[idx])
      console.log(courses[idx].total_images)
      console.log((Number(courses[idx].published_images) + pushed_images).toString());

      if(courses[idx].id === courseId){
        if(courses[idx].total_images === (Number(courses[idx].published_images) + pushed_images).toString()){
          console.log("innininininin");
          var data = {
            "course_id": courseId,
            "action": "updateMondayBoard",
            "needs_conversion": needs_conversion === "1" ? true:false
          };
      
          axios({
            method:'post',
            url:`https://apswgda2p5.execute-api.us-east-1.amazonaws.com/default/getData`,
            data: data,
          })
          .then(response => {
            // handle success
            if( needs_conversion === "1"){
              axios({
                method:'post',
                url:`${props.basePath}/task.php?task=release_needs_conversion`,
                data: {
                  course_id: courseId
                }
              })
              .then((response) => {
                console.log(response);
              })
              .catch((error) => {

              })
            }
          })
          .catch(error => {
            // handle error
            console.log(error.message);
          });
        }
      }
    }
  }

  function loadTable(courseId = null, pushed_images, needs_conversion) {
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
        updateMondayBoard(courseId, pushed_images, needs_conversion);
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

  function handlePublish(courseId) {
    setIsLoading(true);

    axios({
      method:'post',
      url:`${props.basePath}/task.php?task=push_image`,
      data: {
        course_id: courseId
      }
    })
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

      console.log(loadJson)
      if ("failed_image_ids" in loadJson) {
        setPushMessage(`The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas. The alt text for the following image ids failed to push to canvas: ${loadJson.failed_image_ids}`);
      }
      else if (loadJson.pushed_images == 0) {
        setPushMessage('Everything is already up to date.');
      }
      else {
        setPushMessage(`Success! The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas.`)
      }

      loadTable(courseId, loadJson.pushed_images, loadJson.needs_conversion);

    })
    .catch((error) => {
      setPushMessage('An error occurred while pushing the alt text to canvas');
    })
    .finally(() => {
      setIsLoading(false);
    });

  }


  return (
    <>
      {!reviewOpen && <div className='space-children'>
        <div class="container-fluid">
          <div class="row">
            <div class="col">
              <div class="input-group mb-3" style={{float:"left"}}>
                <span class="input-group-text" id="inputGroup-sizing-default">Filter</span>
                <input type="text" class="form-control" aria-label="Sizing example input" aria-describedby="inputGroup-sizing-default" placeholder='Search for Course Name' onChange={handleFilterChange}></input>
              </div>
            </div>
            <div class="col">
              <button class='btn btn-success' style={{float:"right"}} onClick={() => handlePublishAll()} >Publish All Courses</button>
            </div>
          </div>
        </div>

        <CoursesTable 
          basePath={props.basePath} 
          courses={courses} 
          loadTable={loadTable}
          handleReview={handleReview} 
          setCourses={setCourses}
          setIsLoading={setIsLoading}
          setPushMessage={setPushMessage}
          handlePublish={handlePublish}
          courseFilter={courseFilter}
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
      onDismiss={function(){setReviewOpen(false);setCourseFilter("")}}
      courseUnderReview={courseUnderReview}
      completedImages={completedImages}
      setCompletedImages={setCompletedImages}
      handlePublish={handlePublish}
      handleReview={handleReview}
    />}
  </>
  )
}