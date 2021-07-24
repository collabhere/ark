declare global {
    interface Window {
        ark: {
            api: {
                ping: () => void;
            }
        }
    }
}

export { }