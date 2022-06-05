declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            CHANNELS: string;
            [key: string]: string;
        }
    }
}

export { }