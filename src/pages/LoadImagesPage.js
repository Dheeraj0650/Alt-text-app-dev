import React, { useState, useEffect } from 'react';
import { Button, NumberInput, Overlay, Mask, Spinner, Text, Checkbox, Flex, Table, Alert } from '@instructure/ui';

import CoursesTable from './CoursesTable';
import ReviewModal from './ReviewModal';

import axios from 'axios';

export default function LoadImagesPage(props) {
  if (!document.cookie.match(/^.*[;]?at_admin=true[;]?.*$/)) {
    return (
      <p>You are not authorized to access this page</p>
    )
  }

  const [courseId, setCourseId] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [courseIsPriority, setCourseIsPriority] = useState(false);

  const togglePriority = () => {
    setCourseIsPriority(!courseIsPriority);
  }
  

  // requests to load images from canvas into database
  const loadFromCanvas = () => {
    setLoadMessage('');
    if (courseId != 0 && courseId.toString().length == 6) {
      setIsLoading(true);
      
      axios({
        method:'post',
        url:`${props.basePath}/task.php?task=load_images`,
        data: {
          course_id: courseId, 
          is_priority: courseIsPriority
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

        if (loadJson.error) {
          setLoadMessage(loadJson.message);
        }
        else {
          let newMessage;
          if (loadJson.images_added == 0) {
            newMessage = 'No images were added to the queue. '
          }
          else if (loadJson.images_added == 1) {
            newMessage = '1 image was successfully added to the queue. '
          }
          else {
            newMessage = `${loadJson.images_added} images were successfully added to the queue. `
          }

          if (loadJson.message) {
            newMessage += loadJson.message + '.';
          }
          setLoadMessage(newMessage);
        }
        clearInput();
      })
      .catch((error) => {
          setLoadMessage('An error occurred while loading the images from canvas.')
      })
      .finally(() => {
        setIsLoading(false);
        // loadTable();
      });
    }
    else {
      setLoadMessage('Please enter a valid course id.')
    }
  };

  // gets the course id from text area
  const getCourseIdValue = (event, value) => {
    if (/^[0-9]*$/.test(value) && value.length <= 6) {
      setCourseId((value));
    }
  };

  // resets input
  const clearInput = () => {
    setCourseId("");
    setCourseIsPriority(false);
  };

  return (
    <>
    <div className='space-children'>
      <NumberInput 
        id="course-id"
        renderLabel="Course Id Input"
        placeholder="Enter course ID here"
        width='12em'
        showArrows={false}
        value={courseId}
        onChange={getCourseIdValue}
      />
      <Checkbox 
        id="priority-checkbox" 
        label="Mark Course as a Priority" 
        variant="simple" 
        inline={true}
        checked={courseIsPriority} 
        onChange={togglePriority}
      />
      <br />
      <Button color="success" onClick={loadFromCanvas}>Load Images from Canvas Course</Button>
      {loadMessage !== "" && 
        <Alert variant='info' renderCloseButtonLabel='close' onDismiss={() => setLoadMessage("")}>
          {loadMessage}
        </Alert>
      }
    </div>

    <Overlay 
    open={isLoading} 
    label="Loading Images"  
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
    </>
  )
}