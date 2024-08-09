import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import { useNavigate } from "react-router-dom";

const FaceRecognition = () => {
    const navigate = useNavigate();
    const videoRef = useRef();
    const canvasRef = useRef();
    const [warning, setWarning] = useState('');
    const streamRef = useRef(null);
    const socketRef = useRef(null);
    const [recognisedPerson, setRecognisedPerson] = useState('');
    const [isPersonDetected, setIsPersonDetected] = useState(false);

    const setupCamera = useCallback(async () => {
        const video = videoRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        streamRef.current = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve(video);
            };
        });
    }, []);

    const loadModels = useCallback(async () => {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    }, []);

    const detectFace = useCallback(async (video) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
      
        const detectInterval = setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
          if (resizedDetections.length > 0) {
            // Find the closest face
            let closestFace = resizedDetections[0];
            let closestDistance = Number.MAX_SAFE_INTEGER;
      
            for (const detection of resizedDetections) {
              const x = detection.box.x;
              const y = detection.box.y;
              const distance = Math.sqrt(x * x + y * y);
              if (distance < closestDistance) {
                closestFace = detection;
                closestDistance = distance;
              }
            }
      
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
            // Draw a bounding box around the closest face
            const { x, y, width, height } = closestFace.box;
            context.beginPath();
            context.rect(x, y, width, height);
            context.strokeStyle = 'green';
            context.lineWidth = 2;
            context.stroke();

             // Log the dimensions of the cropped image
             console.log('Cropped Image Dimensions:', { width, height });
      
            // Crop the face region from the canvas
            const faceCanvas = document.createElement('canvas');
            faceCanvas.width = width;
            faceCanvas.height = height;
            const faceContext = faceCanvas.getContext('2d');
            faceContext.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      
            const base64Image = faceCanvas.toDataURL('image/png');
            console.log(base64Image,"-----------------------------------base64Image")
            socketRef.current.emit('recognised', { image: base64Image });
      
            setIsPersonDetected(true);
          } else {
            setWarning('Face not detected!');
            setIsPersonDetected(false);
          }
        }, 500);
      
        return () => clearInterval(detectInterval);
      }, []);

    const releaseResources = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }, []);

    useEffect(() => {
        socketRef.current = io('https://ebitsvisionai.in', {
            transports: ['websocket'],
        });

        socketRef.current.on('recognised-person', ({ name }) => {
            console.log(name,"-------------------------------------person name")
            setRecognisedPerson(name);
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

    const handleBackButton = () => {
        releaseResources();
        navigate('/');
    };

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                    <video 
                        ref={videoRef} 
                        className="w-full h-auto"
                        autoPlay 
                        muted
                        playsInline
                    ></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <div className="p-4">
                    {isPersonDetected && recognisedPerson && recognisedPerson.toLowerCase() !== "unknown" && (
                        <h1 className="text-green-600 text-2xl font-bold text-center mb-4">
                            Recognised Person: {recognisedPerson}
                        </h1>
                    )}
                    <button 
                        onClick={handleBackButton} 
                        className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceRecognition;