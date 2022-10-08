declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string;
            CHANNELS: string;
            UPDATE_CD_MINUTES: number;
            PASSWORD: string;
        }
    }
}

export { };