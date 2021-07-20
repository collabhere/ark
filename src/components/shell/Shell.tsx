import { useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { registerCompletions } from "./completions";

interface ShellProps {}
export default function Shell(props: ShellProps) {
  const {} = props;
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      // monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      registerCompletions(monaco);
    }
  }, [monaco]);

  return (
    <div>
      <Editor
        height="90vh"
        defaultValue="db.getCollection('test').find({});"
        defaultLanguage="javascript"
      />
    </div>
  );
}
