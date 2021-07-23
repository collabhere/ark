import React, { useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { registerCompletions } from "./completions";

const DEFAULT_CODE = `// Mongo shell
db.getCollection('masteruserdetails').find({});
`;

interface ShellProps {
  collections: string[];
}
export default function Shell(props: ShellProps) {

  const {
    collections
  } = props;

  const monaco = useMonaco();
  const [code, setCode] = useState(DEFAULT_CODE);

  useEffect(() => {
    if (monaco) {
      registerCompletions(monaco, { collections });
    }
  }, [collections, monaco]);

  return (
    <div>
      <Editor
        height="90vh"
        defaultValue={code}
        defaultLanguage="javascript"
      />
    </div>
  );
}
