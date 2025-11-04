import { useState } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [nextId, setNextId] = useState(1);

  const addTask = () => {
    const newTask = {
      id: nextId,
      title: '',
      description: ''
    };
    setTasks([...tasks, newTask]);
    setNextId(nextId + 1);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="app-wrapper">
      <div className="content">
        <header className="box_background_color greyblue-color">
          <h1 className="center white_font">DoNext</h1>
        </header>
        <h2 className="center white_font">Your Tasks</h2>
        <hr className="blue-color" />

        <div className="center">
          <button onClick={addTask} className="add-task-btn">+ Add Task</button>
        </div>

        {tasks.map((task) => (
          <div key={task.id} className="box_background_color white-color task-card">
            <input
              type="text"
              placeholder="Task title..."
              value={task.title}
              onChange={(e) => updateTask(task.id, 'title', e.target.value)}
              className="task-title-input"
            />
            <textarea
              placeholder="Task description..."
              value={task.description}
              onChange={(e) => updateTask(task.id, 'description', e.target.value)}
              className="task-desc-input"
            />
            <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button>
          </div>
        ))}
      </div>

      <footer>
        <hr className="blue-color" />
        <div className="center white_font box_background_color greyblue-color">test</div>
      </footer>
    </div>
  );
}

export default App;