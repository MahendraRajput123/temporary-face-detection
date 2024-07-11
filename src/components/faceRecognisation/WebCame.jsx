import React, { useEffect, useCallback, useState, useRef } from 'react'
import Webcam from 'react-webcam';
import { useFaceDetection } from 'react-use-face-detection';
import FaceDetection from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

const WebCam = ({ setIsPersonVisible, action, isPersonVisible }) => {
    const width = 900;
    const height = 600;
    const { webcamRef, detected } = useFaceDetection({
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

    const takeSnapshot = useCallback(() => {
        const snapshot = webcamRef.current.getScreenshot();
        if (snapshot && isPersonVisible) {
            localStorage.setItem('snapshot', snapshot);
        } else {
            console.log('Failed to capture snapshot');
        }
    }, [webcamRef, action, isPersonVisible]);

    useEffect(() => {
        let intervalId;
        intervalId = setInterval(takeSnapshot, 100);

        return () => {
            clearInterval(intervalId);
            if (webcamRef.current) {
                webcamRef.current.stream?.getTracks().forEach(track => track.stop());
            }
        };
    }, [takeSnapshot, webcamRef, action]);

    useEffect(() => {
        setIsPersonVisible(detected);
    }, [detected, setIsPersonVisible]);

    useEffect(() => {
        // Cleanup function to remove snapshots when component unmounts
        return () => {
            localStorage.removeItem('snapshot');
        };
    }, [action]);

    return (
        <Webcam
            ref={webcamRef}
            forceScreenshotSourceSize
            className="w-full object-cover rounded-3xl"
        />
    );
}

export default WebCam;