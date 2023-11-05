import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {Mask, Spinner, Checkbox, Grid, Img, Alert, Flex, TextArea, ScreenReaderContent, Button, Overlay } from '@instructure/ui';
import DOMPurify from 'dompurify';
import AlertModel from './Alert';
import Avatar from './Avatar';
import ContextPage from './ContextPage';
import axios from 'axios';
import Chip from '@mui/material/Chip';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const BootstrapTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: 15
    },
  }));
  
export default function ReviewModal({ basePath, open, onDismiss, courseUnderReview, completedImages, setCompletedImages, handlePublish, handleReview}) {
    const [tempImages, setTempImages] = useState([]);
    const [alertOpen, setAlertOpen] = useState("");
    const [alertId, setAlertId] = useState("");
    const [changeUI, setChangeUI] = useState(false);
    const [nameArray, setNameArray] = useState([]);
    const [viewContext, setViewContext] = useState(false);
    const [imageId, setImageId] = useState(false);
    const [imageUrlArray, setImageUrlArray] = useState([]);
    const [openNewModal, setNewOpenModal] = useState(false);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const Backdrop = (props) => {
        return <div className="backdrop"/>;
    };
    

    // function getImageName(currentImageId){
    //     console.log(currentImageId);
    //     axios({ 
    //         method:'post',
    //         url:`${props.basePath}/task.php?task=get_image_name`,
    //         data: {
    //         image_id: currentImageId
    //         }
    //     })
    //     .then((response) => {

    //         var loadJson = {};

    //         if(typeof response.data === "string"){
    //         const jsonRegex = /{[^}]+}/;
    //         const jsonMatch = response.data.match(jsonRegex);
        
    //         if (jsonMatch) {
    //             const jsonString = jsonMatch[0];
    //             loadJson = JSON.parse(jsonString);
    //         }
    //         }
    //         else {
    //         loadJson = response.data;
    //         }

    //         setImageName(loadJson.display_name);

    //     })
    //     .catch((error) => {
    //         console.log(error);
    //     })
    // }

    const ModalOverlay = (props) => {
        return (
            <div className='modal-card'>
                <header className="header">
                    <h2>Feedback</h2>
                </header>
                <div className="content">
                    <Avatar name = {props.name} imageUrl = {props.imageUrl} onModalClick={false}/>
                    <div class="input-group mb-3">
                        <button class="btn btn-outline-primary" type="button" id="button-addon1" onClick={function(){handleFeedback(props.name, props.pageImageUrl, document.getElementById('comment-textarea').value)}}>Send Feedback</button>
                        <textarea id="comment-textarea" class="form-control" aria-label="With textarea" placeholder="Enter the comment"></textarea>
                    </div>
                </div>
                <footer className="actions">
                    <Button onClick={() => {setNewOpenModal(false)}}>Close</Button>
                </footer>
            </div>
        );
    };

    function handleFeedback(name, image_url, comment){
        axios({
            method:'post',
            url:`${basePath}/task.php?task=update_feedback`,
            data: {
                name: name,
                image_url: image_url,
                comment: comment
            }
        }).then((response) => {

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

        })
        .catch((error) => {
            console.log(error);
        })
    }

    function viewContextChange(view) {
        setViewContext(view);
    }

    function handleInternalPublish(){
        handlePublish(courseUnderReview.courseId);
        onDismiss();
    }

    function getUserDetails(image_url){
        axios({
            method:'get',
            url:`${basePath}/task.php?task=get_user_details`,
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

            updateAltTextUpdatedUserDetails(image_url, loadJson.username, loadJson.userimage)
          })
          .catch((error) => {
            console.log(error);
          })
    }

    function getAltTextUpdatedUserDetails(){
        axios({
            method:'post',
            url:`${basePath}/task.php?task=get_alt_text_updated_user_name`,
            data: {
                image_url: 'all',
            }
          })
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

            setImageUrlArray(loadJson);
          })
          .catch((error) => {
             console.log(error);
          })
    }

    useEffect(() => {
        getAltTextUpdatedUserDetails();
    }, [])

    function updateAltTextUpdatedUserDetails(imageUrl, username, userimage){
        axios({
            method:'post',
            url:`${basePath}/task.php?task=update_user_alt_text`,
            data: {
                image_url: imageUrl,
                new_user: username,
                user_url: userimage
            }
          })
          .then((response) => {
            getAltTextUpdatedUserDetails();
          })
          .catch((error) => {
             console.log(error);
          })
    }

    function markImageAsUnusable(currentImageId) {
        setIsLoadingReview(true);
        axios({
          method:'post',
          url:`${basePath}/task.php?task=mark_image_as_unusable`,
          data: {
            image_id: currentImageId
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

          console.log(loadJson);
          if (loadJson.error) {
            setAlertId(currentImageId);
            setAlertOpen("Failed to set to Needs Conversion");
          }

          setIsLoadingReview(false)
          handleReview(loadJson.course_id, courseUnderReview.courseName)
          getAltTextUpdatedUserDetails();
          onDismiss();

        })
    
    }

    // function resetView() {
    //     setSkipModalOpen(false);
    //     setAdvancedModalOpen(false);
    //     setUnusableModalOpen(false);
    //     setIsLoading(false);
    //   }

    const handleAltTextChange = (event, imageUrl) => {
        setTempImages(tempImages.map((image) => {
            if (image.image_url != imageUrl) return image

            return {
                image_url: image.image_url,
                alt_text: event.target.value,
                image_id: image.image_id,
                image_name: image.image_name
            }
        }));
    }

    const handleUpdateAltText = (event, imageUrl, newAltText, isDecorative) => {

        // XSS protection
        let cleanAltText = DOMPurify.sanitize(newAltText, {
            USE_PROFILES: { html: true }
        });

        // trim whitespace from alt text and ensure ending with "."
        cleanAltText = cleanAltText.trim();
        if (!cleanAltText.endsWith('.') && !cleanAltText.endsWith('?') & !cleanAltText.endsWith('!')) {
            cleanAltText += ".";
        }

        axios({
            method:'post',
            url:`${basePath}/task.php?task=update_image_alt_text`,
            data: {
                image_url: imageUrl,
                is_decorative: isDecorative ? "1" : "0",
                new_alt_text: isDecorative ? "":cleanAltText
            }
        })
        .then((response) => {
        })
        .catch((error) => {
            console.log(error);
        })
    }

    function modalHandler(img_url, name){
        setNewOpenModal(true);
    }

    function renderCompletedImages(imageId = null) {

        if(tempImages.length === 0){
            setTempImages(completedImages);
        }

        const gridWidth = 3;
        let rows = [];
        // add 3 images and then 3 alt texts to rowElement
        for (let i = 0; i < tempImages.length; i += gridWidth) {
            const row = tempImages.slice(i, i + gridWidth);
            let rowElement = (row || []).map((image) => {
                if(imageId && image.image_id !== imageId){
                    return null;
                }
                return (
                    <Grid.Col width={4} key={image.image_url}>
                        <Flex direction='column'>
                            <BootstrapTooltip title="Click on name to copy it to clipboard">
                                <Chip label={<span style={{"color":"black"}}> <b>Image Name :</b> <span onClick={() => {navigator.clipboard.writeText(image.image_name)}}>{image.image_name}</span> </span>} color="primary" variant="outlined" />
                            </BootstrapTooltip>
                            <div class="card border-warning">
                                <div class="card-body">
                                    <Img src={image.image_url} alt="Image got removed from the course"/>
                                    <TextArea
                                        label={<ScreenReaderContent>Alt Text</ScreenReaderContent>}
                                        value={image.alt_text}
                                        onChange={(event) => handleAltTextChange(event, image.image_url)}
                                        placeholder="The image is marked as decorative"
                                        maxHeight="10rem"
                                    >
                                    </TextArea>
                                    {alertId === image.image_id && alertOpen !== "" && <AlertModel altText={alertOpen} alertId = {image.image_id} alertId2={alertId} setAlertOpen={setAlertOpen} setAlertId={setAlertId} marginBottom = {"2rem"}/>}
                                    {alertId !== image.image_id && <Avatar name = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).alttext_updated_user:""} imageUrl = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).user_url:""} onModalClick={modalHandler}/>}
                                    {openNewModal && ReactDOM.createPortal(
                                        <Backdrop/>,
                                        document.getElementById('backdrop-root')
                                    )}
                                    {openNewModal && ReactDOM.createPortal(
                                        <ModalOverlay
                                        name = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).alttext_updated_user:""}
                                        imageUrl = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).user_url:""}
                                        pageImageUrl = {image.image_url}
                                        />,
                                        document.getElementById('overlay-root')
                                    )}
                                    <div className='container-fluid' style={{"marginBottom":"1rem"}}>
                                        <Checkbox 
                                            id={"isDecorative-checkbox-" + image.image_id}
                                            label="Mark Image as Decorative" 
                                            variant="simple" 
                                            inline={true}
                                            checked={image.is_decorative}
                                            onChange={()=>{
                                                image.is_decorative = !image.is_decorative;
                                                setChangeUI(!changeUI);
                                            }}
                                            // disabled={inputDisabled}
                                        />
                                    </div>
                                    <div className='container-fluid review-page-button'>
                                        <button type="button" class="btn btn-outline-primary" onClick={() => {setImageId(image.image_id);setViewContext(true);}}>View Context</button>
                                        <button type="button" class="btn btn-outline-primary" onClick={() => {markImageAsUnusable(image.image_id);}}>Needs Conversion</button>
                                        <Button
                                            color='success'
                                            margin='xxx-small'
                                            onClick={
                                                (event) => {
                                                        // if (image.alt_text.indexOf("'") !== -1 || image.alt_text.indexOf("\"") !== -1) {
                                                        //     setAlertId(image.image_id);
                                                        //     setAlertOpen("Alt text shouldn't contain quotes or apostrophes");
                                                        // } else {
                                                            // getUserDetails(image.image_url);
                                                        setAlertId(image.image_id);
                                                        handleUpdateAltText(event, image.image_url, image.alt_text, image.is_decorative);
                                                        setAlertOpen("Successfully updated Alt text with " + image.alt_text);
                                                        // }
                                                    }
                                            }
                                        >
                                            Update Alt Text
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Flex>
                    </Grid.Col>
                );
            })
            rows.push(rowElement);
        }

        return (rows.map((row, index) => {
            if(rows != null){
                return (
                    <Grid.Row key={index}>
                        {row}
                    </Grid.Row>
                );
            }
        }));

    }

    return (
        <>
            <div className='container-fluid'>
                <div className='container-fluid'>
                    {!viewContext && <h2 style={{marginBottom:'2rem', marginTop:'1rem'}}>Reviewing: {courseUnderReview.courseName} <span style={{ float:'right'}}><Button color='success' onClick={() => {handleInternalPublish()}} >Publish All</Button><button type="button" class="btn btn-outline-primary" style={{marginLeft:'0.5rem'}} onClick = {onDismiss}><i class="fa-solid fa-xmark" style={{padding:"0rem", fontSize:'1.5rem'}}></i></button></span></h2>}
                </div>
                <div className='container-fluid'>
                    {!viewContext &&
                        (completedImages.length > 0 ? (
                            <Grid>
                                {renderCompletedImages()}
                            </Grid>
                            ) : (
                                <Alert
                                    variant='error'
                                    margin='small'>
                                    No completed, unpublished images for this course.
                                </Alert>
                            )
                        )
                    }

                    { viewContext &&                 
                                    <div id='home-container'>
                                        <div className='space-children' id="div1">
                                            {renderCompletedImages(imageId)}
                                        </div>
                                        {<i class="fa-solid fa-circle-xmark fa-2x" style={{padding:"0rem"}} onClick={() => {setImageId("");setViewContext(false)}}></i>}
                                        {<ContextPage imageId={imageId} modalOpen={viewContext} onViewContextChange={viewContextChange} basePath={basePath} />}        
                                    </div>

                    }
                </div>
            </div>
            <Overlay 
                id="loading-overlay"
                open={isLoadingReview} 
                label="Skipping Image"  
                shouldContainFocus 
                > 
                <Mask fullscreen>
                    <Spinner renderTitle="Skipping Image" size="large" margin="auto" />
                </Mask>
            </Overlay>
        </>
    )
}
