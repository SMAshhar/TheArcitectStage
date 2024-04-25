import Login from '@/components/Login'
import { Metadata } from 'next'
import React from 'react'


// This page can only be accessed by manually entering the link "/administration". 
// Change the folder name from "administration" to "xyz" to change the link name to "/xyz".
// The purpose is to generate an acceess token to the visitor, granting access to sanity "/studio".
// For more details, go through "/api/administration" file.


export const metadata: Metadata = {
  robots: {
    index:false,
    nocache:true
  }
}

export default function Administration() {
  return (
    <div className='h-screen'>
        <Login />
    </div>
  )
}
