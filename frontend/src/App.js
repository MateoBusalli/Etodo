import { useState } from 'react';
import './App.css';

function App() {
  const [lists, setLists] = useState([]);
  const [nextId, setNextId] = useState(1);

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: list.title,
            description: list.description || '',
            user_id: 1,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: list.title,
            description: list.description || '',
            user_id: 1,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            list_id: savedListId,
            user_id: 1,
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

  const deleteList = (id) => {
    setLists(lists.filter(list => list.id !== id));
  };

  const deleteSubtask = (listId, subId) => {
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
      <div className="content">
        <header className="box_background_color greyblue-color">
          <h1 className="center white_font poppins-font">DoNext</h1>
        </header>

        <h2 className="center white_font poppins-font">Your Tasks</h2>
        <hr className="blue-color" />

        <div className="center">
          <button onClick={addList} className="add-task-btn">
            + Add List
          </button>
        </div>

        {lists.map((list) => (
          <div key={list.id} className="box_background_color white-color task-card inter-font">
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
              <div key={task.id} className="box_background_color white-color task-card  inter-font">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={task.title}
                  onChange={(e) => updateSubtask(list.id, task.id, 'title', e.target.value)}
                  className="task-title-input inter-font"
                />
                
                <textarea
                  placeholder="Task description..."
                  value={task.description}
                  onChange={(e) => updateSubtask(list.id, task.id, 'description', e.target.value)}
                  className="task-desc-input inter-font"
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
        <div className="center white_font box_background_color greyblue-color poppins-font">
          Made by Hugo & Matéo - Epitech 2025
        </div>
      </footer>
    </div>
  );
}

export default App;