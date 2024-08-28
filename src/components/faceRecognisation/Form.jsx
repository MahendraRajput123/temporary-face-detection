import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import IconCamera from '../Icons/icon-camera';

const Form = () => {
    const [name, setName] = useState('');
    const [btnIndex, setBtnIndex] = useState(null);
    const navigate = useNavigate();
    const namePattern = /^[A-Za-z\s]+$/;

    const onSubmit = () => {
        if (name.trim() === "") {
            setName(name.trim());
            toast.error('Please enter your name' , {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return;
        }
        
        if (!namePattern.test(name)) {
            toast.error('Name can only contain letters and spaces' , {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return;
        }
        
        // Navigate to /face-register with payload
        navigate('/face-register', { state: { name } });
    };

    const recognised = () => {
        navigate('/face-recognisation');
    }

    return (
        <>
            {
                btnIndex !== 1 &&
                <img
                    src={require("../../assets/face-dectection.jpg")}
                    alt="background"
                    className='max-w-3xl my-5 object-cover'
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

                        <button className="inline-flex text-white bg-blue-700 border-0 py-2 px-6 max-sm:px-2 max-sm:text-[1rem] max-sm:m-auto focus:outline-none hover:bg-blue-600 rounded text-lg" onClick={onSubmit}>
                            <div className='flex justify-between items-center'>
                                <IconCamera className="text-white" iconColor="#ffffff"/>
                                <span className='mx-3'>Start Capturing</span>
                            </div>
                        </button>
                </div>
            }

            {
                btnIndex === 1 &&
                 <h1 className='font-bold mt-10 text-xl mx-20 max-sm:mx-8'>
                  <span className='text-red-700 font-extrabold'>Note:-</span> Please keep your face in the centre of the camera. The registration process will take only 8 seconds. 

                  To ensure full access to the system, a camera must be integrated and operational within your setup. Please enable access to the camera as it is essential for complete system functionality.
                 </h1>
             }
        </>
    )
}

export default Form
