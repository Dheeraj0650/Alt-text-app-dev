import React, { useEffect, useState, useRef } from 'react';
import { Button, Text, Flex, Transition, Overlay, Mask, Spinner, SVGIcon } from '@instructure/ui';
import { IconMiniArrowEndSolid, IconMiniArrowStartSolid } from '@instructure/ui-icons'

import DOMPurify from 'dompurify';
import axios from 'axios';

export default function ContextPage(props) {
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [pageBody, setPageBody] = useState();
    const [currentPage, setCurrentPage] = useState(0);
    const [pageUrls, setPageUrls] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [navVisibility, setNavVisibility] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(undefined);

    const bodyDiv = useRef();

    // Fix error where state was being set on an unmounted component when the modal was closed before everything loaded.
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    })

    useEffect(() => {
        if (props.modalOpen && mounted) {
            axios({
                method:'get',
                url:`${props.basePath}/task.php?task=get_image_usage&image_id=${props.imageId}`
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

                if (mounted) {
                    let pages = loadJson.pages.split(', ');
                    setPageUrls(pages);
                }

                setIsLoading(false);

            })
            .catch((error) => {
                setIsLoading(false);
                setError("We failed to retrieve the image context information. Please refresh the page and try again.")
            })
        }
    }, [mounted]);

    useEffect(() => {
        if (pageUrls.length != 0 && pageUrls[0] != '') {

            axios({
                method:'get',
                url:`${props.basePath}/task.php?task=get_body&page_url=${encodeURIComponent(pageUrls[currentPage])}`
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
                setPageBody(purifyHtml(loadJson.body));
                setIsFirstLoad(false);
                 
            })
            .catch((error) => {
                setIsLoading(false);
                setError("We failed to retrieve the page information. Please refresh the page and try again.")
                setIsFirstLoad(false);
            })
        }
        else if (pageUrls[0] == '') {
            setIsLoading(false);
            setError("This image is no longer in use. ");
            setIsFirstLoad(false);
        }
    }, [currentPage, pageUrls]);

    function purifyHtml(html) {
        setIsLoading(false);
        setNavVisibility(true);
        return DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true }
        });
    }

    return (
        <>
        {
            error ? 
            <p>{error}</p> :
            <div id="div2">
                <div id="page-content" ref={bodyDiv} 
                    dangerouslySetInnerHTML={{__html: pageBody}} ></div>
                <Transition
                    in={navVisibility}
                    type={"slide-down"}
                >
                    <div id="context-nav">
                        <hr />
                        <Button 
                            id="context-previous-btn" 
                            color="secondary"
                            onClick={() => {
                                setCurrentPage(currentPage - 1);
                                setIsLoading(true);
                            }}
                            interaction={currentPage > 0 ? "enabled" : "disabled"}
                        >
                            <SVGIcon size={'x-small'} inline><IconMiniArrowStartSolid /></SVGIcon> Previous
                        </Button>

                        <Button 
                            id="context-next-btn" 
                            color="secondary"
                            onClick={() => {
                                setCurrentPage(currentPage + 1);
                                setIsLoading(true);
                            }}
                            interaction={currentPage < pageUrls.length - 1 ? "enabled" : "disabled"}
                        >
                            Next <SVGIcon size={'x-small'} inline><IconMiniArrowEndSolid /></SVGIcon>
                        </Button>
                    </div>
                </Transition>
            </div>
        }

        <Overlay 
            id="loading-overlay"
            open={props.modalOpen && isLoading} 
            label="Loading"  
            shouldContainFocus 
            >
            <Mask fullscreen>
            {(props.modalOpen && isLoading) && <i class="fa-regular fa-circle-xmark fa-2x" onClick={() => props.onViewContextChange(false)}></i>}
                <Flex direction='column' justifyItems='center' alignItems='center'>
                    {isFirstLoad && 
                        <Flex.Item>
                            <Text as='p'>This may take some time depending on the size of the course</Text>
                        </Flex.Item>
                    }
                    <Flex.Item>
                        <Spinner renderTitle="Loading" size="large" margin="auto" />
                    </Flex.Item>
                </Flex>
            </Mask>
        </Overlay>
        </>
    );
}
