import React from 'react';
import ImageEditor from './ImageEditor';

export default function HomePage(props) {
  return (
    <ImageEditor basePath={props.basePath} />
  )
}