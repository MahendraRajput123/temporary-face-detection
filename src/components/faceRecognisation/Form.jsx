import React, { useState } from 'react'
import { IoArrowBackCircleOutline } from "react-icons/io5";
import BackNavigation from '../common/BackNavigation.jsx'
// require("../../assets/detection.jpg")

const Form = ({ setShowCameraPreview, setAction }) => {
    const [name, setName] = useState('');
    const [btnIndex, setBtnIndex] = useState(null);
    const namePattern = /^[A-Za-z\s]+$/;

    const onSubmit = () => {
        if (name.trim() === "") {
            alert('Please enter your name');
            setName(name.trim());
            return;
        }
        
        if (!namePattern.test(name)) {
            alert('Name can only contain letters and spaces');
            return;
        }
        
        localStorage.setItem('name', name);
        setShowCameraPreview(true);
        setAction('registered');
    };

    const recognised = () => {
        setShowCameraPreview(true);
        setAction('recognised');
    }

    console.log(name)
    return (
        <>

            {/* {
                btnIndex === 1 &&
                <div className='w-screen py-2 px-2'>
                    <IoArrowBackCircleOutline  className='text-blue-800 hover:text-blue-500 text-5xl' onClick={()=> setBtnIndex(2)}/>
                </div>
            } */}

            {
                btnIndex !== 1 &&
                <img
                    src={require("../../assets/face-dectection.jpg")}
                    alt="background"
                    className='w-[60rem] my-5 object-cover'
                />
            }


            {
                btnIndex !== 1 &&
                <div className='space-x-2 flex flex-wrap sm:w-1/2 lg:w-2/6 md:w-2/6 max-sm:w-full justify-evenly my-10'>
                    <button
                        onClick={() => setBtnIndex(1)}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Register
                    </button>
                    <button
                        onClick={() => recognised()}
                        className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Recognise
                    </button>
                </div>
            }

            {
                btnIndex === 1 &&
                <div className="flex w-1/4 my-7 items-end justify-evenly sm:w-full lg:w-2/4 md:w-2/3 max-sm:w-full max-sm:flex-col max-sm:items-start">
                    <input
                        type="text"
                        id="hero-field"
                        name="hero-field"
                        className="max-sm:w-8/12 max-sm:m-auto max-sm:my-4 w-full sm:w-1/2 bg-transparent rounded border bg-opacity-50 border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-black py-1 px-3 leading-8 transition-colors duration-200 ease-in-out placeholder-black"
                        placeholder="Enter Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <button className="inline-flex text-white bg-blue-700 border-0 py-2 px-6 max-sm:px-2 max-sm:text-[1rem] max-sm:m-auto focus:outline-none hover:bg-blue-600 rounded text-lg" onClick={onSubmit}>Start Capturing</button>
                </div>
            }

            {
                btnIndex === 1 &&
                 <h1 className='font-bold mt-10 text-2xl mx-8'>
                  <span className='text-red-700 font-extrabold'>Note:-</span> Please keep your face in the centre of the camera. The registration process will take only 8 seconds. 
                 </h1>
             }
        </>
    )
}

export default Form
