declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            CHANNELS: string;
        }
    }
}

export { }