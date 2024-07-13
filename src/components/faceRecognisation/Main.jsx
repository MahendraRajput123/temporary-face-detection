import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Form from './Form.jsx';
import Header from './Header.jsx'
import WebCame from './WebCame.jsx'

const Main = () => {
  // const [socket, setSocket] = useState(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [action, setAction] = useState('recognised');
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [recognisedPerson, setRecognisedPerson] = useState('');
  const [isPersonVisible, setIsPersonVisible] = useState(false);


  return (
    <div className="flex flex-col items-center justify-start h-screen w-full">
      {/* <Header /> */}
      <h1 className='font-bold text-3xl text-black mt-5'>Face Recognisation</h1>
      {!showCameraPreview && <Form setShowCameraPreview={setShowCameraPreview} setAction={setAction} />}
    </div>
  );
};

export default Main;