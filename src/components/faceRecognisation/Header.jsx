import React from 'react'
import myImage from '../../../src/assets/logo.png';
import { MdCall, MdOutlineEmail } from 'react-icons/md';

const Header = () => {
  return (
    <header className="text-gray-600 body-font w-[80vw] sticky top-0 z-50">
      <div className="flex flex-wrap pt-4 px-2 max-sm:flex-col md:flex-row items-center justify-between">
        <a className="max-md:inline-block flex title-font font-medium items-center mb-4 md:mb-0">
          <img
            src={myImage}
            alt="Your Image"
            className="object-contain max-w-xs"
          />
        </a>
        <div className="flex items-center justify-between gap-6 w-2/6 max-sm:w-full max-sm:flex-col">
          <a
            href="mailto:hr@ealphabits.com"
            className="flex items-center gap-2 text-lg hover:bg-white p-2 rounded-full"
          >
            <MdOutlineEmail />
            hr@ealphabits.com
          </a>
          <a
            href="tel:+919737208790"
            className="flex items-center gap-2 text-lg hover:bg-white p-2 rounded-full"
          >
            <MdCall />
            +91-97372 08790
          </a>
        </div>
      </div>
        <hr className="bg-primary h-[2px] mt-5" />
    </header>
  )
}

export default Header
