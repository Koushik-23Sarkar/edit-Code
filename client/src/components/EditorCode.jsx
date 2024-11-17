import { useCallback, useEffect, useState, useRef } from "react";
import FileTree from "./tree";
import Terminal from "./terminal";
import Modal from "react-modal"; // Importing react-modal
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from '../Action';
import socketFileTerminal from "../socketFileTerminal";
Modal.setAppElement("#root");


const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openFiles, setOpenFiles] = useState([]);
  let isSaved = selectedFileContent === code;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const editorRef = useRef(null);
  const selectedPath = useRef("");
  const [displayTerminal, setDisplayTerminal] = useState(false);
  var pathValue;

  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    console.log("Get file tree working!");
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContents = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(
      `http://localhost:9000/files/content?path=${selectedFile}`
    );
    const result = await response.json();
    setSelectedFileContent(result.content);
    editorRef.current.setValue(result.content);
  }, [selectedFile]);


  useEffect(()=>{
    socketFileTerminal.on("other:file:change",({path,content})=>{
      console.log("other:file:change");
      console.log(selectedFile);
      console.log(path);
      console.log(content);

      if(selectedFile == path){
        editorRef.current.setValue(content);
      }
    })
  },[])


  useEffect(() => {
    getFileTree();
  }, []);

  useEffect(() => {
    setCode(selectedFileContent);
  }, [selectedFileContent]);

  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile]);

  useEffect(() => {
    socketFileTerminal.on("file:refresh", getFileTree);
    return () => {
      socketFileTerminal.off("file:refresh", getFileTree);
    };
  }, []);

  const handleFileSelect = (path) => {
    console.log(path);
    setSelectedFile(path);
    console.log(selectedFile);
    if (!openFiles.includes(path)) {
      setOpenFiles([...openFiles, path]);
    }
    console.log(typeof path);
    selectedPath.current = path;
    console.log(selectedPath.current);
    setSelectedFileContent("");
    setCode("");
    isSaved = true;
    // setIsCopied(false);
  };

  const handleCloseFile = (path) => {
    setOpenFiles(openFiles.filter((file) => file !== path));
    if (selectedFile === path) {
      setSelectedFile(openFiles[0] || "");
      setSelectedFileContent("");
      setCode("");
    //   setIsSaved(true);
    //   setIsCopied(false);
    }
  };

  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
    }
    init();
    editorRef.current.on("change", (instance, changes) => {
      //when i type in the editor it will call
      // console.log('changes',changes);
      console.log(selectedPath.current);
      const { origin } = changes;
      const code123 = instance.getValue();
      console.log(code123);
      onCodeChange(code123);
      if (origin !== "setValue") {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: code123 , path:selectedFile});
          console.log("sending data to the server!");
          console.log(selectedPath.current);
          socketFileTerminal.emit("file:change", {
            roomId,
            path: selectedPath.current,
            content: code123,
          });
      }
    });

    return () => {
    //   clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code , path }) => {
        console.log('code change data: ')
        console.log(path);
        console.log(code);
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]); //3.13.00



  const showTerminal = () => {
    setDisplayTerminal(!displayTerminal);
  };
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleDebugOpenModal = () => {
    setIsDebugModalOpen(true);
  };

  const handleDebugCloseModal = () => {
    setIsDebugModalOpen(false);
  };
  const handleCodeGenerated = (generatedCode) => {
    setCode(generatedCode);
  };

  return (
    <div className="flex h-screen bg-neutral-900 font-sans no-scrollbar">
      <div className="flex flex-col bg-neutral-800 text-white w-full">
        {/* <div className="p-1">
          {searchResults.length > 0 && (
            <h2 className="text-xl font-semibold mb-2 ml-4">Search Results</h2>
          )}
          <ul>
            {searchResults.map((result) => (
              <li
                key={result}
                onClick={() => handleFileSelect(`\\${result}`)}
                className="cursor-pointer hover:text-gray-400  ml-4"
              >
                {result}
              </li>
            ))}
          </ul>
        </div> */}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`${
              isSidebarOpen ? "block" : "hidden"
            } lg:block bg-neutral-900 text-white p-4 overflow-y-auto overflow-x-hidden w-72 border-r border-white transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-row">
                <span className="mt-1 mr-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    ></path>
                  </svg>
                </span>
                <span className="text-xl font-medium mt-[1px]">
                  File Explorer
                  <button className="mx-2 px-1 border-none border-white rounded-md text-lg text-black bg-[#2b824e] hover:border-2" onClick={showTerminal}>Terminal</button>
                </span>
              </div>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <FileTree
              onSelect={handleFileSelect}
              tree={fileTree}
              selectedFile={selectedFile} // Pass the selectedFile prop here
            />
          </div>
          <div className="displayTerminal"></div>
          <div className="flex-1 flex flex-col bg-neutral-800 overflow-auto no-scrollbar">
            <div className="editing-terminal-area">
              <div className="editing-area">
                {/* Tab Bar */}
                <div className="bg-neutral-900 text-white flex space-x-2 p-2">
                  {openFiles.map((file) => (
                    <div
                      key={file}
                      className={`flex items-center cursor-pointer p-2 rounded-t-md ${
                        selectedFile === file
                          ? "bg-[#145b30] text-white"
                          : "bg-neutral-900 hover:bg-neutral-700"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"></path>
                      </svg>
                      <span
                        onClick={() => handleFileSelect(file)}
                        className="mr-2"
                      >
                        {file.split("/").pop()}
                      </span>
                      <button
                        onClick={() => handleCloseFile(file)}
                        className="text-red-400 hover:text-red-600 focus:outline-none"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Code Editor */}
                <div className="flex-1 bg-neutral-800 p-2 relative overflow-auto">
                  {selectedFile && (
                    <p className="text-sm mb-2 text-gray-400">
                      {selectedFile.replaceAll("/", " > ")}
                    </p>
                  )}
                  <div className="writing-area">
                    <textarea id="realtimeEditor"></textarea>
                  </div>
                </div>
              </div>
              <div className="Terminal-area">
                {/* Terminal */}
                <div className="my-20"> </div>
                <div className="">
                  {displayTerminal && (
                    <div className="displayTerminalclass fixed bottom-0">
                      <Terminal />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
