import React, { useState, useEffect } from 'react';
import { Table, Button, Text, ScreenReaderContent } from "@instructure/ui";

import axios from 'axios';

export default function CoursesTable({basePath, courses, loadTable, setCourses, handleReview, setIsLoading, setPushMessage, handlePublish, courseFilter}) {
  
  const [sortBy, setSortBy] = useState();
  const [ascending, setAscending] = useState(true);

  const [noOfImages, setNoOfImages] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [publishedImages, setPublishedImages] = useState(0);
  const [imagesToPublish, setImagesToPublish] = useState(0);

  const direction = ascending ? 'ascending' : 'descending';

  useEffect(() => {    
    loadTable();
    }, []);

  useEffect(() => {
    var val1 = 0;
    var val2 = 0;
    var val3 = 0;
    var val4 = 0;

    (courses || []).map(course => {
      if(course.total_images !== course.published_images){
        val1 += parseInt(course.total_images);
        val2 += parseInt(course.completed_images);
        val3 += parseInt(course.published_images);
        val4 += parseInt(course.completed_images) - parseInt(course.published_images);
      }

      setNoOfImages(val1);
      setCompletedImages(val2);
      setPublishedImages(val3);
      setImagesToPublish(val4);
    });
  }, [courses])

  function onSort(event, column) {
    let id = column.id;
    let localAscending;

    if (id === sortBy) {
      setAscending(!ascending);
      localAscending = !ascending;
    }
    else {
      setAscending(true);
      localAscending = true;
    }

    setSortBy(id);

    if (shouldReverse(id)) {
      let tempCourses = [...courses];
      tempCourses.sort((a, b) => {
        return a[id].localeCompare(b[id]);
      });

      if (!localAscending) {
        tempCourses.reverse();
      }
      setCourses(tempCourses);
    }
  }

  function shouldReverse(id) {
    if (courses.length === 0 || id === undefined) {
      return false;
    }

    let val = courses[0][id];
    for (let i = 1; i < courses.length; i++) {
      if (courses[i][id] !== val) return true;
    }

    return false;
  }

  // function handlePublish(courseId) {
  //   setIsLoading(true);

  //   axios({
  //     method:'post',
  //     url:`${basePath}/task.php?task=push_image`,
  //     data: {
  //       course_id: courseId
  //     }
  //   })
  //   .then((response) => {

  //     var loadJson = {};

  //     if(typeof response.data === "string"){
  //       const jsonRegex = /{[^}]+}/;
  //       const jsonMatch = response.data.match(jsonRegex);
  
  //       if (jsonMatch) {
  //         const jsonString = jsonMatch[0];
  //         loadJson = JSON.parse(jsonString);
  //       }
  //     }
  //     else {
  //       loadJson = response.data;
  //     }

  //     if ("failed_image_ids" in loadJson) {
  //       setPushMessage(`The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas. The alt text for the following image ids failed to push to canvas: ${loadJson.failed_image_ids}`);
  //     }
  //     else if (loadJson.pushed_images == 0) {
  //       setPushMessage('Everything is already up to date.');
  //     }
  //     else {
  //       setPushMessage(`Success! The alt text for ${loadJson.pushed_images} image${loadJson.pushed_images == 1 ? ' was' : 's were'} successfully updated within Canvas.`)
  //     }

  //     loadTable(courseId, loadJson.pushed_images);

  //   })
  //   .catch((error) => {
  //     setPushMessage('An error occurred while pushing the alt text to canvas');
  //   })
  //   .finally(() => {
  //     setIsLoading(false);
  //   });

  // }

  

  return ( 
    <>
    <Table caption='Courses'>
      <Table.Head renderSortLabel={<ScreenReaderContent>Sort by</ScreenReaderContent>}>
        <Table.Row>
          <Table.ColHeader 
            id='name' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'name' ? direction : 'none'}
          >
            Course Name
          </Table.ColHeader>

          <Table.ColHeader 
            id='total_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'total_images' ? direction : 'none'}
          >
            Total ({noOfImages})
          </Table.ColHeader>

          <Table.ColHeader 
            id='published_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'published_images' ? direction : 'none'}
          >
            Published ({publishedImages})
          </Table.ColHeader>

          <Table.ColHeader 
            id='images_to_publish' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'images_to_publish' ? direction : 'none'}
          >
            Ready to Publish ({imagesToPublish})
          </Table.ColHeader>

          <Table.ColHeader 
            id='completed_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'completed_images' ? direction : 'none'}
          >
            Advanced ({0})
          </Table.ColHeader>

          <Table.ColHeader 
            id='completed_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'completed_images' ? direction : 'none'}
          >
            In Progress ({0})
          </Table.ColHeader>

          <Table.ColHeader id='review'>Review</Table.ColHeader>

          <Table.ColHeader id='publish_course'>Publish Course</Table.ColHeader>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {(courses || []).map(course => {
          if(course.total_images !== course.published_images){
            if((courseFilter === "") || (courseFilter !== "" && course.name && course.name.toLowerCase().replaceAll(" ", "").includes(courseFilter.toLowerCase().replaceAll(" ", "")))){
              return (
                <Table.Row key={course.id}>
                  <Table.RowHeader id={course.id}><a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a></Table.RowHeader>
                  <Table.Cell>{course.total_images}</Table.Cell>
                  <Table.Cell>{course.published_images}</Table.Cell>
                  <Table.Cell>{course.completed_images - course.published_images}</Table.Cell>
                  <Table.Cell>{1}</Table.Cell>
                  <Table.Cell>{2}</Table.Cell>
                  <Table.Cell><Button color='secondary' onClick={() => handleReview(course.id, course.name)}>Review</Button></Table.Cell>
                  <Table.Cell><Button color='secondary' onClick={() => handlePublish(course.id)}>Publish</Button></Table.Cell>
                </Table.Row>
              )
            }
          }
        })}
      </Table.Body>
    </Table>
    </>
  );
}
