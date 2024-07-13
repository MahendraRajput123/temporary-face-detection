import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const FaceRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { name } = location.state || {}; // Destructure the payload
    const videoRef = useRef();
    const canvasRef = useRef();
    const [warning, setWarning] = useState('');
    const [capturedImages, setCapturedImages] = useState([]);
    const streamRef = useRef(null);
    const socketRef = useRef(null);
    // const [completed, setCompleted] = useState(false);

    const setupCamera = useCallback(async () => {
        const video = videoRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        streamRef.current = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    }, []);

    const loadModels = useCallback(async () => {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    }, []);

    const detectFace = useCallback(async (video) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const detectInterval = setInterval(async () => {
            if (capturedImages.length >= 25) {
                socketRef.current.emit('train', { name: name });
                clearInterval(detectInterval);
                releaseResources();
                // setCompleted(true);
                return;
            }


            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            if (resizedDetections.length > 0) {
                context.drawImage(video, 0, 0, video.width, video.height);
                const base64Image = canvas.toDataURL('image/png');
                socketRef.current.emit('registered', { image: base64Image, name: name });
                setCapturedImages(prev => [...prev, base64Image]);
                setWarning('');
            } else {
                setWarning('Face not detected!');
            }
        }, 100);

        return () => clearInterval(detectInterval);
    }, [capturedImages]);

    const releaseResources = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }, []);

    useEffect(() => {
        socketRef.current = io('https://ebitsvisionai.in',{
          transports: ['websocket'],
        });

        (async () => {
            await loadModels();
            const video = await setupCamera();
            detectFace(video);
        })();

        return () => {
            releaseResources();
        };
    }, []);

    useEffect(() => {
        if (capturedImages.length >= 25) {
            socketRef.current.emit('train', { name: name });
            releaseResources();
            // setCompleted(true);
            navigate('/');
        }
    }, [capturedImages, releaseResources]);

    return (
        <div>
            <video ref={videoRef} width="640" height="480" autoPlay muted></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div style={{ color: 'red' }}>{warning}</div>
            { warning && (
                  <h1 className="text-black text-3xl font-bold my-3">Please center your face in front of the camera to detect correctly</h1>
            )}
            <div>Captured Images: {capturedImages.length}/25</div>
        </div>
    );
};

export default FaceRegistration;