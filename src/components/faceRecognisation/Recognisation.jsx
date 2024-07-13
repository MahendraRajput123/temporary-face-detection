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
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            if (resizedDetections.length > 0) {
                context.drawImage(video, 0, 0, video.width, video.height);
                const base64Image = canvas.toDataURL('image/png');
                socketRef.current.emit('recognised', { image: base64Image });
                setWarning('');
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
        <div>
            <video ref={videoRef} width="640" height="480" autoPlay muted></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div style={{ color: 'red' }}>{warning}</div>
            {warning && (
                <h1 className="text-black text-3xl font-bold my-3">Please center your face in front of the camera to detect correctly</h1>
            )}
            {recognisedPerson && recognisedPerson.toLowerCase() !== "unknown" && (
                <h1 className="text-black text-3xl font-bold my-3">Recognised Person: {recognisedPerson}</h1>
            )}
            <button onClick={handleBackButton} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Back
            </button>
        </div>
    );
};

export default FaceRecognition;