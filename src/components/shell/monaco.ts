/* eslint-disable @typescript-eslint/no-var-requires */
import { Monaco } from "@monaco-editor/react";
import { languages } from "monaco-editor";
import { addMongoShellCompletions } from "./mongo-shell-completion";


interface Intellisense {
    collections: string[];
    database?: string;
    disableTypeChecking?: boolean;
}

export async function mountMonaco(monaco: Monaco, intellisense: Intellisense): Promise<void> {

    const {
        collections: COLLECTIONS,
        database: DATABASE,
        disableTypeChecking = false
    } = intellisense;


    // Add all of @mongosh/shell-api's definitions along with a custom global.d.ts with editor globals.
    addMongoShellCompletions(monaco);

    // Compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types", "node_modules/@mongosh"],
    });

    // validation settings
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        onlyVisible: true,
        noSyntaxValidation: !disableTypeChecking,
    });

    // Completions
    monaco.languages.registerCompletionItemProvider('typescript', {
        triggerCharacters: ["."],
        provideCompletionItems: (model, position) => {
            const suggestions: languages.CompletionItem[] = [];

            const { word } = model.getWordUntilPosition(position);

            const currentLine = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            const DB_SUGGESTIONS: languages.CompletionItem[] = COLLECTIONS.map(coll => ({
                label: coll,
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: "Same as `Database.getCollection(" + coll + ")`",
                insertText: "getCollection('" + coll + "')",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            }));

            if ((/db\.(?!.)/i.test(currentLine))) {
                suggestions.push(...DB_SUGGESTIONS);
            }

            return {
                suggestions: suggestions
            }
        }
    });

}
