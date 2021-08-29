import { Database } from "@mongosh/shell-api";

declare global {
    export const db: Database;
}
