// Terminal.jsx
import { Terminal as XTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import socketFileTerminal from "../socketFileTerminal";

import "@xterm/xterm/css/xterm.css";

const Terminal = () => {
  const terminalRef = useRef();
  const isRendered = useRef(false);

  useEffect(() => {
    if (isRendered.current) return;
    isRendered.current = true;

    const term = new XTerminal({
      rows: 20,
    });

    term.open(terminalRef.current);

    term.onData((data) => {
      socketFileTerminal.emit("terminal:write", data);
    });

    function onTerminalData(data) {
      term.write(data);
    }

    socketFileTerminal.on("terminal:data", onTerminalData);
  }, []);

  return (
    <div
      ref={terminalRef}
      id="terminal"
      className="bg-white rounded p-2 text-sm  w-[59.4vw]"
    />
  );
};

export default Terminal;
