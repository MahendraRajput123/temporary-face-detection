import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import IconError from '../Icons/icon-error';
// Import your face recognition GIF
import faceRecognitionGif from './face-scanner.gif';

const AlertTimer = ({ showAlertTimer, setShowAlertTimer, isClientConnectedServer, cameraError, moveToHome, recognisedComponent = false}) => {
  const ReactSwal = withReactContent(Swal);
  const {hasError, message} = cameraError;

  console.log(`showAlertTimer : ${showAlertTimer}, isClientConnectedServer : ${isClientConnectedServer}, cameraError : ${hasError}, recognisedComponent : ${recognisedComponent}----------------------------Alert Component`);

  useEffect(() => {
    if (hasError && showAlertTimer) {
      showCameraAlert();
    }else if (isClientConnectedServer && !hasError && showAlertTimer && !recognisedComponent) {
      showConnectedAlert();
    } else if(!isClientConnectedServer && showAlertTimer && !hasError) {
      showDisconnectedAlert();
    }else if(showAlertTimer && !recognisedComponent){
      showSomethingWentWrongAlert();
    }
  }, [isClientConnectedServer,cameraError]);

  useEffect(() => {
    if (showAlertTimer === false) {
      console.log('Show Alert Timer:', showAlertTimer);
      ReactSwal.close();
    }
  }, [showAlertTimer]);

  const showConnectedAlert = () => {
    ReactSwal.fire({
      title: "Let's evaluate your face...",
      html: (
        <div className='w-full flex justify-center items-center flex-col space-y-3'>
          <img src={faceRecognitionGif} alt="Face Recognition" style={{width: '200px', height: '200px'}} />
        </div>
      ),
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
      willClose: () => {
        console.log('Alert will close');
        setShowAlertTimer(false);
      }
    });
  };
  
  const showDisconnectedAlert = () => {
    ReactSwal.fire({
      title: null,
      html: (
        <div className='w-full flex justify-center items-center flex-col space-y-3'>
          <IconError className='w-12 h-12 text-red-500' />
          <p className='text-[#545454] font-bold text-2xl'>Connection Error</p>
          <p>Failed to connect to the server. Please contact higher authorities.</p>
          <button 
            onClick={()=>moveToHome()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            Go Back Home
          </button>
        </div>
      ),
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  };

  const showCameraAlert = () => {
    ReactSwal.fire({
      title: null,
      html: (
        <div className='w-full flex justify-center items-center flex-col space-y-3'>
          <IconError className='w-12 h-12 text-red-500' />
          <p className='text-[#545454] font-bold text-2xl'>Camera Access Error</p>
          <p>{message}.</p>
          <button 
            onClick={()=> moveToHome()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            Go Back Home
          </button>
        </div>
      ),
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  };

  const showSomethingWentWrongAlert = () => {
    ReactSwal.fire({
      title: null,
      html: (
        <div className='w-full flex justify-center items-center flex-col space-y-3'>
          <IconError className='w-12 h-12 text-red-500' />
          <p className='text-[#545454] font-bold text-2xl'>Something Went Wrong</p>
          <p>Unable to connect to the server. Please contact with higher authorities.</p>
          <button 
            onClick={()=> moveToHome()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
          >
            Go Back Home
          </button>
        </div>
      ),
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  return null;
};

export default AlertTimer;