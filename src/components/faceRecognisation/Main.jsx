import React, { useEffect, useState, useCallback } from 'react';
import Form from './Form.jsx';
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Main = () => {
  const location = useLocation();
  const { message } = location.state || {};
  const navigate = useNavigate();

  const showToaster = () => {
    toast.success('Face Recognised Successfully', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    });

    // Update the location state to remove the message
    navigate(location.pathname, { replace: true, state: {} });
}

  useEffect(() => {
    if (message) {
      showToaster();
    }
  }
  , [message]);


  const [showCameraPreview, setShowCameraPreview] = useState(false);
  return (
    <div className="flex flex-col items-center justify-start h-screen w-full">
      <ToastContainer />
      {/* <Header /> */}
      <h1 className='font-bold text-3xl text-black mt-5'>Face Recognisation</h1>
      {!showCameraPreview && <Form setShowCameraPreview={setShowCameraPreview} />}
    </div>
  );
};

export default Main;