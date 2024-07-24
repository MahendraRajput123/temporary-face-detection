import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import { useLocation, useNavigate } from "react-router-dom";

const FaceRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { name } = location.state || {};
    const videoRef = useRef();
    const canvasRef = useRef();
    const [warning, setWarning] = useState('');
    const [capturedImages, setCapturedImages] = useState(0);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const streamRef = useRef(null);
    const socketRef = useRef(null);
    const intervalRef = useRef(null);
    const [generatedString, setGeneratedString] = useState(() => {
        const digits = '0123456789';
        const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        
        // Ensure the first character is a digit
        let result = digits.charAt(Math.floor(Math.random() * digits.length));
        
        // Generate the remaining 15 characters
        for (let i = 1; i < 16; i++) {
          result += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
        }
        
        return result;
      });

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

    const releaseResources = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }, []);

    const completeRegistration = useCallback(() => {
        socketRef.current.emit('train', { name: name });
        releaseResources();
        navigate('/',{ state: { message: "Face Register Successfully" } });
    }, [name, navigate, releaseResources]);

    const detectFace = useCallback(async (video) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
    
        const detect = async () => {
            if (capturedImages >= 25) {
                completeRegistration();
                return;
            }

            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            if (resizedDetections.length > 0) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                reduceImageSize(base64Image, 4).then((compressedImage) => {
                    console.log(`Compressed image size: ${compressedImage.length / 1024} KB`);
                    socketRef.current.emit('registered', { image: compressedImage, name: `${name}_${generatedString}` });
                    setCapturedImages(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 25) {
                            completeRegistration();
                        }
                        setProgressPercentage((newCount / 25) * 100);
                        return newCount;
                    });
                    setWarning('');
                }).catch((error) => {
                    console.error('Error reducing image size:', error);
                });
                setWarning('');
            } else {
                setWarning('Face not detected!');
            }
    
            requestAnimationFrame(detect);
        };
    
        requestAnimationFrame(detect);
    }, [name, completeRegistration]);
    

    useEffect(() => {
        socketRef.current = io('https://ebitsvisionai.in', {
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full sm:w-3/4 lg:w-1/2 p-4 bg-white rounded-lg shadow-md">
                <video
                    ref={videoRef}
                    className="w-full h-auto mx-auto rounded-lg"
                    autoPlay
                    muted
                    playsInline
                ></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden relative my-3">
                    <div
                        className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-700">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                </div>
               <p className="text-red-500 text-center mt-2">{warning && warning}</p>
            </div>
        </div>
    );
};

export default FaceRegistration;