
import { MongoClient, ListDatabasesResult } from "mongodb";
import { Server } from "net";

export interface BrowseFS {
    type: "dir" | "file";
    title?: string;
    buttonLabel?: string;
}

export interface StoredScript {
    id: string;
    fullpath: string;
    fileName?: string;
    storedConnectionId?: string;
}

export interface ScriptSaveParams {
    id: string;
    code?: string;
}

export interface ScriptSaveActionData {
    action: "save";
    params: ScriptSaveParams;
}

export interface ScriptSaveAsActionData {
    action: "save_as";
    params: {
        saveLocation?: string;
        storedConnectionId?: string;
        fileName?: string;
        code?: string;
    } & Omit<ScriptSaveParams, "id">;
}

export interface ScriptDeleteActionData {
    action: "delete";
    params: { scriptId: string; };
}

export interface ScriptOpenActionData {
    action: "open";
    params: { storedConnectionId?: string; fileLocation?: string; };
}

export interface TitlebarActions {
    action: "close" | "maximize" | "minimize"
}

export type ScriptActionData =
    | ScriptOpenActionData
    | ScriptSaveActionData
    | ScriptSaveAsActionData
    | ScriptDeleteActionData;

export interface MemEntry {
    connection: MongoClient;
    databases: ListDatabasesResult["databases"];
    server?: Server;
}

export interface SettingsAction {
    action: 'save' | 'fetch';
    type: 'general';
    settings: Ark.Settings;
}