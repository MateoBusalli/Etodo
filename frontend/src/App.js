import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Button, Input, Card, Space, Modal, Form, Typography, Layout } from 'antd';
import { PlusOutlined, DeleteOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Header, Content, Footer } = Layout;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', firstname: '', email: '', password: '' });
  const [lists, setLists] = useState([]);
  const [nextId, setNextId] = useState(1);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.clear();
    setLists([]);
    setShowAuthPopup(true);
  }, []);

  const loadUserLists = useCallback(async (token) => {
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setLists(await response.json());
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  }, [handleLogout]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
      loadUserLists(token);
    }
  }, [loadUserLists]);

  const handleAuthSubmit = async () => {
    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin 
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    if (!isLogin && (!authForm.name || !authForm.firstname || !authForm.email || !authForm.password)) {
      alert('All fields are required for registration');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `${endpoint} failed`);
      }

      const data = await response.json();
      const userData = data.data || data;

      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      setShowAuthPopup(false);
      setAuthForm({ name: '', firstname: '', email: '', password: '' });

      if (isLogin) loadUserLists(userData.token);
    } catch (error) {
      alert(`${endpoint} error: ${error.message}`);
    }
  };

  const addList = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      setShowAuthPopup(true);
      return;
    }
    setLists([...lists, { id: -nextId, title: '', description: '', subtasks: [], isSaved: false }]);
    setNextId(nextId + 1);
  };

  const addSubtask = (listId) => {
    setLists(lists.map(list => 
      list.id === listId 
        ? { ...list, subtasks: [...list.subtasks, { id: -nextId, title: '', description: '', isSaved: false }] }
        : list
    ));
    setNextId(nextId + 1);
  };

  const updateList = (id, field, value) => {
    setLists(lists.map(list => list.id === id ? { ...list, [field]: value, isSaved: false } : list));
  };

  const updateSubtask = (listId, subId, field, value) => {
    setLists(lists.map(list => 
      list.id === listId 
        ? { 
            ...list, 
            isSaved: false,
            subtasks: list.subtasks.map(task => 
              task.id === subId ? { ...task, [field]: value, isSaved: false } : task
            )
          }
        : list
    ));
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
      alert('List title is required');
      return;
    }

    for (const task of list.subtasks) {
      if (!task.title.trim() || !task.description.trim()) {
        alert('All task titles and descriptions are required');
        return;
      }
    }

    try {
      const isNewList = listId < 0;
      const listUrl = isNewList ? 'http://127.0.0.1:3001/api/lists' : `http://127.0.0.1:3001/api/lists/${listId}`;
      
      const listResponse = await fetch(listUrl, {
        method: isNewList ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: list.title, description: list.description || '' })
      });

      if (!listResponse.ok) {
        throw new Error((await listResponse.json()).message || 'Failed to save list');
      }

      const savedListId = isNewList ? (await listResponse.json()).id : listId;

      const savedSubtasks = [];
      for (const task of list.subtasks) {
        const isNewTask = task.id < 0;
        const taskUrl = isNewTask ? 'http://127.0.0.1:3001/api/todos' : `http://127.0.0.1:3001/api/todos/${task.id}`;

        const taskResponse = await fetch(taskUrl, {
          method: isNewTask ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ title: task.title, description: task.description, list_id: savedListId, status: false })
        });

        if (!taskResponse.ok) {
          throw new Error((await taskResponse.json()).message || 'Failed to save task');
        }

        savedSubtasks.push({ ...task, id: (await taskResponse.json()).id, isSaved: true });
      }

      setLists(lists.map(l => 
        l.id === listId ? { ...l, id: savedListId, isSaved: true, subtasks: savedSubtasks } : l
      ));

      alert('List and all tasks saved successfully');
    } catch (error) {
      alert('Error saving: ' + error.message);
    }
  };

  const deleteList = async (listId) => {
    if (listId < 0) {
      setLists(lists.filter(l => l.id !== listId));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      setShowAuthPopup(true);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete list');

      setLists(lists.filter(l => l.id !== listId));
      alert('List deleted successfully');
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  const deleteSubtask = async (listId, taskId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      setShowAuthPopup(true);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:3001/api/todos/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete task');

      setLists(lists.map(l => 
        l.id === listId ? { ...l, subtasks: l.subtasks.filter(t => t.id !== taskId) } : l
      ));
      alert('Task deleted successfully');
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  const authModalTitle = isLogin ? 'Login' : 'Register';
  const submitButtonText = isLogin ? 'Login' : 'Register';
  const toggleText = isLogin ? "Don't have an account? " : "Already have an account? ";
  const toggleButtonText = isLogin ? 'Register' : 'Login';

  const user = currentUser?.firstname || currentUser?.name;
  const saveButtonType = list => list.isSaved ? 'default' : 'primary';
  const saveButtonText = list => list.isSaved ? 'List & Tasks Saved' : 'Update List';

  return (
    <Layout style={{ minHeight: '100vh' }}>

      <Modal
        title={authModalTitle}
        open={showAuthPopup}
        onCancel={() => setShowAuthPopup(false)}
        footer={null}
      >
        <Form onFinish={handleAuthSubmit} layout="vertical">

          {!isLogin && (
            <>
              <Form.Item label="Username" required>
                <Input
                  placeholder="Username"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </Form.Item>

              <Form.Item label="First Name" required>
                <Input
                  placeholder="First Name"
                  value={authForm.firstname}
                  onChange={(e) => setAuthForm({ ...authForm, firstname: e.target.value })}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="Email" required>
            <Input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
          </Form.Item>

          <Form.Item label="Password" required>
            <Input.Password
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {submitButtonText}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            {toggleText}
            <Button type="link" onClick={() => setIsLogin(!isLogin)}>
              {toggleButtonText}
            </Button>
          </div>
        </Form>
      </Modal>

      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ color: 'white', margin: 0, fontFamily: 'Orbitron' }}>
          ICEBERG
        </Title>

        {currentUser ? (
          <Space>
            <Text style={{ color: 'white' }}>
              Welcome, {user}
            </Text>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        ) : (
          <Button type="primary" icon={<LoginOutlined />} onClick={() => setShowAuthPopup(true)}>
            Login
          </Button>
        )}
      </Header>

      <Content style={{ padding: '50px' }}>
        <Title level={2} style={{ textAlign: 'center', color: 'white' }}>
          YOUR ICETASKS
        </Title>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={addList} size="large">
            Add List
          </Button>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {lists.map((list) => {
            const listTitleInput = (
              <Input
                placeholder="List title"
                value={list.title}
                onChange={(e) => updateList(list.id, 'title', e.target.value)}
                variant="borderless"
                style={{ fontSize: '16px', fontWeight: 'bold' }}
              />
            );

            const listButtons = (
              <Space>
                <Button
                  className="ant-btn-update"
                  onClick={() => saveListAndTasks(list.id)}>
                  {saveButtonText(list)}
                </Button>
                <Button icon={<PlusOutlined />} onClick={() => addSubtask(list.id)}>
                  Add Task
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => deleteList(list.id)}>
                  Delete List
                </Button>
              </Space>
            );

            return (
              <Card key={list.id} title={listTitleInput} extra={listButtons}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {list.subtasks.map((task) => (
                    <Card key={task.id} type="inner" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                          placeholder="Task title..."
                          value={task.title}
                          onChange={(e) => updateSubtask(list.id, task.id, 'title', e.target.value)}
                        />
                        <TextArea
                          placeholder="Task description..."
                          value={task.description}
                          onChange={(e) => updateSubtask(list.id, task.id, 'description', e.target.value)}
                          rows={3}
                        />
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteSubtask(list.id, task.id)}
                        >
                          Delete
                        </Button>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>
            );
          })}
        </Space>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        Made by Hugo & Matéo - Epitech 2025
      </Footer>
    </Layout>
  );
}

export default App;