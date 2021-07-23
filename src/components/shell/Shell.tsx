import { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { registerCompletions } from "./completions";

interface ShellProps {
  collections: string[];
}
export default function Shell(props: ShellProps) {

  const {
    collections
  } = props;

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      registerCompletions(monaco, { collections });
    }
  }, [collections, monaco]);

  return (
    <div>
      <Editor
        height="90vh"
        defaultValue="// Enter some code below"
        defaultLanguage="javascript"
      />
    </div>
  );
}
