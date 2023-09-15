import React, { useState, useEffect } from 'react';
import {Checkbox, Grid, Img, Alert, Flex, TextArea, ScreenReaderContent, Button } from '@instructure/ui';
import DOMPurify from 'dompurify';
import AlertModel from './Alert';
import Avatar from './Avatar';
import ContextPage from './ContextPage';
import axios from 'axios';

export default function ReviewModal({ basePath, open, onDismiss, courseUnderReview, completedImages, setCompletedImages, handlePublish }) {
    const [tempImages, setTempImages] = useState([]);
    const [alertOpen, setAlertOpen] = useState("");
    const [alertId, setAlertId] = useState("");
    const [changeUI, setChangeUI] = useState(false);
    const [nameArray, setNameArray] = useState([]);
    const [viewContext, setViewContext] = useState(false);
    const [imageId, setImageId] = useState(false);
    const [imageUrlArray, setImageUrlArray] = useState([]);

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

    function resetView() {
        setSkipModalOpen(false);
        setAdvancedModalOpen(false);
        setUnusableModalOpen(false);
        setIsLoading(false);
      }

    const handleAltTextChange = (event, imageUrl) => {
        setTempImages(tempImages.map((image) => {
            if (image.image_url != imageUrl) return image

            return {
                image_url: image.image_url,
                alt_text: event.target.value,
                image_id: image.image_id
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
                            <div class="card border-warning">
                                <div class="card-body">
                                    <Img src={image.image_url} alt="Image got removed from the course"/>
                                    <TextArea
                                        label={<ScreenReaderContent>Alt Text</ScreenReaderContent>}
                                        value={image.alt_text}
                                        onChange={(event) => handleAltTextChange(event, image.image_url)}
                                        placeholder="The image is marked as decorative"
                                    >
                                    </TextArea>
                                    {alertId === image.image_id && alertOpen !== "" && <AlertModel altText={alertOpen} alertId = {image.image_id} alertId2={alertId} setAlertOpen={setAlertOpen} setAlertId={setAlertId} marginBottom = {"2rem"}/>}
                                    {alertId !== image.image_id && <Avatar name = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).alttext_updated_user:""} imageUrl = {(imageUrlArray.find(obj => obj.image_url === image.image_url))? (imageUrlArray.find(obj => obj.image_url === image.image_url)).user_url:""}/>}
                                    <div className='container-fluid' style={{"marginBottom":"1rem"}}>
                                        {console.log(image.is_decorative)}
                                        <Checkbox 
                                            id={"isDecorative-checkbox-" + image.image_id}
                                            label="Mark Image as Decorative" 
                                            variant="simple" 
                                            inline={true}
                                            checked={image.is_decorative}
                                            onChange={()=>{
                                                console.log(image.is_decorative);
                                                image.is_decorative = !image.is_decorative;
                                                console.log(image.is_decorative);
                                                setChangeUI(!changeUI);
                                            }}
                                            // disabled={inputDisabled}
                                        />
                                    </div>
                                    <button type="button" class="btn btn-outline-primary" onClick={() => {setImageId(image.image_id);setViewContext(true);}}>View Context</button>
                                    <Button
                                        color='success'
                                        margin='xxx-small'
                                        onClick={
                                            (event) => {
                                                    if (image.alt_text.indexOf("'") !== -1 || image.alt_text.indexOf("\"") !== -1) {
                                                        setAlertId(image.image_id);
                                                        setAlertOpen("Alt text shouldn't contain quotes or apostrophes");
                                                    } else {
                                                        // getUserDetails(image.image_url);
                                                        setAlertId(image.image_id);
                                                        handleUpdateAltText(event, image.image_url, image.alt_text, image.is_decorative);
                                                        setAlertOpen("Successfully updated Alt text with " + image.alt_text);
                                                    }
                                                }
                                        }
                                    >
                                        Update Alt Text
                                    </Button>
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
        <div className='container-fluid'>
            <div className='container-fluid'>
                {!viewContext && <h2 style={{marginBottom:'2rem', marginTop:'1rem'}}>Reviewing: {courseUnderReview.courseName} <span style={{ float:'right'}}><Button color='success' onClick={() => {handleInternalPublish()}} >Publish</Button><button type="button" class="btn btn-outline-primary" style={{marginLeft:'0.5rem'}} onClick = {onDismiss}><i class="fa-solid fa-xmark" style={{padding:"0rem", fontSize:'1.5rem'}}></i></button></span></h2>}
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
    )
}
