import { Scenes, Context, NarrowedContext, Types } from 'telegraf'

interface MySceneSession extends Scenes.SceneSessionData {
    waitFor: { [key: string]: boolean }
    files: string[]
    caption: string,
    isDocument: boolean
}

type PhotoContext = NarrowedContext<MyContext, Types.MountMap['photo']>;
type DocumentContext = NarrowedContext<MyContext, Types.MountMap['document']>;

interface MyContext extends Context {
    scene: Scenes.SceneContextScene<MyContext, MySceneSession>
}

export { MyContext, PhotoContext, DocumentContext }