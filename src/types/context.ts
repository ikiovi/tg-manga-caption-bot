import { Scenes, Context, NarrowedContext, Types } from 'telegraf'
import { WaitStates } from '../utils/waitStates'

interface MySceneSession extends Scenes.SceneSessionData {
    waitFor?: WaitStates
    files: string[]
    caption: string
    cached_id: number
    mediaType: 'photo' | 'document'
}

type PhotoContext = NarrowedContext<MyContext, Types.MountMap['photo']>;
type DocumentContext = NarrowedContext<MyContext, Types.MountMap['document']>;

interface MyContext extends Context {
    scene: Scenes.SceneContextScene<MyContext, MySceneSession>
}

export { MyContext, PhotoContext, DocumentContext }