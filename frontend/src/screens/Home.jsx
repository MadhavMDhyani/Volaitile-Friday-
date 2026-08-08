import React, {useContext} from 'react'
import {Usercontext} from '../context/user.context'

const Home = () => {

  const {user} = useContext(UserContext)


  return (
    <div>{user}</div>
  )
}

export default Home