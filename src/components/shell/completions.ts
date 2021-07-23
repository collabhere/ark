import { Monaco } from "@monaco-editor/react";
import { languages } from "monaco-editor";

interface Intellisense {
    collections: string[];
    database?: string;
}

export async function registerCompletions(monaco: Monaco, intellisense: Intellisense) {

    const {
        collections,
        database
    } = intellisense;

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
        // noLib: true
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);

    monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));

    monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ["."],
        provideCompletionItems: (model, position, context) => {
            const suggestions: languages.CompletionItem[] = [];

            const { word } = model.getWordUntilPosition(position);

            const code = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const allSegments = code.split("\n").map(line => line.replace(/\t/g, '').split(" "));
            const currentSegment = allSegments[allSegments.length - 1];

            console.log("Position -", position);
            console.log("Word -", word);
            console.log("Line -", code);
            console.log("All segments -", allSegments);
            console.log("Current segment -", currentSegment);

            const [command] = currentSegment;

            const DB_SUGGESTIONS: languages.CompletionItem[] = collections.map(coll => ({
                label: coll,
                kind: monaco.languages.CompletionItemKind.Class,
                documentation: "Collection from the database " + database,
                insertText: coll,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            }));

            if (command.startsWith("db.")) {
                suggestions.push(...DB_SUGGESTIONS);
            }

            return {
                suggestions: suggestions
            }
        }
    })
}
