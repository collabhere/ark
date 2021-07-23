import React, { useCallback, useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import {KeyMod, KeyCode} from "monaco-editor";
import { Button } from "antd";
import { registerCompletions } from "./completions";

const DEFAULT_CODE = `// Mongo shell
db.getCollection('masteruserdetails').find({});
`;

interface ShellProps {
  collections: string[];
  onExecute?: (code: string) => void;
}
export default function Shell(props: ShellProps) {

  const {
    collections,
    onExecute
  } = props;

  const monaco = useMonaco();
  const [code, setCode] = useState(DEFAULT_CODE);

  useEffect(() => {
    if (monaco) {
      registerCompletions(monaco, { collections });
      // monaco.editor
    }
  }, [collections, monaco]);

  const exec = useCallback(() => onExecute && onExecute(code), [])

  return (
    <div>
      <Button type="primary" onClick={exec}>Run</Button>
      <Editor
        onMount={(editor, monaco) => {
          editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, exec);
        }}
        onChange={(value, ev) => {
          value && setCode(value);
        }}
        height="90vh"
        defaultValue={code}
        defaultLanguage="javascript"
      />
    </div>
  );
}
