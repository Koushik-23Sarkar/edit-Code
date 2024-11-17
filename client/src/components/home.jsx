import React, { useState ,useCallback} from 'react'
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';
import { useSocket } from "../VideoCallTools/SocketProvider";

export default function HomePage() {
    const navigate = useNavigate();
    const [roomId , setroomId] = useState('');
    const [userName , setuserName] = useState('');
    // const socket = useSocket();
    const createNewRoom = (e)=>{
        e.preventDefault(); // to stop refresh 
        const id = uuidV4();
        console.log(id);
        setroomId(id);

        toast.success('Created a new Room!');
    }

    // const handleSubmitForm = useCallback(
    //     (e) => {
    //       e.preventDefault();
    //       console.log("Call the User 1st time! "); 
    //       socket.emit("room:join", { userName, roomId });
    //     },
    //     [userName, roomId, socket]
    // );

    const joinRoom = ()=>{
        if(!roomId && !userName) {
            toast.error('ROOM ID and UserName is required!');
            return;
        }
        //redireact 
        navigate(`/editor/${roomId}`,{
            state: {
                userName,
            }
        });    
    };


  return (
    <div className='HomePageWapper'>
        <div className='formWrapper'>
            <div className='logo'><h2>Logo</h2></div>
            <div className='inputGroup'>
                <input type='text' onChange={(e)=>setroomId(e.target.value)} value={roomId} className='inputBox text-black' placeholder='Enter roomID'/>
                <input type='text' onChange={(e)=>setuserName(e.target.value)} value={userName} className='inputBox text-black' placeholder='Enter UserName'/>
                <button className='btn joinBtn' onClick={joinRoom}>JOIN</button>

                <span className='createInfo'>
                    If you don't have an invite then create &nbsp;
                    <a href='#' onClick={createNewRoom} className='createNewBtn'>
                        new room
                    </a>
                </span>
            </div>
        </div>
    </div>
  )
}
