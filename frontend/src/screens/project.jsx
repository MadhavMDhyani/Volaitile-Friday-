import { useLocation } from 'react-router-dom';

const Project = () => {
  const location = useLocation();

  console.log(location.state);

  return (
    <main className="h-screen w-screen flex">
      <section className="left flex flex-col h-full min-w-72  bg-slate-300">




        <header className="flex justify-end p-2 px-4 w-full bg-slate-100" >
       <button
       className='p-2 '
       >
       <i className="ri-group-line">
       </i>

       </button>



  
      </header>
     <div className="conversation-area flex-grow flex flex-col">
      <div className="message-box p-1 flex-grow flex flex-col gap-1">         
       <div className="message max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md ">
        <small
        className='opacity-65 text-xs'
        >exapmle@gmail.com</small>
        <p className='text-sm' >Lorem ipsum dolor sit amet.</p>
        </div> 

        <div className="ml-auto max-w-56 message flex flex-col p-2 bg-slate-50 w-fit rounded-md ">
        <small
        className='opacity-65 text-xs'
        >exapmle@gmail.com</small>
        <p className='text-sm' >Lorem ipsum dolor sit amet.</p>
        </div> 

        <div className="inputField w-full flex">
          <input
            className='p-2 px-4 border-none outline-none'
            type="text"
            placeholder='Enter message'
          />
          <button
            className='flex-grow px-3'>
            <i className="ri-send-ins-line"></i>
          </button>
        </div>
      </div>
    </div>

  </section>
</main>
  );
};

export default Project;
