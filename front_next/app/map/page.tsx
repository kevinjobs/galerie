"use client";
import ReactDOM from 'react-dom';
import React, { useEffect, useRef, Fragment } from 'react';
import { Map, APILoader, ScaleControl, ToolBarControl, ControlBarControl, Geolocation } from '@uiw/react-amap';

const Demo = () => (
  <div>
    <Map style={{width: '100vw', height: '100vh'}}>
      <Geolocation />
    </Map>
  </div>
);

const Mount = () => (
  <APILoader version="2.0.5" akey="">
    <Demo />
  </APILoader>
)
export default Mount;