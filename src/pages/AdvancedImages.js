import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from '@instructure/ui';

import ImageEditor from './ImageEditor';

export default function HomePage(props) {
  const [currentTab, setCurrentTab] = useState(0);

  function handleTabChange(event, {index, id}) {
    setCurrentTab(index);
  }

  return (
  <>
  <Tabs onRequestTabChange={handleTabChange}>
      <Tabs.Panel
        id='lotsOfTextTab'
        renderTitle='Lots of Text'
        isSelected={currentTab == 0}
      >
        <ImageEditor basePath={props.basePath} advancedType='lots_of_text' />
      </Tabs.Panel>

      <Tabs.Panel
        id='contentExpertiseTab'
        renderTitle='Needs Content Expertise'
        isSelected={currentTab == 1}
      >
        <ImageEditor basePath={props.basePath} advancedType='needs_content_expertise' />
      </Tabs.Panel>

      <Tabs.Panel
        id='foreignLanguageTab'
        renderTitle='Foreign Language'
        isSelected={currentTab == 2}
      >
        <ImageEditor basePath={props.basePath} advancedType='foreign_language' />
      </Tabs.Panel>
      <Tabs.Panel
        id='otherTab'
        renderTitle='Other'
        isSelected={currentTab == 3}
      >
        <ImageEditor basePath={props.basePath} advancedType='other' />
      </Tabs.Panel>
  </Tabs>
  </>
  )
}
