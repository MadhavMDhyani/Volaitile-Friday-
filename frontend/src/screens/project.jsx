import { useLocation } from 'react-router-dom';

const Project = () => {
  const location = useLocation();

  console.log(location.state);

  return (
    <main className="h-screen w-screen flex">
      <section className="left h-full min-w-60 bg-red-300">
        <header className="flex justify-end p-2 px-4 w-full bg-slate-200" >
       <button
       className='p-2'
       >

       

       <i className="ri-group-line">
       </i>

       </button>



     </header>

      </section>
    </main>
  );
};

export default Project;
