import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Form from './Form.jsx';
import WebCame from './WebCame.jsx'

const Main = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
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

    return () => {
      newSocket.disconnect();
    };
  }, []);

  console.log(recognisedPerson,"---------------------recognisedPerson")


  const getVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(stream);
      // setCameraError('');

      // if (videoRef.current) {
      //   videoRef.current.srcObject = stream;
      // }
    } catch (err) {
      handleCameraError(err);
    }
  };

  const handleCameraError = (err) => {
    if (err.name === 'NotAllowedError') {
      setCameraError('Camera access denied. Please allow camera access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      setCameraError('No camera device found. Please connect a camera.');
    } else if (err.name === 'NotReadableError') {
      setCameraError('Unable to access camera. It might be in use by another application.');
    } else {
      setCameraError(`Error accessing camera: ${err.message}`);
    }

    setTimeout(() => {
      window.location.reload();
    }, 3000);

    console.error('Error accessing camera:', err);
  };

  useEffect(() => {
    if (stream && showCameraPreview) {
      const intervalId = setInterval(() => {
        if (action === 'recognised') {
          takeSnapshot();
        } else if (action === 'registered' && snapshotCount < 25 && isPersonVisible) {
          setSnapshotCount((snapshotCount)=> snapshotCount + 1);
          if (snapshotCount < 24) {
            takeSnapshot();
          }else{
            socket.emit('train',{ name: localStorage.getItem('name') });
            setShowCameraPreview(false);
            setSnapshotCount(0);
            window.location.reload();
          }
        }
      }, 500);

      return () => clearInterval(intervalId);
    }
  }, [stream, showCameraPreview, action, snapshotCount, isPersonVisible]);

  const takeSnapshot = () => {

    let snapshot = localStorage.getItem('snapshot');   
    if (!snapshot) return;

    if (socket) {
      if (action === 'recognised') {
        console.log('Sending recognised snapshot to server',snapshotCount);
        socket.emit('recognised', { image: snapshot });
      } else if (action === 'registered') {
        console.log('Sending registered snapshot to server');
        socket.emit('registered', { image: snapshot, name: localStorage.getItem('name')});
      }
    }
  };

  useEffect(() => {
    if (showCameraPreview) {
      getVideo();
    } else {
      stream?.getTracks()?.forEach((track) => track?.stop());
    }
  }, [showCameraPreview]);

  const handleRetry = () => {
    getVideo();
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-scree w-full">
        {!showCameraPreview && <h1 className="text-3xl font-bold my-6">Face Recognisation Demo</h1>}
        {!showCameraPreview && <Form setShowCameraPreview={setShowCameraPreview} setAction={setAction} />}

        {showCameraPreview && (
          <div className="relative w-full h-full">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-500">{cameraError}</p>
                <button onClick={handleRetry} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                  Retry
                </button>
              </div>
            ) : 
              <div className="flex flex-col items-center justify-center h-full bg-red-600 relative">

                <div className='absolute top-10 inset-x-0 max-md:w-[90%] max-lg:w-[80%] lg:w-[55%] m-auto max-sm:mt-14'>
                  <WebCame setIsPersonVisible={setIsPersonVisible}/>
                  {
                    isPersonVisible && recognisedPerson && <h1 className="text-black text-3xl font-bold my-3">Recognised Person :- {recognisedPerson}</h1>
                  }

                  {
                    isPersonVisible && snapshotCount > 0 && <h1 className="text-black text-3xl font-bold my-3">Training In Progress... {snapshotCount + 1} / 25</h1> 
                  }

                  {
                    !isPersonVisible && snapshotCount > 0 && <h1 className="text-black text-3xl font-bold my-3">Please Center Your face in front of camera to detect face correctly</h1>
                  }
                </div>
              </div>
            }
          </div>
        )}
      </div>
    </>
  );
};

export default Main;