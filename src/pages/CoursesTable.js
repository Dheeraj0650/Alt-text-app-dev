import React, { useState, useEffect } from 'react';
import { Table, Button, Text, ScreenReaderContent } from "@instructure/ui";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const BootstrapTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }}/>
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.black,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    fontSize: 15
  },
}));

export default function CoursesTable({basePath, courses, loadTable, setCourses, handleReview, setIsLoading, setPushMessage, handlePublish, courseFilter}) {
  
  const [sortBy, setSortBy] = useState();
  const [ascending, setAscending] = useState(true);

  const [noOfImages, setNoOfImages] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [publishedImages, setPublishedImages] = useState(0);
  const [imagesToPublish, setImagesToPublish] = useState(0);
  const [advancedImagesToPublish, setAdvancedImagesToPublish] = useState(0);
  const [availableToPublish, setAvailableToPublish] = useState(0);

  const direction = ascending ? 'ascending' : 'descending';
  

  useEffect(() => {    
    loadTable();
    }, []);

  useEffect(() => {
    var val1 = 0;
    var val2 = 0;
    var val3 = 0;
    var val4 = 0;
    var val5 = 0;
    var val6 = 0;

    (courses || []).map(course => {
      if(course.total_images !== course.published_images){
        val1 += parseInt(course.total_images);
        val2 += parseInt(course.completed_images);
        val3 += parseInt(course.published_images);
        val4 += parseInt(course.completed_images) - parseInt(course.published_images);
        val5 += parseInt(course.advanced_images);
        val6 += parseInt(course.available_images);
      }

      setNoOfImages(val1);
      setCompletedImages(val2);
      setPublishedImages(val3);
      setImagesToPublish(val4);
      setAdvancedImagesToPublish(val5);
      setAvailableToPublish(val6);
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
        var num_a = a[id].padStart(8, '0');;
        var num_b = b[id].padStart(8, '0');;
        return num_a.localeCompare(num_b);
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
    <div class="container-fluid content">      
        <div class="table-responsive custom-table-responsive">
          <table class="table custom-table">
            <thead>
              <tr>  
                <th scope="col">
                  Course Name
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Total Images in Use without Alt Text">
                      <span> 
                          <i class="fa-solid fa-circle-info"></i> &nbsp; Total ({noOfImages})
                      </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Alt text added and published">
                      <span> 
                          <i class="fa-solid fa-circle-info"></i> &nbsp; Published ({publishedImages})  
                      </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Alt text has been added, but not published">
                      <span> 
                          <i class="fa-solid fa-circle-info"></i>  &nbsp; Ready to Publish ({imagesToPublish}) 
                      </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Imaged have been marked as advanced, but do not have alt text">
                      <span> 
                          <i class="fa-solid fa-circle-info"></i> Advanced ({advancedImagesToPublish}) &nbsp;
                      </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Images that are currently in progress and not availalbe">
                    <span> 
                        <i class="fa-solid fa-circle-info"></i>  &nbsp; In Progress ({availableToPublish}) 
                    </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Shows images with alt text that have not bee published.">
                    <span> 
                        <i class="fa-solid fa-circle-info"></i> &nbsp; Review
                    </span>
                  </BootstrapTooltip>
                </th>
                <th scope="col">
                  <BootstrapTooltip title="Publish all images with alt text from the course.">
                    <span> 
                        <i class="fa-solid fa-circle-info"></i> &nbsp;  Publish All 
                    </span>
                  </BootstrapTooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {(courses || []).map(course => {
                if(course.total_images !== course.published_images){
                  if((courseFilter === "") || (courseFilter !== "" && course.name && course.name.toLowerCase().replaceAll(" ", "").includes(courseFilter.toLowerCase().replaceAll(" ", "")))){
                    return (
                      <>
                        <tr scope="row">
                          <td>
                            <a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a>
                          </td>
                          <td>
                            {parseInt(course.total_images)}
                          </td>
                          <td>
                            {parseInt(course.published_images)}
                          </td>
                          <td>{parseInt(course.completed_images) - parseInt(course.published_images)}</td>
                          <td>{parseInt(course.advanced_images)}</td>
                          <td>{parseInt(course.available_images)}</td>
                          <td><button type="button" class="btn btn-primary" onClick={() => handleReview(course.id, course.name)}>Review</button></td>
                          <td><button type="button" class="btn btn-primary" onClick={() => handlePublish(course.id)}>Publish</button></td>
                        </tr>
                        <tr class="spacer"><td colspan="100"></td></tr>
                      </>

                      // <Table.Row key={parseInt(course.id)}>
                      //   <Table.RowHeader id={parseInt(course.id)}><a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a></Table.RowHeader>
                      //   <Table.Cell>{parseInt(course.total_images)}</Table.Cell>
                      //   <Table.Cell>{parseInt(course.published_images)}</Table.Cell>
                      //   <Table.Cell>{parseInt(course.completed_images) - parseInt(course.published_images)}</Table.Cell>
                      //   <Table.Cell>{parseInt(course.advanced_images)}</Table.Cell>
                      //   <Table.Cell>{parseInt(course.available_images)}</Table.Cell>
                      //   <Table.Cell><Button color='secondary' onClick={() => handleReview(course.id, course.name)}>Review</Button></Table.Cell>
                      //   <Table.Cell><Button color='secondary' onClick={() => handlePublish(course.id)}>Publish</Button></Table.Cell>
                      // </Table.Row>
                    )
                  }
                }
              })}
            </tbody>
          </table>
        </div>
    </div>
    // <>
    //     <Table caption='Courses'>
    //   <Table.Head renderSortLabel={<ScreenReaderContent>Sort by</ScreenReaderContent>}>
    //     <Table.Row>
    //       <Table.ColHeader 
    //         id='name' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'name' ? direction : 'none'}
    //       >
    //         <span>
    //           Course Name 
    //         </span>
    //       </Table.ColHeader>

    //       <Table.ColHeader 
    //         id='total_images' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'total_images' ? direction : 'none'}
    //       >
    //         <BootstrapTooltip title="Total Images in Use without Alt Text">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i> &nbsp; Total ({noOfImages})
    //           </span>
    //         </BootstrapTooltip>
    //       </Table.ColHeader>

    //       <Table.ColHeader 
    //         id='published_images' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'published_images' ? direction : 'none'}
    //       >
    //         <BootstrapTooltip title="Alt text added and published">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i> &nbsp; Published ({publishedImages})  
    //           </span>
    //         </BootstrapTooltip>
    //       </Table.ColHeader>

    //       <Table.ColHeader 
    //         id='images_to_publish' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'images_to_publish' ? direction : 'none'}
    //       >
    //       <BootstrapTooltip title="Alt text has been added, but not published">
    //         <span> 
    //             <i class="fa-solid fa-circle-info"></i>  &nbsp; Ready to Publish ({imagesToPublish}) 
    //         </span>
    //       </BootstrapTooltip>

    //       </Table.ColHeader>
    
    //       <Table.ColHeader 
    //         id='advanced_images' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'advanced_images' ? direction : 'none'}
    //       >
    //         <BootstrapTooltip title="Imaged have been marked as advanced, but do not have alt text">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i> Advanced ({advancedImagesToPublish}) &nbsp;
    //           </span>
    //         </BootstrapTooltip>

    //       </Table.ColHeader>

    //       <Table.ColHeader 
    //         id='available_images' 
    //         onRequestSort={onSort}
    //         sortDirection={sortBy === 'available_images' ? direction : 'none'}
    //       >
    //         <BootstrapTooltip title="Images that are currently in progress and not availalbe">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i>  &nbsp; In Progress ({availableToPublish}) 
    //           </span>
    //         </BootstrapTooltip>
    //       </Table.ColHeader>

    //       <Table.ColHeader id='review'>
    //         <BootstrapTooltip title="Shows images with alt text that have not bee published.">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i> &nbsp; Review
    //           </span>
    //         </BootstrapTooltip>
    //       </Table.ColHeader>

    //       <Table.ColHeader id='publish_course'>
    //         <BootstrapTooltip title="Publish all images with alt text from the course.">
    //           <span> 
    //               <i class="fa-solid fa-circle-info"></i> &nbsp;  Publish All 
    //           </span>
    //         </BootstrapTooltip>
    //       </Table.ColHeader>
    //     </Table.Row>
    //   </Table.Head>
    //   <Table.Body>
    //     {(courses || []).map(course => {
    //       if(course.total_images !== course.published_images){
    //         if((courseFilter === "") || (courseFilter !== "" && course.name && course.name.toLowerCase().replaceAll(" ", "").includes(courseFilter.toLowerCase().replaceAll(" ", "")))){
    //           return (
    //             <Table.Row key={parseInt(course.id)}>
    //               <Table.RowHeader id={parseInt(course.id)}><a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a></Table.RowHeader>
    //               <Table.Cell>{parseInt(course.total_images)}</Table.Cell>
    //               <Table.Cell>{parseInt(course.published_images)}</Table.Cell>
    //               <Table.Cell>{parseInt(course.completed_images) - parseInt(course.published_images)}</Table.Cell>
    //               <Table.Cell>{parseInt(course.advanced_images)}</Table.Cell>
    //               <Table.Cell>{parseInt(course.available_images)}</Table.Cell>
    //               <Table.Cell><Button color='secondary' onClick={() => handleReview(course.id, course.name)}>Review</Button></Table.Cell>
    //               <Table.Cell><Button color='secondary' onClick={() => handlePublish(course.id)}>Publish</Button></Table.Cell>
    //             </Table.Row>
    //           )
    //         }
    //       }
    //     })}
    //   </Table.Body>
    // </Table></>
  );
}
