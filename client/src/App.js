import logo from './logo.svg';
import './App.css';
import HomePage from './components/home';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Editor from './components/Editor';

function App() {
  return (
  <>
    <Toaster
    position='top-right'
    toastOptions={{
      success:{
        theme:{
          primary: '#4aed88',
        }
      }
    }}
    >
    </Toaster>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage/>}></Route>
        <Route path='/editor/:roomId' element={<Editor/>}></Route>
      </Routes>
    </BrowserRouter>
  </>
  );
}

export default App;
