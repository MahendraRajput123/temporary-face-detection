import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Import your face recognition GIF
import faceRecognitionGif from './face-scanner.gif';

const AlertTimer = ({ showAlertTimer, setShowAlertTimer }) => {
  const ReactSwal = withReactContent(Swal);

  useEffect(() => {
    showAlert();
  }, []);

  useEffect(() => {
    if (showAlertTimer === false) {
      console.log('Show Alert Timer:', showAlertTimer);
      ReactSwal.close();
    }
  }, [showAlertTimer]);

  const showAlert = () => {
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
      timer: 15000, // 15 second
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

  return null;
};

export default AlertTimer;