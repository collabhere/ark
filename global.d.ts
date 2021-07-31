declare global {
    interface Window {
        ark: {
            [k: string]: {
                [k: string]: (...args: any) => Promise<any>;
            }
        }
    }
}

export { }