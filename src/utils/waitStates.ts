import { MyContext } from "../interfaces/context";

enum WaitStates {
    Media,
    Title,
}

function setState(ctx: MyContext, state: WaitStates, only: boolean = true) {
    if (only) initStates(ctx);
    ctx.scene.session.waitFor[state] = true;
}

function clearState(ctx: MyContext, state: WaitStates) {
    delete ctx.scene.session.waitFor[state];
}

function getState(ctx: MyContext, state: WaitStates): boolean {
    return ctx.scene.session.waitFor[state];
}

function initStates(ctx: MyContext) {
    ctx.scene.session.waitFor = {};
}

export { WaitStates, setState, clearState, getState, initStates };