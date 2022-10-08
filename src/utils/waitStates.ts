import { MyContext } from '../types/context';

enum WaitStates {
    Media,
    Title,
    Choose,
    Accept
}

function setState(ctx: MyContext, state: WaitStates) {
    ctx.scene.session.waitFor = state;
}

function checkStates(ctx: MyContext, ...states: WaitStates[]): boolean {
    return !!states.filter(s => ctx.scene.session.waitFor == s).length;

}

export { WaitStates, setState, checkStates };