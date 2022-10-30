import { Context, MiddlewareFn } from '../deps.ts';

export interface Service<C extends Context> {
    middleware(): MiddlewareFn<C>
}