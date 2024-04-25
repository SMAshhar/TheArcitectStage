'use client'
import React from 'react'
import localFont from 'next/font/local'
import { useForm } from 'react-hook-form'
import { useState } from 'react';
import toast from 'react-hot-toast'
import Image from 'next/image';

// This page is to take in information of admin-email and password and forward the same to the administration API.
// The API is to generate an access token to access sanity studio at "/studio".
// This form is made with "react-hook-form" library. The form will also check the email formating and give a popup when needed.

const cal = localFont({
    src: '../../../public/fonts/Jura.ttf',
    display: 'swap',
})

const isValidEmail = (email: string) =>
    // eslint-disable-next-line no-useless-escape
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        email
    );

export default function Form() {

    const [isLoading, setIsLoading] = useState(false)
    const [formatError, setFormatError] = useState('')

    async function onSubmit(formData: any) {
        console.log('submitting')
        const emailFormat = isValidEmail(formData.email)
        setIsLoading(true)
        if (emailFormat) {
            await fetch("/api/administration", {
                method: "POST",
                body: JSON.stringify({
                    adminEmailAddress: formData.email,
                    adminPassword: formData.password
                })
            })
            console.log("successful")

            reset()
        } else {
            toast.error('Please enter a valid email address', {
                icon: '💀',
                style: {
                    borderRadius: '1px',
                    background: '#009999',
                    color: '#fff',

                },
            })
            console.log("failed")
        }
        setIsLoading(false)
    }

    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    console.log(errors.email?.message)

    return (

        <div className='flex flex-col md:flex-row h-full justify-center items-end bg-gradient-to-b from-cyan-950 via-black to-cyan-950'>
            <div className='flex flex-col py-8'>
                <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm space-x-2 pt-16">
                    <div className="w-full max-w-2xl px-5 py-10 m-auto md:mt-10">
                        <div className='text-4xl md:text-5xl lg:text-5xl py-8'><div className={cal.className}>Enter Access Information</div></div>
                        <div className="grid max-w-xl grid-cols-2 gap-4 m-auto">

                            <div className="col-span-2">
                                <div className=" relative ">
                                    <input {...register('email', { required: '* Requires a valid email address' })} type="text" className="  border-transparent flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="Email" />
                                    <p className='self-start text-red-500 tracking-tighter text-xs italic'>{errors.email?.message as string}</p>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className=" relative ">
                                    <input {...register('password', { required: '* Requires password.' })} type="password" className="  border-transparent flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="Password" />
                                    <p className='self-start text-red-500 tracking-tighter text-xs italic'>{errors.subject?.message as string}</p>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <button type="submit" className="py-2 px-4 flex bg-cyan-700 hover:bg-cyan-900 focus:ring-cyan-500 focus:ring-offset-cyan-200 text-white w-full transition ease-in duration-200 justify-center items-center text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2   ">
                                    {isLoading ? <Image src='/gif/load.gif' alt='' width={20} height={19} /> : 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
