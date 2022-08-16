import { MyContext } from "../types/context";

enum WaitStates {
    Media,
    Title,
    Choose,
}

function setState(ctx: MyContext, state: WaitStates) {
    ctx.scene.session.waitFor = state;
}

function getState(ctx: MyContext, state: WaitStates): boolean {
    return ctx.scene.session.waitFor == state;
}

export { WaitStates, setState, getState };