import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [authForm, setAuthForm] = useState({
    name: '',
    firstname: '',
    email: '',
    password: ''
  });

  const [lists, setLists] = useState([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
      loadUserLists(token);
    }
  }, []);

  const loadUserLists = async (token) => {
    try {
      const response = await fetch(`http://localhost:3001/api/lists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userLists = await response.json();
        setLists(userLists);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      try {
        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();

        setCurrentUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
        localStorage.setItem('token', data.token);

        setShowAuthPopup(false);
        loadUserLists(data.token);

        setAuthForm({ name: '', firstname: '', email: '', password: '' });
      } catch (error) {
        alert('Login error: ' + error.message);
      }
    } else {
      if (!authForm.name || !authForm.firstname || !authForm.email || !authForm.password) {
        alert('All fields are required for registration!');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }

        const data = await response.json();

        setCurrentUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
        localStorage.setItem('token', data.token);

        setShowAuthPopup(false);

        setAuthForm({ name: '', firstname: '', email: '', password: '' });
      } catch (error) {
        alert('Registration error: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setLists([]);
    setShowAuthPopup(true);
  };

  const addList = () => {
    const newList = {
      id: -nextId,
      title: '',
      description: '',
      subtasks: [],
      isSaved: false
    };
    setLists([...lists, newList]);
    setNextId(nextId + 1);
  };

  const addSubtask = (listId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        const newTask = {
          id: -nextId,
          title: '',
          description: '',
          isSaved: false
        };
        return {
          ...list,
          subtasks: [...list.subtasks, newTask]
        };
      }
      return list;
    }));
    setNextId(nextId + 1);
  };

  const updateList = (id, field, value) => {
    setLists(lists.map(list => {
      if (list.id === id) {
        return {
          ...list,
          [field]: value,
          isSaved: false
        };
      }
      return list;
    }));
  };

  const updateSubtask = (listId, subId, field, value) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          isSaved: false,
          subtasks: list.subtasks.map(task => {
            if (task.id === subId) {
              return {
                ...task,
                [field]: value,
                isSaved: false
              };
            }
            return task;
          })
        };
      }
      return list;
    }));
  };

  const saveListAndTasks = async (listId) => {
    const list = lists.find(l => l.id === listId);
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login first');
      setShowAuthPopup(true);
      return;
    }

    if (!list?.title.trim()) {
      alert('List title is required!');
      return;
    }

    for (const task of list.subtasks) {
      if (!task.title.trim()) {
        alert('All task titles are required!');
        return;
      }
      if (!task.description.trim()) {
        alert('All task descriptions are required!');
        return;
      }
    }

    try {
      let savedListId = listId;

      if (listId < 0) {
        const listResponse = await fetch('http://localhost:3001/api/lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: list.title,
            description: list.description || ''
          })
        });

        if (!listResponse.ok) {
          const error = await listResponse.json();
          throw new Error(error.message || 'Failed to save list');
        }

        const listData = await listResponse.json();
        savedListId = listData.id;
      } else {
        const listResponse = await fetch(`http://localhost:3001/api/lists/${listId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: list.title,
            description: list.description || ''
          })
        });

        if (!listResponse.ok) {
          const error = await listResponse.json();
          throw new Error(error.message || 'Failed to update list');
        }
      }

      const savedSubtasks = [];
      for (const task of list.subtasks) {
        const isNewTask = task.id < 0;
        const method = isNewTask ? 'POST' : 'PUT';
        const url = isNewTask
          ? 'http://localhost:3001/api/todos'
          : `http://localhost:3001/api/todos/${task.id}`;

        const taskResponse = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            list_id: savedListId,
            status: false
          })
        });

        if (!taskResponse.ok) {
          const error = await taskResponse.json();
          throw new Error(error.message || 'Failed to save task');
        }

        const taskData = await taskResponse.json();
        savedSubtasks.push({
          ...task,
          id: taskData.id,
          isSaved: true
        });
      }

      setLists(lists.map(l => {
        if (l.id === listId) {
          return {
            ...l,
            id: savedListId,
            isSaved: true,
            subtasks: savedSubtasks
          };
        }
        return l;
      }));

      alert('List and all tasks saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving: ' + error.message);
    }
  };

  const deleteList = async (id) => {
    const token = localStorage.getItem('token');

    if (id > 0 && token) {
      try {
        await fetch(`http://localhost:3001/api/lists/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
    setLists(lists.filter(list => list.id !== id));
  };

  const deleteSubtask = async (listId, subId) => {
    const token = localStorage.getItem('token');

    if (subId > 0 && token) {
      try {
        await fetch(`http://localhost:3001/api/todos/${subId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subtasks: list.subtasks.filter(task => task.id !== subId)
        };
      }
      return list;
    }));
  };

  return (
    <div className="app-wrapper">
      {showAuthPopup && (
        <div className="auth-overlay">
          <div className="auth-popup">
            <button onClick={() => setShowAuthPopup(false)} className="close-popup-btn">×</button>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleAuthSubmit}>
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="auth-input"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={authForm.firstname}
                    onChange={(e) => setAuthForm({ ...authForm, firstname: e.target.value })}
                    className="auth-input"
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="auth-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="auth-input"
              />
              <button type="submit" className="auth-btn">
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>
            <p className="auth-toggle">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Register' : 'Login'}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="content">
        <header className="box_background_color greyblue-color">
          <div className="header-content">
            <h1 className="center white_font">DoNext</h1>
            {currentUser ? (
              <div className="user-info">
                <span className="white_font">Welcome, {currentUser?.firstname || currentUser?.name}!</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <button onClick={() => setShowAuthPopup(true)} className="login-btn">Login</button>
            )}
          </div>
        </header>

        <h2 className="center white_font">Your Tasks</h2>
        <hr className="blue-color" />

        <div className="center">
          <button onClick={addList} className="add-task-btn">
            + Add List
          </button>
        </div>

        {lists.map((list) => (
          <div key={list.id} className="box_background_color white-color task-card">
            <input
              type="text"
              placeholder="List title..."
              value={list.title}
              onChange={(e) => updateList(list.id, 'title', e.target.value)}
              className="task-title-input"
            />

            <div className="center">
              <button
                onClick={() => saveListAndTasks(list.id)}
                className={`add-task-btn ${list.isSaved ? 'saved' : ''}`}
                style={{ marginRight: '10px' }}
              >
                {list.isSaved ? 'List & Tasks Saved' : 'Update List'}
              </button>

              <button
                onClick={() => addSubtask(list.id)}
                className="add-task-btn"
              >
                + Add Task
              </button>
            </div>

            {list.subtasks.map((task) => (
              <div key={task.id} className="box_background_color white-color task-card">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={task.title}
                  onChange={(e) => updateSubtask(list.id, task.id, 'title', e.target.value)}
                  className="task-title-input"
                />

                <textarea
                  placeholder="Task description..."
                  value={task.description}
                  onChange={(e) => updateSubtask(list.id, task.id, 'description', e.target.value)}
                  className="task-desc-input"
                />

                <div className="button-group">
                  <button
                    onClick={() => deleteSubtask(list.id, task.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => deleteList(list.id)}
              className="delete-btn"
            >
              Delete List
            </button>
          </div>
        ))}
      </div>

      <footer>
        <hr className="blue-color" />
        <div className="center white_font box_background_color greyblue-color">
          Made by Hugo & Matéo - Epitech 2025
        </div>
      </footer>
    </div>
  );
}

export default App;