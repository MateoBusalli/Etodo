// TODO: Check for any usage of date.isValid and ensure 'date' is a dayjs/moment object, or use a proper date validation method.
// TODO: Fix for 'date.isValid is not a function' error
// If you use date-fns, use isValid(date) from 'date-fns'.
// If you use dayjs or moment, ensure 'date' is a dayjs/moment object, not a string.
// Example fix for a function:
// import dayjs from 'dayjs';
// ...
// const isValid = (date) => dayjs(date).isValid();
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Button, Input, Card, Space, Modal, Form, Typography, Layout, Alert, Row, Col, Divider, Empty, DatePicker, Popconfirm, Dropdown, Menu } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, DeleteOutlined, LogoutOutlined, LoginOutlined, SaveOutlined, CheckCircleOutlined, CheckOutlined, LoadingOutlined, ExceptionOutlined, DownOutlined , SettingOutlined , UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Header, Content, Footer } = Layout;


function App() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', firstname: '', email: '', password: '' });


  const [lists, setLists] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [deletingListIds, setDeletingListIds] = useState([]);
  const [deletingTaskIds, setDeletingTaskIds] = useState([]);


  const [alertConfig, setAlertConfig] = useState(null);
  const [isAlertExiting, setIsAlertExiting] = useState(false);

  const showSettingsModal = () => {
  setIsSettingsModalOpen(true);
};

const handleSettingsCancel = () => {
  setIsSettingsModalOpen(false);
};

  const showAlert = (message, type = 'info') => {
    setAlertConfig({ message, type });
    setIsAlertExiting(false);
    setTimeout(() => {
      setIsAlertExiting(true);
      setTimeout(() => {
        setAlertConfig(null);
        setIsAlertExiting(false);
      }, 300);
    }, 4000);
  };

  const closeAlert = () => {
    setIsAlertExiting(true);
    setTimeout(() => {
      setAlertConfig(null);
      setIsAlertExiting(false);
    }, 300);
  };


  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.clear();
    setLists([]);
    setShowAuthPopup(true);
  }, []);


  const loadLists = useCallback(async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:3001/api/lists', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setLists(await response.json());
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    }
  }, [logout]);


  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
      loadLists(token);
    }
  }, [loadLists]);


  const submitAuth = async () => {
    const endpoint = isLogin ? 'login' : 'register';
    const body = isLogin
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    if (!isLogin && (!authForm.name || !authForm.firstname || !authForm.email || !authForm.password)) {
      showAlert('All fields are required for registration', 'error');
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
        throw new Error(error.message || `${endpoint} successfuly failed`);
      }

      const data = await response.json();
      const userData = data.data || data;

      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      setShowAuthPopup(false);
      setAuthForm({ name: '', firstname: '', email: '', password: '' });

      if (isLogin) {
        loadLists(userData.token);
      }
    } catch (error) {
      showAlert(`${endpoint} error: ${error.message}`, 'error');
    }
  };


  const createNewList = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      showAlert('Please login first', 'warning');
      setShowAuthPopup(true);
      return;
    }

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


  const createNewTask = (listId) => {
    const newTask = {
      id: -nextId,
      title: '',
      description: '',
      status: 0,
      isSaved: false
    };

    setLists(lists.map(list =>
      list.id === listId
        ? { ...list, subtasks: [...list.subtasks, newTask] }
        : list
    ));

    setNextId(nextId + 1);
  };


  const updateListField = (listId, fieldName, newValue) => {
    setLists(lists.map(list =>
      list.id === listId
        ? { ...list, [fieldName]: newValue, isSaved: false }
        : list
    ));
  };


  const updateTaskField = (listId, taskId, fieldName, newValue) => {
    setLists(lists.map(list =>
      list.id === listId
        ? {
          ...list,
          isSaved: false,
          subtasks: list.subtasks.map(task =>
            task.id === taskId
              ? { ...task, [fieldName]: newValue, isSaved: false }
              : task
          )
        }
        : list
    ));
  };


  const saveList = async (listId) => {
    const list = lists.find(l => l.id === listId);
    const token = localStorage.getItem('token');

    if (!token) {
      showAlert('Please login first', 'warning');
      setShowAuthPopup(true);
      return;
    }

    if (!list?.title.trim()) {
      showAlert('List title is required', 'error');
      return;
    }

    for (const task of list.subtasks) {
      if (!task.title.trim() || !task.description.trim()) {
        showAlert('All task titles and descriptions are required', 'error');
        return;
      }
    }

    try {
      const isNewList = listId < 0;
      const listEndpoint = isNewList
        ? 'http://127.0.0.1:3001/api/lists'
        : `http://127.0.0.1:3001/api/lists/${listId}`;

      const listResponse = await fetch(listEndpoint, {
        method: isNewList ? 'POST' : 'PUT',
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
        const errorData = await listResponse.json();
        throw new Error(errorData.message || 'Failed to save list');
      }

      const listData = await listResponse.json();
      const savedListId = isNewList ? listData.id : listId;

      const savedTasks = [];

        for (const task of list.subtasks) {
        const isNewTask = task.id < 0;
        const taskEndpoint = isNewTask
          ? 'http://127.0.0.1:3001/api/todos'
          : `http://127.0.0.1:3001/api/todos/${task.id}`;

        
        const taskResponse = await fetch(taskEndpoint, {
          method: isNewTask ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            list_id: savedListId,
            status: task.status !== undefined ? task.status : 0,
            deadline: task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD HH:mm:ss') : null
          })
        });

        if (!taskResponse.ok) {
          const errorData = await taskResponse.json();
          throw new Error(errorData.message || 'Failed to save task');
        }

        const taskData = await taskResponse.json();
        savedTasks.push({
          ...task,
          id: taskData.id,
          isSaved: true
        });
      }

      setLists(lists.map(l =>
        l.id === listId
          ? { ...l, id: savedListId, isSaved: true, subtasks: savedTasks }
          : l
      ));

      showAlert('List and all tasks saved successfully', 'success');
    } catch (error) {
      showAlert('Error saving: ' + error.message, 'error');
    }
  };


  const removeList = async (listId) => {
    setDeletingListIds([...deletingListIds, listId]);

    setTimeout(async () => {
      if (listId < 0) {
        setLists(lists.filter(l => l.id !== listId));
        setDeletingListIds(deletingListIds.filter(id => id !== listId));
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        showAlert('Please login first', 'warning');
        setShowAuthPopup(true);
        setDeletingListIds(deletingListIds.filter(id => id !== listId));
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:3001/api/lists/${listId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete list');
        }

        setLists(lists.filter(l => l.id !== listId));
        setDeletingListIds(deletingListIds.filter(id => id !== listId));
        showAlert('List deleted successfully', 'success');
      } catch (error) {
        showAlert('Error deleting: ' + error.message, 'error');
        setDeletingListIds(deletingListIds.filter(id => id !== listId));
      }
    }, 500);
  };
  
  const removeTask = async (listId, taskId) => {
    setDeletingTaskIds([...deletingTaskIds, taskId]);

    setTimeout(async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        showAlert('Please login first', 'warning');
        setShowAuthPopup(true);
        setDeletingTaskIds(deletingTaskIds.filter(id => id !== taskId));
        return;
      }

      if (taskId < 0) {
        setLists(prevLists => prevLists.map(l =>
          l.id === listId
            ? { ...l, subtasks: l.subtasks.filter(t => t.id !== taskId) }
            : l
        ));
        setDeletingTaskIds(deletingTaskIds.filter(id => id !== taskId));
        showAlert('Task removed', 'success');
        return;
      }

      try {
        const response = await fetch(`http://127.0.0.1:3001/api/todos/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete task');
        }

        setLists(prevLists => prevLists.map(l =>
          l.id === listId
            ? { ...l, subtasks: l.subtasks.filter(t => t.id !== taskId) }
            : l
        ));

        setDeletingTaskIds(deletingTaskIds.filter(id => id !== taskId));
        showAlert('Task deleted successfully', 'success');
      } catch (error) {
        showAlert('Error deleting: ' + error.message, 'error');
        setDeletingTaskIds(deletingTaskIds.filter(id => id !== taskId));
      }
    }, 500);
  };

  const authModalTitle = isLogin ? 'Login' : 'Register';
  const authSubmitButtonText = isLogin ? 'Login' : 'Register';
  const authToggleText = isLogin ? "Don't have an account? " : "Already have an account? ";
  const authToggleButtonText = isLogin ? 'Register' : 'Login';
  const userName = currentUser?.firstname || currentUser?.name;
  const getListButtonText = (list) => list.isSaved ? 'List & Tasks Saved' : 'Update List';

  const formatDateShort = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).slice(-2);
    const mn = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).slice(-2)
    return `${dd}-${mm}-${yy} ${hh}:${mn}:${ss}`;
  };

    const formatDatelists = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).slice(-2);
    const mn = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).slice(-2)
    return `${dd}-${mm}-${yy} ${hh}:${mn}:${ss}`;
  };

  return (
    <>
      <div className="animated-bg" />
      <Layout className="app-layout">
      {alertConfig && (
        <Alert
          message={alertConfig.message}
          type={alertConfig.type}
          closable
          onClose={closeAlert}
          className={`custom-alert-container ${isAlertExiting ? 'custom-alert-exit' : 'custom-alert'}`}
        />
      )}

      <Modal
        title={authModalTitle}
        open={showAuthPopup}
        onCancel={() => setShowAuthPopup(false)}
        footer={null}
      >
        <Form onFinish={submitAuth} layout="vertical">

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

          <Form.Item label="Email" style={{ color: '#ffffff' }} required>
            <Input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
          </Form.Item>

          <Form.Item label="Password" style={{ color: '#ffffff' }} required>
            <Input.Password
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </Form.Item>

          <Form.Item>
            <Button className="login-button" type="primary" htmlType="submit" block>
              {authSubmitButtonText}
            </Button>
          </Form.Item>

          <div className="auth-toggle">
            {authToggleText}
            <Button className='switch-button' type="link" onClick={() => setIsLogin(!isLogin)}>
              {authToggleButtonText}
            </Button>
          </div>
        </Form>
      </Modal>
           <Modal
        title=" ICE settings" 
        open={isSettingsModalOpen}
        onCancel={handleSettingsCancel}
        footer={[
          <Button key="back" onClick={handleSettingsCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSettingsCancel}>
            Save
          </Button>,
        ]}
      >
        <div style={{textAlign: 'center',marginBottom: '20px'}}>
        <img src='/iceberg.png' alt='iceberg' style = {{maxWidth: '100px',height: '40px',marginTop: '-70px',marginRight: '200px'}} >
        </img>
        </div>
        {<Button icon = {<UserOutlined />}>Profile</Button>}
      </Modal>
      <Header className="app-header">
        <Title level={2} className="app-title">
          ICEBERG
        </Title>

        {currentUser ? (
          <Space>
          <Button className = 'setting'  icon = {<SettingOutlined/>} onClick={showSettingsModal} >
          </Button>
            
            <Text className="white-font">
              Welcome, {userName}
            </Text>
            
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
              Logout
            </Button>
          </Space>
        ) : (
          <Button className='login-button' type="primary" icon={<LoginOutlined />} onClick={() => setShowAuthPopup(true)}>
            Login
          </Button>
        )}
      </Header>

      <Content className="app-content">
        <div className="page-header">
          <Title level={1} className="page-title">
            YOUR ICETASKS
          </Title>
          <Text className="page-subtitle">
            Organize your tasks with ease.
          </Text>
        </div>

        <div className="create-list-container">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewList}
            size="large"
            className="create-list-button"
          >
            Create New List
          </Button>
        </div>

        {lists.length === 0 ? (
          <Empty
            description={
              <span className="empty-description">
                No lists yet. Create your first list to get started.
              </span>
            }
            className="empty-state"
          />
        ) : (
          <Row gutter={[24, 24]}>
            {lists.map((list,index) => (
              <Col xs={24} lg={12} xl={8} key={list.id}>
                <Card
                  hoverable
                  className={`list-card ${deletingListIds.includes(list.id) ? 'card-disappear' : 'card-appear'}`}
                  bodyStyle={{ padding: 0 }}
                >
                  <div className="list-header">
                    <Space>
                     <Text strong className="task-number">
                        List #{index + 1} created at: {list.created_at ? formatDatelists(list.created_at) : '—'}
                      </Text>
                      </Space>
                    <Input
                      placeholder="Enter list title..."
                      value={list.title}
                      onChange={(e) => updateListField(list.id, 'title', e.target.value)}
                      variant="borderless"
                      className="list-title-input"
                    />
                  </div>

                  <div className="list-body">
                    <Space direction="vertical" size="middle" className="list-actions">
                      <Button
                        type="primary"
                        icon={list.isSaved ? <CheckCircleOutlined /> : <SaveOutlined />}
                        onClick={() => saveList(list.id)}
                        block
                        size="large"
                        className="ant-btn-update"
                      >
                        {getListButtonText(list)}
                      </Button>

                      <div className="list-buttons">
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => createNewTask(list.id)}
                        >
                          Add Task
                        </Button>
                        <Space>
                          <Popconfirm className='Popdelete'
                            title='Are you sure delete this List?'
                            okText='Yes'
                            cancelText="No"
                            onConfirm={() => removeList(list.id)}>
                            <Button
                              danger
                              icon={<DeleteOutlined />}

                            >
                              Delete List
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    </Space>

                    <Divider className="list-divider" />

                    {list.subtasks.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text className="task-empty-text">
                            No tasks yet
                          </Text>
                        }
                        className="task-empty-state"
                      />
                    ) : (
                      <Space direction="vertical" size="small" className="tasks-container">
                        {list.subtasks.map((task, index) => (
                          <Card
                            key={task.id}
                            size="small"
                            className={`task-card ${deletingTaskIds.includes(task.id) ? 'card-disappear' : 'card-appear'}`}
                          >
                            <Space direction="vertical" size="small" className="task-content">
                              <div className="task-header">
                                <Text strong className="task-number">
                                  Task #{index + 1} created at: {task.created_at ? formatDateShort(task.created_at) : '—'}
                                </Text>
                                <Popconfirm
                                  title='Are you sure delete this task?'
                                  okText='Yes'
                                  cancelText="No"
                                  onConfirm={() => removeTask(list.id, task.id)}
                                >
                                  <Button
                                    danger
                                    size="small"
                                    type="text"
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              </div>

                              <div className='deadline-wrapper'>
                                <DatePicker 
                                  className='deadline-picker' 
                                  showTime 
                                  placeholder="Select deadline"
                                  format="YYYY-MM-DD HH:mm"
                                  value={task.deadline ? dayjs(task.deadline) : null}
                                  onChange={(date) => updateTaskField(list.id, task.id, 'deadline', date ? date.toISOString() : null)}
                                />
                              </div>

                              <Input
                                placeholder="Task title..."
                                value={task.title}
                                onChange={(e) => updateTaskField(list.id, task.id, 'title', e.target.value)}
                                className="task-title-input"
                              />

                              <TextArea
                                placeholder="Task description..."
                                value={task.description}
                                onChange={(e) => updateTaskField(list.id, task.id, 'description', e.target.value)}
                                rows={3}
                                maxLength={300}
                              />
                              <br />
                              <div className="titanic-progress">
                                <div className="progress-header">
                                  <Text strong style={{ color: '#F1F1EC' }}>Task Status:</Text>
                                  <Dropdown
                                    style={{ color: '#F1F1EC' }}
                                    trigger={['click']}
                                    menu={{
                                      items: [
                                        {
                                          key: '0',
                                          label: 'To do',
                                          icon: <ExceptionOutlined />,
                                          onClick: () => { updateTaskField(list.id, task.id, 'status', 0); //showAlert('Task status updated to "To do"', 'success'); 
                                            }
                                        },
                                        {
                                          key: '1',
                                          label: 'In Progress',
                                          icon: <LoadingOutlined />,

                                          onClick: () => { updateTaskField(list.id, task.id, 'status', 1); //showAlert('Task status updated to "In Progress"', 'success'); 
                                            }
                                        },
                                        {
                                          key: '2',
                                          label: 'Finished',
                                          icon: <CheckOutlined />,
                                          onClick: () => { updateTaskField(list.id, task.id, 'status', 2); //showAlert('Task status updated to "Finished"', 'success'); 
                                            }
                                        },
                                      ],
                                    }}
                                  >
                                    <Button size="small" className="dropdown-status-button">
                                      {task.status === 0 ? <><ExceptionOutlined /> To do</> : task.status === 1 ? <><LoadingOutlined /> In Progress</> : <><CheckOutlined /> Finished</>}
                                      {' '}<DownOutlined />
                                    </Button>
                                  </Dropdown>
                                </div>
                                <div className={`progress-track ${task.status === 2 ? 'finished' : ''}`}>
                                  <div className="progress-fill" style={{ width: `${(task.status || 0) * 50}%` }}></div>
                                  <div className={`titanic-ship ${task.status === 2 ? 'sinking' : ''}`} style={{ left: `${(task.status || 0) * 50}%` }}>
                                    <img src="/titanic.png" alt="Titanic" className={task.status === 2 ? 'will-sink' : ''} />
                                    {task.status === 2 && <img src="/titanicsink.png" alt="Titanic Sinking" className="sunk-image" />}
                                  </div>
                                  <div className={`iceberg-end ${task.status === 2 ? 'hidden' : ''}`}>
                                    <img src="/iceberg.png" alt="Iceberg" />
                                  </div>
                                </div>
                                <div className="progress-labels">
                                  <span>To do</span>
                                  <span>In Progress</span>
                                  <span>Finished</span>
                                </div>
                              </div>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Made by Hugo & Matéo - Epitech 2025
      </Footer>
      </Layout>
    </>
  );
}

export default App;