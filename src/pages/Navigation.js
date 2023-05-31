import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppNav, Heading } from '@instructure/ui';

const totalItemsCount = 2;

export default function Nav(props)
{
  // Get the current path in order to determine which nav item should be active
  let path = useLocation().pathname;

  const [visibleItemsCount, setVisibleItemsCount] = useState(totalItemsCount);
  const handleUpdate = newVisibleItemsCount => setVisibleItemsCount(newVisibleItemsCount.visibleItemsCount);
  const navigate = useNavigate()
  const handleOnClick = currentPage => useCallback(() => {
    navigate(currentPage, {replace: true})
  }, [navigate]);

  return (
    <>
    <Heading level="h2" as="h1" margin="large large" border="bottom">Alt Text App</Heading>
      <AppNav
        screenReaderLabel="App navigation"
        visibleItemsCount={visibleItemsCount}
        onUpdate={handleUpdate}
        {...props}
        themeOverride={{
          horizontalMargin: '6%'
        }}
      >
          <AppNav.Item
            isSelected={path == '/' || path == props.basePath + '/' ? true : false}
            renderLabel="Home"
            onClick={handleOnClick('/')}
          />

          <AppNav.Item
            isSelected={path == '/advanced_images' ? true : false}
            renderLabel="Advanced Images"
            onClick={handleOnClick('/advanced_images')}
          />

          {props.userRole === "Instructor" && <AppNav.Item
              isSelected={path == '/load_images' ? true : false}
              renderLabel="Load Images"
              onClick={handleOnClick('/load_images')}
              />}

          {props.userRole === "Instructor" && <AppNav.Item
              isSelected={path == '/review_publish' ? true : false}
              renderLabel="Review & Publish"
              onClick={handleOnClick('/review_publish')}
              />}
      </AppNav>
    </>
  )
}