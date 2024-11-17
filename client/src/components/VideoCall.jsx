import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../VideoCallTools/peer";
import { useSocket } from "../VideoCallTools/SocketProvider";
import { fileTypeFromBuffer } from "file-type";
let dataChannel;

const VideoCall = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });

    dataChannel = peer.peer.createDataChannel("file-transfer");

    peer.peer.addEventListener("datachannel", (ev) => {
      console.log("data channel is working!");
      dataChannel = ev.channel;
      dataChannel.send("hello peer");
    });

    const form = document.getElementById("file-transfer");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const file = document.getElementById("file").files[0];
      const fileBuffer = await file.arrayBuffer();

      dataChannel.send(fileBuffer);
      console.log("file sended ...");
    });

    dataChannel.addEventListener("message", async (ev) => {
      if (typeof ev.data == "object") {
        const a = document.createElement("a");
        const blob = new Blob([ev.data]);
        const obj = URL.createObjectURL(blob);

        console.log("file get ...");
        const mimeType = blob.type || "application/octet-stream";
        const fileData = await fileTypeFromBuffer(ev.data);
        const extension = fileData.ext;

        a.href = obj;
        a.download = `rec.${extension}`;
        a.click();
      }
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className="video-call-Container">
      <div className="file-transfer-area">
        <form id="file-transfer">
          <input className="file-transfer-input" id="file" type="file" />
          <label className="file-transfer-label" for="file">Upload File</label>
          <button className="file-transfer-btn">SEND</button>
        </form>
      </div>

      <div className="video-calling-area">
        <h4 className="connectedInfo">{remoteSocketId ? "Connected" : "No one in room"}</h4>

        <div className="User-Client-Video">
          <div className="video">
            {myStream && (
              <>
                <h4>My Stream</h4>
                <div className="video1">
                  <ReactPlayer
                    playing
                    muted
                    height="100px"
                    width="100px"
                    url={myStream}
                    />
                </div>
              </>
            )}
          </div>
          <div className="video">
            {remoteStream && (
              <>
                <h4>Remote Stream</h4>
                <div className="video1">
                  <ReactPlayer
                    playing
                    muted
                    height="100px"
                    width="100px"
                    url={remoteStream}
                    />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="Stream-call-btn">
        {myStream && <button onClick={sendStreams}>Send Stream</button>}
        {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
