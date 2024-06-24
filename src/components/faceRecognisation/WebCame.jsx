import React, { useEffect } from 'react'
import Webcam from 'react-webcam';
import { CameraOptions, useFaceDetection } from 'react-use-face-detection';
import FaceDetection from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

const WebCam = ({ setIsPersonVisible }) => {

    const width = 900;
    const height = 600;
    const { webcamRef, boundingBox, isLoading, detected, facesDetected } = useFaceDetection({
        faceDetectionOptions: {
            model: 'short',
        },
        faceDetection: new FaceDetection.FaceDetection({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        }),
        camera: ({ mediaSrc, onFrame }) =>
            new Camera(mediaSrc, {
                onFrame,
                width,
                height,
            }),
    });

    const takeSnapshot = () => {
        const snapshot = webcamRef.current.getScreenshot();
        localStorage.setItem('snapshot', snapshot);
    };


    useEffect(() => {
        const intervalId = setInterval(() => {
          takeSnapshot();
        }, 500);
    
        return () => {
          clearInterval(intervalId);
          if (webcamRef.current) {
            webcamRef.current.stream?.getTracks().forEach(track => track.stop());
          }
        };
      }, []);

    useEffect(() => {
        if (detected) {
            setIsPersonVisible(true);
        } else {
            setIsPersonVisible(false);
        }
    }, [detected, setIsPersonVisible]);

    return (
        <>
            <Webcam
                ref={webcamRef}
                forceScreenshotSourceSize
                className="w-full object-cover rounded-3xl"
            />
        </>
    )
}

export default WebCam