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
    const streamRef = useRef(null);
    const socketRef = useRef(null);
    const intervalRef = useRef(null);

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
        navigate('/');
    }, [name, navigate, releaseResources]);

    const detectFace = useCallback(async (video) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        intervalRef.current = setInterval(async () => {
            if (capturedImages >= 25) {
                completeRegistration();
                return;
            }

            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            if (resizedDetections.length > 0) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const base64Image = canvas.toDataURL('image/png');
                socketRef.current.emit('registered', { image: base64Image, name: name });
                setCapturedImages(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 25) {
                        completeRegistration();
                    }
                    return newCount;
                });
                setWarning('');
            } else {
                setWarning('Face not detected!');
            }
        }, 100);
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
        <div className="flex items-center justify-center w-full h-screen">
            <div className="w-full sm:w-3/4 lg:w-1/2">
                <video
                    ref={videoRef}
                    className="w-full h-auto mx-auto"
                    autoPlay
                    muted
                    playsInline
                ></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <h1 className="text-black text-3xl font-bold my-3 text-center">
                    {/* {
                        warning ?
                            "Please center your face in front of the camera to detect correctly" : */}
                            "Training In Progress... " + capturedImages
                    {/* } */}
                </h1>
            </div>
        </div>
    );
};

export default FaceRegistration;