import React, { useState, useEffect, useRef } from 'react';
import { Button, Checkbox, TextArea, Modal, Heading, CloseButton, Text, Overlay, Spinner, Mask, RadioInput, RadioInputGroup, Alert } from '@instructure/ui';

import ContextPage from './ContextPage';

import DOMPurify from 'dompurify';
import AlertModel from './Alert';

import axios from 'axios';
import ButtonGroup from './ButtonGroup';

export default function ImageEditor(props) {
  const [imgUrl, setImgUrl] = useState();
  const [altText, setAltText] = useState("");
  const [currentImageId, setCurrentImageId] = useState(-1);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [markAdvancedError, setMarkAdvancedError] = useState("");
  const [isDecorative, setIsDecorative] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [unusableModalOpen, setUnusableModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [imageHeight, setImageHeight] = useState('400px');
  const [viewContext, setViewContext] = useState(false);
  const [isTextAreaInline, setIsTextAreaInline] = useState(true);
  const [advancedType, setAdvancedType] = useState();

  const [username, setUserName] = useState("");
  const [userimage, setUserImage] = useState("");

  const [activeCourseList, setActiveCourseList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [alertOpen, setAlertOpen] = useState("");

  function getUserDetails(){
      axios({
          method:'get',
          url:`${props.basePath}/task.php?task=get_user_details`,
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

          setUserName(loadJson.username);
          setUserImage(loadJson.userimage);

        })
        .catch((error) => {
          console.log(error);
        })
  }
  
  useEffect(()=>{
    getUserDetails();
  }, [])

  function viewContextChange(view) {
    setViewContext(view);
  }

  const imageRef = useRef(null);

  useEffect(() => {
    getActiveCourseImages();
    getImage();
    window.addEventListener('resize', handleResize);

    if (window.innerWidth <= 300) {
      setImageHeight('200px');
    }
  }, [])

  useEffect(() => {
    getImage();
    clearInput();
  }, [selectedCourse])

  useEffect(() => {
    getLockStatus();
  }, [currentImageId])

  function getLockStatus(){
    let imageId = `&image_id=${currentImageId}`;

    axios({
      method:'get',
      url:`${props.basePath}/task.php?task=get_lock_status${imageId}`
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

        console.log(!loadJson.locked);

        if(!loadJson.locked){
          console.log("in");
          lockImage(true);
        }
    })
  }

  function lockImage(lockStatus){
    let lock = lockStatus !== -1?`&lock=${lockStatus}`:"";

    if(currentImageId !== -1 && lock !== ""){
      let imageId = `&image_id=${currentImageId}`;
      console.log("in lock image");
      axios({
          method:'get',
          url:`${props.basePath}/task.php?task=update_course_id${lock}${imageId}`
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

          if('error' in loadJson){
            setAlertOpen(loadJson.error);
            getImage();
            clearInput();
          }
        })
    }
  }

  function getActiveCourseImages(){
    axios.get(
      `${props.basePath}/task.php?task=get_active_courses`
    )
    .then((response) => {
      const activeCourseList = response.data;

      var courseObjects = [];
      var lookUp = {};

      activeCourseList.forEach(element => {
        if(!(element['id'] in lookUp)){
          courseObjects.push(element); 
          lookUp[element['id']] = element['course_name'];
        }
      });

      setActiveCourseList(courseObjects);
    })
  }

  // get the next image the queue for a given user 
  function getImage() {
    setSubmitError("");
    setLoadError("");
    let advancedParameter = props.advancedType ? `&advanced_type=${props.advancedType}` : '';
    let activeImageCourseId = selectedCourse !== "" ? `&selectedCourse=${selectedCourse}` : '';

    axios.get(
        `${props.basePath}/task.php?task=get_image${advancedParameter}${activeImageCourseId}`
      )
      .then((response) => {
        if(typeof response.data === "string"){
            const jsonRegex = /{[^}]+}/;
            const jsonMatch = response.data.match(jsonRegex);

            if (jsonMatch) {
              const jsonString = jsonMatch[0];
              const getImageJson = JSON.parse(jsonString);
              if (getImageJson) {
                if (getImageJson.image_id) {
                  setImgUrl(getImageJson.url);
                  setCurrentImageId(getImageJson.image_id);
                }
                else if (getImageJson.no_images) {
                  setLoadError("No images left in queue");
                  setImgUrl(null);
                  setInputDisabled(true);
                  resetView();
                }
              }
              else {
                setLoadError("Image could not be loaded");
                setImgUrl(null);
                setInputDisabled(true);
                resetView();
              }
            }
        }
        else {
          const getImageJson = response.data;
          if (getImageJson) {
            if (getImageJson.image_id) {
              setImgUrl(getImageJson.url);
              setCurrentImageId(getImageJson.image_id);
            }
            else if (getImageJson.no_images) {
              setLoadError("No images left in queue");
              setImgUrl(null);
              setInputDisabled(true);
              resetView();
            }
          }
          else {
            setLoadError("Image could not be loaded");
            setImgUrl(null);
            setInputDisabled(true);
            resetView();
          }
        }
        
      })
      .catch(error => {
        setLoadError("Image could not be loaded");
        setImgUrl(null);
        setInputDisabled(true);
        resetView();
      });
  };

  function handleResize() {
    setImageHeight(imageRef.current.clientHeight + "px");
    
    if (window.innerWidth < convertRemToPixels(32)) {
      setIsTextAreaInline(false);
    }
    else {
      setIsTextAreaInline(true);
    }
  }

  // submits the current alt text for current image
  function submitAltText() {
    if (altText != "" || isDecorative) {
      setIsLoading(true);

      // XSS protection
      let cleanAltText = DOMPurify.sanitize(altText, {
        USE_PROFILES: { html: true }
      });

      // trim whitespace from alt text and ensure ending with "."
      cleanAltText = cleanAltText.trim();
      if (!cleanAltText.endsWith('.') && !cleanAltText.endsWith('?') & !cleanAltText.endsWith('!')) {
        cleanAltText += ".";
      }

      axios({
        method:'post',
        url:`${props.basePath}/task.php?task=set_image_completed`,
        data: {
          image_id: currentImageId,
          alt_text: (isDecorative ? null : cleanAltText),
          is_decorative: isDecorative,
          username: username,
          userurl: userimage
        }
      })
      .then((response) => {

        var loadJson = {};

        if(typeof response.data === "string"){
          const jsonRegex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/;
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
          setSubmitError('Failed to submit image.');
          resetView();
        }
        else {
          lockImage(false);
          getImage();
          getActiveCourseImages();
          clearInput();
        }
      })
      .catch((error) => {
        setSubmitError('Failed to submit image.');
        resetView();
      })
    }
  };

  function markImageAsAdvanced() {
    if (!advancedType) {
      setMarkAdvancedError('Please select a category')
    }
    else {
      setIsLoading(true);

      axios({
        method:'post',
        url:`${props.basePath}/task.php?task=mark_image_as_advanced`,
        data: {
          image_id: currentImageId,
          advanced_type: advancedType
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
          setSubmitError('Failed to submit image.');
          resetView();
        }
        else {
          getImage();
          clearInput();
        }
      })
      .catch((error) => {
        setMarkAdvancedError('Failed to mark image as advanced');
        setIsLoading(false);
      })
    }
  }

  function markImageAsUnusable() {
    setIsLoading(true);
    axios({
      method:'post',
      url:`${props.basePath}/task.php?task=mark_image_as_unusable`,
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

      if (loadJson.error) {
        setSubmitError('Failed to mark image as unusable');
        resetView();
      }
      else {
        getImage();
        clearInput();
      }

    })

  }

  // getting the alt text from TextInput
  function getAltTextValue(event, value) {
    setAltText(event.target.value);
  };

  // inverting isDecorative value when checkbox clicked
  function toggleIsDecorative() {
    setIsDecorative(!isDecorative);
  };

  // clears the text inputs value
  function clearInput() {
    setAltText("");
    setIsDecorative(false);
  };

  function skipImage() {
    setIsLoading(true);

    axios({
      method:'post',
      url:`${props.basePath}/task.php?task=skip_image`,
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

      if (loadJson.error) {
        setSubmitError('Failed to skip image.');
        resetView();
      }
      else {
        getImage();
        clearInput();
      }

    })

  };

  function handleImageLoad() {
    resetView();
    handleResize();
  }

  function resetView() {
    setSkipModalOpen(false);
    setAdvancedModalOpen(false);
    setUnusableModalOpen(false);
    setIsLoading(false);
  }

  function convertRemToPixels(rem) {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  const handleChange = (event) => {
    setSelectedCourse(event.target.value);
  };

  return (
    <> 
    <div id='home-container'>
      <div className='buttonGroup'>
        {!props.advancedType && <ButtonGroup courses = {activeCourseList} handleChange = {handleChange} selectedCourse={selectedCourse}/>}
      </div>
      <div className='space-children' id="div1">
        {imgUrl ?
          <div id="image-container" style={{ height: imageHeight }}>
            <img id="main-image" src={imgUrl} alt="image pulled" ref={imageRef} onLoad={handleImageLoad} />
          </div> :
          <div id="image-container" style={{ height: imageHeight }}>
            <Text as='p'>{loadError}</Text>
          </div>
        }
        
        <TextArea
          id="alt-text-input"
          label="Alt Text"
          placeholder="Enter Alt Text Here"
          height="5rem"
          resize="both"
          autoGrow
          inline={isTextAreaInline}
          value={altText}
          onChange={getAltTextValue}
          disabled={isDecorative || inputDisabled}
        />
        <br />

        <Checkbox 
          id="isDecorative-checkbox" 
          label="Mark Image as Decorative" 
          variant="simple" 
          inline={true}
          checked={isDecorative} 
          onChange={toggleIsDecorative}
          disabled={inputDisabled}
        />
        <br />

        <Button 
          id="submit-btn" 
          color="success" 
          onClick={submitAltText} 
          interaction={(!inputDisabled && (altText!='' || isDecorative)) ? "enabled" : "disabled"}
        >
          Submit
        </Button>

        {/* Render the mark as advanced button if the image is advanced. Otherwise render the unusable button */}
        {props.advancedType === undefined ? 
          <Button 
            id="advanced-btn" 
            color="secondary"
            onClick={() => {
              setMarkAdvancedError(null);
              setAdvancedType(null);
              setAdvancedModalOpen(true);
            }}
            interaction={inputDisabled ? "disabled" : "enabled"}
          >
            Mark As Advanced
          </Button>
          :
          <Button
          id="unusable-btn"
          color="secondary"
          onClick={() => setUnusableModalOpen(true)}
          interaction={inputDisabled ? "disabled" : "enabled"}
        >
          Mark as Unusable
        </Button>
        }
        

        <Button 
          id="skip-btn" 
          color="secondary" 
          onClick={() => setSkipModalOpen(true)}
          interaction={inputDisabled ? "disabled" : "enabled"}
        >
          Skip Image
        </Button>

        <Button
          id="view-context-btn"
          color="secondary"
          onClick={() => setViewContext(true)}
          interaction={inputDisabled ? "disabled" : "enabled"}
        >
          View Context
        </Button>
        
        {submitError !== "" && 
          <Alert variant='error' renderCloseButtonLabel='close'>
            {submitError}
          </Alert>
        }

      </div>
      {viewContext && <i class="fa-solid fa-circle-xmark fa-2x" onClick={() => setViewContext(false)}></i>}
      { viewContext && 
          <ContextPage imageId={currentImageId} modalOpen={viewContext} onViewContextChange={viewContextChange} basePath={props.basePath} />
      }

    </div>

    <Modal
      id="skip-modal"
      open={skipModalOpen}
      size="small"
      label="Skip Image"
      onDismiss={() => setSkipModalOpen(false)}
      shouldCloseOnDocumentClick
    >
      <Modal.Header>
        <CloseButton placement="end" offset="medium" screenReaderLabel="Close" onClick={() => setSkipModalOpen(false)}/>
        <Heading level="h2">Skip Image</Heading>
      </Modal.Header>
      <Modal.Body>
        <Text>Are you sure that you want to skip this image?</Text>
      </Modal.Body>
      <Modal.Footer>
        <Button color="secondary" onClick={() => setSkipModalOpen(false)}>Cancel</Button>&nbsp;
        <Button color="danger" onClick={skipImage}>Skip Image</Button>
      </Modal.Footer>
    </Modal>

    <Modal
      id="advanced-modal"
      open={advancedModalOpen}
      size="small"
      label="Mark Image as Advanced"
      onDismiss={() => setAdvancedModalOpen(false)}
      shouldCloseOnDocumentClick
    >
      <Modal.Header>
        <CloseButton placement="end" offset="medium" screenReaderLabel="Close" onClick={() => setAdvancedModalOpen(false)}/>
        <Heading level="h2">Mark Image as Advanced</Heading>
      </Modal.Header>
      <Modal.Body>
        <RadioInputGroup 
          description='Which of the following categories does this image best fit into?'
          onChange={(event, value) => setAdvancedType(value)}
        >
          <RadioInput key='lots_of_text' value='lots_of_text' label='Lots of Text' />
          <RadioInput key='needs_content_expertise' value='needs_content_expertise' label='Needs Content Expertise' />
          <RadioInput key='foreign_language' value='foreign_language' label='Foreign Language' />
          <RadioInput key='other' value='other' label='Other' />
        </RadioInputGroup>
        <Text as='p'>{markAdvancedError}</Text>
      </Modal.Body>
      <Modal.Footer>
        <Button color="secondary" onClick={() => setAdvancedModalOpen(false)}>Cancel</Button>&nbsp;
        <Button color="primary" onClick={markImageAsAdvanced}>Submit</Button>
      </Modal.Footer>
    </Modal>

    <Modal
      id="unusable-modal"
      open={unusableModalOpen}
      size="small"
      label="Mark Image as Unusable"
      onDismiss={() => setUnusableModalOpen(false)}
      shouldCloseOnDocumentClick
    >
      <Modal.Header>
        <CloseButton placement="end" offset="medium" screenReaderLabel="Close" onClick={() => setUnusableModalOpen(false)}/>
        <Heading level="h2">Mark Image as Unusable</Heading>
      </Modal.Header>
      <Modal.Body>
        <Text>Are you sure that you want to mark this image as unusable?</Text>
      </Modal.Body>
      <Modal.Footer>
        <Button color="secondary" onClick={() => setUnusableModalOpen(false)}>Cancel</Button>&nbsp;
        <Button color="danger" onClick={markImageAsUnusable}>Submit</Button>
      </Modal.Footer>
    </Modal>

    <Overlay 
      id="loading-overlay"
      open={isLoading} 
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
