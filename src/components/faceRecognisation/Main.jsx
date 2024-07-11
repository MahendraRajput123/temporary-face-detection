import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Form from './Form.jsx';
import Header from './Header.jsx'
import WebCame from './WebCame.jsx'

const Main = () => {
  const [socket, setSocket] = useState(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [action, setAction] = useState('recognised');
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [recognisedPerson, setRecognisedPerson] = useState('');
  const [isPersonVisible, setIsPersonVisible] = useState(false);

  useEffect(() => {
    const newSocket = io('wss://ebitsvisionai.in', {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('recognised-person', ({ name }) => {
      setRecognisedPerson(name);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleCameraError = useCallback((err) => {
    let errorMessage = 'An error occurred while accessing the camera.';
    if (err.name === 'NotAllowedError') {
      errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
    } else if (err.name === 'NotFoundError') {
      errorMessage = 'No camera device found. Please connect a camera.';
    } else if (err.name === 'NotReadableError') {
      errorMessage = 'Unable to access camera. It might be in use by another application.';
    }
    setCameraError(errorMessage);
    console.error('Error accessing camera:', err);
  }, []);

  const takeSnapshot = useCallback(() => {
    const snapshot = localStorage.getItem('snapshot');
    if (!snapshot || !socket) return;

    const eventName = action === 'recognised' ? 'recognised' : 'registered';
    const payload = { image: snapshot };
    if (action === 'registered') {
      payload.name = localStorage.getItem('name');
    }
    socket.emit(eventName, payload);
  }, [action, socket]);

  useEffect(() => {
    if (!showCameraPreview) return;

    let intervalId;
    if (action === 'recognised' || (action === 'registered' && isPersonVisible)) {
      intervalId = setInterval(() => {

        // If the action is 'registered' and 25 snapshots have been taken, train the model
        if (action === 'registered' && snapshotCount >= 24) {

          // Emit a 'train' event to the server
          socket.emit('train', { name: localStorage.getItem('name') });
          setShowCameraPreview(false);
          setSnapshotCount(0);
          window.location.reload();
        } else {
          // Take a snapshot every 500ms and send it to the server
          takeSnapshot();

          // Increment snapshot count if the action is 'registered'
          if (action === 'registered') {
            setSnapshotCount(count => count + 1);
          }

        }
      }, 100);
    }

    return () => clearInterval(intervalId);
  }, [showCameraPreview, action, isPersonVisible, snapshotCount, socket, takeSnapshot]);

  // useEffect(() => {
  //   if (showCameraPreview) {
  //     navigator.mediaDevices.getUserMedia({ video: true })
  //       .then(() => setCameraError(''))
  //       .catch(handleCameraError);
  //   }
  // }, [showCameraPreview, handleCameraError]);

  return (
    <div className="flex flex-col items-center justify-start h-screen w-full">
      {/* <Header /> */}
      <h1 className='font-bold text-3xl text-black mt-5'>Face Recognisation</h1>
      {!showCameraPreview && <Form setShowCameraPreview={setShowCameraPreview} setAction={setAction} />}
      {showCameraPreview && (
        <div className="relative w-full h-full">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-500">{cameraError}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#f5f5f5] relative">
              <div className='absolute top-10 inset-x-0 max-md:w-[90%] max-lg:w-[80%] lg:w-[55%] m-auto max-sm:mt-14'>
                <WebCame setIsPersonVisible={setIsPersonVisible} isPersonVisible={isPersonVisible} action={action}/>
                {isPersonVisible && recognisedPerson && (
                  <h1 className="text-black text-3xl font-bold my-3">Recognised Person: {recognisedPerson}</h1>
                )}
                {isPersonVisible && snapshotCount > 0 && (
                  <h1 className="text-black text-3xl font-bold my-3">Training In Progress... {snapshotCount + 1}</h1>
                )}
                {!isPersonVisible && snapshotCount > 0 && (
                  <h1 className="text-black text-3xl font-bold my-3">Please center your face in front of the camera to detect correctly</h1>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Main;