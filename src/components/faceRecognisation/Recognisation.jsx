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

    const reduceImageSize = (base64Image, targetSizeKB) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Image;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;
                let quality = 0.9; // Initial quality

                // Define the target size in bytes (4KB)
                const targetSizeBytes = targetSizeKB * 1024;

                // Resize and compress image until it reaches the target size
                const compressImage = () => {
                    // Calculate new dimensions
                    width = Math.floor(width * 0.9);
                    height = Math.floor(height * 0.9);
                    canvas.width = width;
                    canvas.height = height;

                    // Draw the image onto the canvas
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert the canvas to a base64 image
                    const compressedImage = canvas.toDataURL('image/jpeg', quality);

                    // Calculate the size of the compressed image in bytes
                    const stringLength = compressedImage.length;
                    const sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;

                    if (sizeInBytes > targetSizeBytes && quality > 0.1) {
                        quality -= 0.1;
                        compressImage();
                    } else {
                        resolve(compressedImage);
                    }
                };

                compressImage();
            };

            img.onerror = (error) => reject(error);
        });
    };

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

            setIsPersonDetected(resizedDetections.length > 0 ? true : false);
            if (resizedDetections.length > 0) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const base64Image = canvas.toDataURL('image/png');
                // Usage
                reduceImageSize(base64Image, 4).then((compressedImage) => {
                    console.log(`Compressed image size: ${compressedImage.length / 1024} KB`);
                    console.log(compressedImage)
                    socketRef.current.emit('recognised', { image: compressedImage });
                    setWarning('');
                }).catch((error) => {
                    console.error('Error reducing image size:', error);
                });
            } else {
                setWarning('Face not detected!');
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