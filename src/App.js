import './App.css';
import { Button, Container, Typography } from '@mui/material';

function App2() {
  return (
    <Container>
      <Typography variant="h1">My Website</Typography>
      <Typography variant="body1">Welcome!</Typography>
      <Button variant="contained" color="primary">
        Click Me
      </Button>
    </Container>
  );
}

export default App2;