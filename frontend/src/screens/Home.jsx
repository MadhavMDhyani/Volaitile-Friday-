import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"

const Home = () => {
  const { user } = useContext(UserContext)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [project, setproject] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/projects/all')
      setproject(res.data.projects || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (e) => {
    e.preventDefault()

    if (!projectName.trim()) {
      return
    }

    try {
      const res = await axios.post('/projects/create', {
        name: projectName.trim(),
      })

      console.log(res)
      setProjectName('')
      setIsModalOpen(false)
      fetchProjects()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <main className='p-4'>
      <div className='project'>
        <button
          type='button'
          onClick={() => setIsModalOpen(true)}
          className='px-4 py-3 bg-slate-800 text-white rounded-md border border-slate-300 hover:bg-slate-700 transition'
        >
          New Project
          <i className='ri-link ml-2'> </i>
        </button>

        {loading ? (
          <p className='mt-4 text-sm text-slate-600'>Loading projects...</p>
        ) : (
          project.map((projectItem) => (
      <div key={projectItem._id} 
            className='project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-mo'>
           <h2
            className='font-semibold'
            >{project.name}</h2>


            </div className ="flex gap-2">
            <i className="ri-user-line"></i>
            {project.users.length}

            </div>
        
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
                  className='border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md'
                >
                  Cancel
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
