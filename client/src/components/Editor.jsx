import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import EditorCode from "./EditorCode";
import { initSocket } from "../socket";
import ACTIONS from "../Action";
import {Navigate, useLocation, useNavigate, useParams} from 'react-router-dom';
import toast from 'react-hot-toast';
import VideoCall from "./VideoCall";
import { useSocket } from "../VideoCallTools/SocketProvider";

function Editor() {
  const socketRef = useRef(null); //useRef chnage hone par, component rerender nahi hota
  const codeRef = useRef('');
  const location = useLocation();
  const socket = useSocket();
  const reactNavigator = useNavigate();
  const {roomId} = useParams(); // useParams() returns a object which have all parameters in URL 
  const [client, setClient] = useState([]);

  useEffect(()=>{
    const init = async ()=>{
      socketRef.current = await initSocket();   //in here, we can use await because, in the socket.js file we write that function in an async.
      socketRef.current.on('connect_error',(err)=> handleErrors(err));
      socketRef.current.on('connect_failed',(err)=> handleErrors(err));

      function handleErrors(e){
        console.log('socket error', e);
         toast.error('Socket connnection failed, try again later.');
         reactNavigator('/');
      }
      
      socketRef.current.emit(ACTIONS.JOIN,{roomId,userName:location.state?.userName}) //we get that userName from `home.jsx`
      socket.emit('room:join',{ userName:location.state?.userName, roomId });


      //listening for joined event
      socketRef.current.on(ACTIONS.JOINED,({clients,userName,socketId})=>{
        if(userName !== location.state?.userName){
          toast.success(`${userName} joined the room.`);
          console.log(`${userName} joined`); 
        }

        setClient(clients);

        //-------------------important------------------------------
        socketRef.current.emit(ACTIONS.SYNC_CODE,{code:codeRef.current,socketId,});
      });

      // listening for disconnected

      socketRef.current.on(ACTIONS.DISCONNECTED,({socketId,userName})=>{
        toast.success(`${userName} left the room.`);
        setClient((prev)=>{
          return prev.filter((client)=> client.socketId !== socketId);   // disconnect ke baad list update
        })
      })
    };
    init();

    return ()=>{   //cleaning all the sockets
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  },[]);


  async function copyRoomId(){
    try {
      await navigator.clipboard.writeText(roomId); //To copy the roomId in the clipboard.
      toast.success("Room ID has been copied to your clipboard!");
    } catch (error) {
      toast.error("Could not copy room Id");
      console.error(error);
    }
  }

  function leaveRoom(){
    reactNavigator("/");
  }

  if(!location.state){
    return <Navigate to='/' />
  }

  return (
    <div className="mainWrap">
      <div className="editorWrap w-[78.4vw]">
        <EditorCode socketRef={socketRef} roomId={roomId} onCodeChange={(code)=>{codeRef.current = code;}}/>
      </div>
      <div className="aside z-2">
        <div className="open-close-aside">
          {/* Aside open close btn */}
        </div>
        <div className="asideInner">
          <h3>Connected</h3>
          <div className="ClientList">
            {client.map((client) => (
              <Client key={client.socketId} username={client.userName} />
            ))}
          </div>
          </div>

        <div className="video:Container">
            <VideoCall/>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>Copy room ID</button>
        <button className="btn bg-[#145b30]" onClick={leaveRoom}>Leave</button>
      </div>
    
    </div>
  );
}

export default Editor;
