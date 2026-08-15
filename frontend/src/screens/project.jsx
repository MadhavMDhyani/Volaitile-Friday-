import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const project = ( ) => {

    const locatiion = useLocation()

    console.log(location.state)

    return(
   
        <main
        className='h-screen w-screen flex'
        >


            <section className="left h-full min-w-60 bg-red-300">
                  

                  <header
                  className='flex justify-end p-4 w-full'>

                  </header>


            </section>

        </main>
  )
}

export default project