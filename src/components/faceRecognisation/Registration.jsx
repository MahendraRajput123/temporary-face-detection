import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import { useLocation, useNavigate } from "react-router-dom";
import ShowAlert from "./AlertTimer"

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
    const isRegisterPersonFoundRef = useRef(false);
    const eventConfirmForProccessRef = useRef(false);
    const [showAlertTimer, setShowAlertTimer] = useState(true);
    let frameCount = 1;

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

        if(isRegisterPersonFoundRef.current === true){
            navigate('/',{ state: { message: "Your face is already registered with us" } });
        }else{
            navigate('/',{ state: { message: "Face Register Successfully" } });
        }
    }, [name, navigate, releaseResources,isRegisterPersonFoundRef]);

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
    
            context.clearRect(0, 0, canvas.width, canvas.height);
    
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
      
            // Crop the face region from the canvas
            const faceCanvas = document.createElement('canvas');
            faceCanvas.width = width;
            faceCanvas.height = height;
            const faceContext = faceCanvas.getContext('2d');
            faceContext.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      
            const base64Image = faceCanvas.toDataURL('image/png');

                if (frameCount <= 10) {
                        socketRef.current.emit('recognized_before_register', { image: base64Image });
                        frameCount += 1;
                } else if (isRegisterPersonFoundRef.current === false && frameCount >= 10 && eventConfirmForProccessRef.current === true) {
                    socketRef.current.emit('registered', { image: base64Image, name: `${name}_${generatedString}` });
                    setCapturedImages(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 25) {
                            completeRegistration(); 
                        }
                        setProgressPercentage((newCount / 25) * 100);
                        return newCount;
                    });
                    setWarning('');
                }else if(isRegisterPersonFoundRef.current === true && frameCount >= 10 && eventConfirmForProccessRef.current === true){
                    completeRegistration();
                }else{
                    console.log("isRegisterPersonFoundRef",isRegisterPersonFoundRef.current, "frameCount", frameCount, "eventConfirmForProccessRef", eventConfirmForProccessRef.current);
                }

            } else {
                setWarning('Face not detected!');
            }
    
            requestAnimationFrame(detect);
        };
    
        requestAnimationFrame(detect);
    },[name, completeRegistration, isRegisterPersonFoundRef,eventConfirmForProccessRef, frameCount]);
    
    
    useEffect(() => {
        socketRef.current = io('http://localhost:5000', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
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
        socketRef.current.on('face_status', ({ frame_counter, recognized_person_counter }) => {

            if (Number(frame_counter) === 10 && Number(recognized_person_counter) >= 8) {
                // frameCount = 0;
                isRegisterPersonFoundRef.current = true;
                setShowAlertTimer(false);
            }

            if (Number(frame_counter) === 10 && Number(recognized_person_counter) < 8) {
                setShowAlertTimer(false);
            }

            eventConfirmForProccessRef.current = true;
        });
    }, [socketRef, frameCount, isRegisterPersonFoundRef, eventConfirmForProccessRef,showAlertTimer]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <ShowAlert showAlertTimer={showAlertTimer} setShowAlertTimer={setShowAlertTimer} />

            <div className={`w-full sm:w-3/4 lg:w-1/2 p-4 bg-white rounded-lg shadow-md ${!isRegisterPersonFoundRef.current && eventConfirmForProccessRef.current ? null : 'hidden'}`}>
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