import React, { useContext, useState } from 'react'
import { UserContext } from '../context/user.context'

const Home = () => {
  const { user } = useContext(UserContext)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')

  function createProject(event) {
    event.preventDefault()
    console.log('create project', projectName)
    setProjectName('')
    setIsModalOpen(false)
  }

  return (
    <main className='p-4'>
      <div className='project'>
        <button
          type='button'
          onClick={() => setIsModalOpen(true)}
          className='px-4 py-3 bg-slate-800 text-white rounded-md border border-slate-300 hover:bg-slate-700 transition'
        >
          Create Project
        </button>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>New Project</h2>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-slate-500 hover:text-slate-900'
              >
                Close
              </button>
            </div>
            <form onSubmit={createProject} className='space-y-4'>
              <div>
                <label htmlFor='projectName' className='block text-sm font-medium text-slate-700'>
                  Project Name
                </label>
                <input
                  id='projectName'
                  type='text'
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className='mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200'
                  placeholder='Enter project name'
                  required
                />
              </div>
              <div className='flex items-center justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='project p-4 border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100'
                >
                  New Project
                  <i className="ri-link ml-2"> </i>
                </button>
                <button
                  type='submit'
                  className='rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700'
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home;
