import React from 'react'
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { Link } from 'react-router-dom';

const BackNavigation = ({ navigation, color = 'text-blue-800', hoverColor="text-blue-500", textSize="text-5xl" }) => {
  return (
    <div className='w-screen py-2 px-2'>
      <Link
        to={`${navigation}`}
      >
        <IoArrowBackCircleOutline className={`${textSize} ${color} hover:${hoverColor}`} />
      </Link>
    </div>
  )
}

export default BackNavigation