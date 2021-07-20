import { Monaco } from "@monaco-editor/react";

export async function registerCompletions(monaco: Monaco) {

    console.log("Fetching completions");

    const res = await fetch("/mongoshell.d.ts");

    const libSource = await res.text();
    const libUri = 'mongoshell.d.ts';

    console.log("libsource", libSource);

    console.log("Registering completions");

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false
    });

    // compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        noLib: true
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);

    monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
}
