import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../config/axios';

const Project = () => {
  const location = useLocation();
  const project = location.state?.project || null;

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [availableUsers, setAvailableUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState(project?.users || []);


  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      console.log(Array.from(newSelectedUserId));
      return newSelectedUserId;
    });
  };

  function addCollaborators() {
    axios.post("/projects/add-user", {
      projectId: Array.from(selectedUserId)
    }).then(res => {
      
      console.log(res.data)
      setIsUserModalOpen(false)

  }).catch(err => {
    console.log(err)
  })

  }


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/users/all');
        const users = res.data.users || [];

        const existingUserIds = (project?.users || []).map((user) =>
          typeof user === 'string' ? user : user._id
        );

        setAvailableUsers(
          users.filter((user) => !existingUserIds.includes(String(user._id)))
        );
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (project) {
      fetchUsers();
    }
  }, [project]);

  const selectedUser = availableUsers.find((user) => selectedUserId.has(user._id)) || null;

  const handleSelectUser = async (userId) => {
    if (!project?._id) {
      setSelectedUserId(new Set([userId]));
      setIsUserModalOpen(false);
      return;
    }

    try {
      setSelectedUserId(new Set([userId]));
      await axios.put('/projects/add-user', {
        projectId: project._id,
        users: [userId],
      });

      const addedUser = availableUsers.find((user) => String(user._id) === String(userId));
      if (addedUser) {
        setProjectUsers((prev) => [...prev, addedUser]);
        setAvailableUsers((prev) => prev.filter((user) => String(user._id) !== String(userId)));
      }
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Failed to add collaborator:', error);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      <section className="relative flex h-full w-full flex-col bg-slate-300 md:w-[70%] lg:w-[75%]">
        <header className="flex w-full items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <i className="ri-add-large-line text-base"></i>
            <span>Add collaborator</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-200"
            aria-label="Toggle collaborators"
          >
            <i className="ri-group-line text-xl"></i>
          </button>
        </header>

        <div className="conversation-area flex flex-1 flex-col overflow-hidden">
          <div className="message-box flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="message flex max-w-[70%] flex-col rounded-2xl rounded-bl-md bg-slate-50 p-3 shadow-sm">
              <small className="text-xs text-slate-500">example@gmail.com</small>
              <p className="mt-1 text-sm">Lorem ipsum dolor sit amet.</p>
            </div>

            <div className="message ml-auto flex max-w-[70%] flex-col rounded-2xl rounded-br-md bg-slate-900 p-3 text-white shadow-sm">
              <small className="text-xs text-slate-300">example@gmail.com</small>
              <p className="mt-1 text-sm">Lorem ipsum dolor sit amet.</p>
            </div>
          </div>

          <div className="inputField flex items-center border-t border-slate-200 bg-slate-100 p-3">
            <input
              className="flex-1 rounded-l-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              type="text"
              placeholder="Enter message"
            />

            <button
              type="button"
              className="rounded-r-xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-700"
            >
              <i className="ri-send-plane-fill text-lg"></i>
            </button>
          </div>
        </div>

        <aside
          className={`absolute inset-y-0 left-0 z-20 flex w-full max-w-sm flex-col border-r border-slate-200 bg-slate-50 shadow-xl transition-transform duration-300 md:w-[320px] ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Collaborators</h2>
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(false)}
              className="rounded-full p-1 text-slate-600 hover:bg-slate-300"
              aria-label="Close collaborators panel"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </header>

          <div className="flex flex-col gap-3 p-4">
            {projectUsers.length > 0 ? (
              projectUsers.map((user) => {
                const userId = typeof user === 'string' ? user : user._id;
                const userName = typeof user === 'string' ? 'User' : user.email || 'User';

                return (
                  <div
                    key={userId}
                    onClick={() => setSelectedUserId(new Set([userId]))}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selectedUserId.has(userId)
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-slate-800">{userName}</h3>
                      <p className="truncate text-xs text-slate-500">{userName}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No collaborators yet.</p>
            )}
          </div>
        </aside>
      </section>

      {isUserModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 pb-20 shadow-2xl sm:p-6 sm:pb-20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Select collaborator</h2>
                <p className="text-sm text-slate-500">Choose a user to add to this project.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
              {selectedUser ? (
                <span>
                  Selected: <strong className="text-slate-800">{selectedUser.email}</strong> ({selectedUser._id})
                </span>
              ) : (
                <span>No user selected yet.</span>
              )}
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() => handleSelectUser(user._id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedUserId.has(user._id)
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
                      {user.email.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-800">{user.email}</h3>
                        {selectedUserId.has(user._id) && (
                          <span className="rounded-full bg-sky-500 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">User ID: {user._id}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">No users available to add.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 sm:left-6 sm:right-6"
            >
              Add collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
