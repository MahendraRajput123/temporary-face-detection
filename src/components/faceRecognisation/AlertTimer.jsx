import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Import your face recognition GIF
import faceRecognitionGif from './face-scanner.gif';

const AlertTimer = ({ initialStatus, onComplete, shouldClose }) => {
  const ReactSwal = withReactContent(Swal);
  const [currentDigit, setCurrentDigit] = useState(0);
  const [isRecognitionComplete, setIsRecognitionComplete] = useState(initialStatus);

  useEffect(() => {
    showAlert();
  }, []);

  useEffect(() => {
    if (shouldClose) {
      ReactSwal.close();
    }
  }, [shouldClose]);

  const showAlert = () => {
    ReactSwal.fire({
      title: 'Face Recognition in Progress...',
      html: (
        <div className='w-full bg-red-300 flex justify-center items-center flex-col space-y-3'>
          <img src={faceRecognitionGif} alt="Face Recognition" style={{width: '200px', height: '200px'}} />
          <p>Current progress: <b>{currentDigit}</b> / 10</p>
        </div>
      ),
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 60000, // 1 minute
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
      willClose: () => {
        onComplete();
      }
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentDigit < 10 && !isRecognitionComplete) {
        setCurrentDigit(prev => prev + 1);
        ReactSwal.update({
          html: (
            <div className='w-full bg-red-300 flex justify-center items-center flex-col space-y-3'>
              <img src={faceRecognitionGif} alt="Face Recognition" style={{width: '200px', height: '200px'}} />
              <p>Current progress: <b>{currentDigit + 1}</b> / 10</p>
            </div>
          )
        });
      } else {
        clearInterval(interval);
        if (isRecognitionComplete) {
          ReactSwal.close();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentDigit, isRecognitionComplete]);

  return null;
};

export default AlertTimer;