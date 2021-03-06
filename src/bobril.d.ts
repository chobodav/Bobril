﻿declare var b: IBobrilStatic;

declare type IBobrilChild = boolean|string|IBobrilNode;
declare type IBobrilChildren = IBobrilChild|IBobrilChild[];
declare type IBobrilShimStyleMapping = { [name: string]: (style: any, value: any, oldName: string) => void };

interface IBobrilRoot {
    f: () => IBobrilChildren;
    e: HTMLElement;
    c: IBobrilCacheNode[];
}

declare type IBobrilRoots = { [id: string]: IBobrilRoot };

interface IBobrilStatic {
    // main function to specify factory function to update html body or element passed as parameter
    // this basicaly overwrite root with id "0"
    init(factory: () => IBobrilChildren, element?: HTMLElement): void;
    // recreate whole vdom in next frame, next invalidates before next frame are noop
    // you can pass just some ctx of some component and only that instance and its children will be rerendered
    invalidate(ctx?: Object): void;
    // When you need to know if next frame/update is already scheduled
    invalidated(): boolean;
    // Register new root and return its id
    addRoot(factory: () => IBobrilChildren, element?: HTMLElement): string;
    // Unregister root with specified id
    removeRoot(id: string): void;
    // Returns all information about all roots
    getRoots(): IBobrilRoots;

    // Low level method used just for testing
    createNode(n: IBobrilNode, parentNode: IBobrilNode): IBobrilCacheNode;
    // Low level method used just for testing
    updateNode(n: IBobrilNode, c: IBobrilCacheNode): IBobrilCacheNode;
    // Low level method used just for testing
    updateChildren(element: HTMLElement, newChildren: IBobrilChildren, cachedChildren: IBobrilChildren, parentNode: IBobrilNode): IBobrilCacheNode[];
    // Low level method used just for testing
    callPostCallbacks(): void;
    // Set update DOM attribute value callback, returns previous callback to allow chaining
    setSetValue(callback: (el: Element, node: IBobrilNode, newValue: any, oldValue: any) => void): (el: Element, node: IBobrilNode, newValue: any, oldValue: any) => void;
    // Register new style shim, look at bobril.styleshim.ts for examples
    setStyleShim(name: string, action: (style: any, value: any, oldName: string) => void): void;
    // Set callback after frame is done, returns previous callback to allow chaining
    setAfterFrame(callback: (root: IBobrilCacheNode[]) => void): (root: IBobrilCacheNode[]) => void;
    // shim for [].isArray
    isArray(a: any): boolean;
    // time in miliseconds from start only use from roots factory function
    uptime(): number;
    // shim for Date.now()
    now(): number;
    // returns actual number of redraws (partial or full)
    frame(): number;
    // returns duration of last update in ms
    lastFrameDuration(): number;
    // returns IE version 8 - 11, for other browsers returns undefined
    ieVersion(): number;
    // shalows copy all own members from source to target returns target, source could be null, target must be non-null 
    assign(target: Object, source: Object): Object;
    // shim for Event.preventDefault()
    preventDefault(event: Event): void;
    // this could be called only from component init and forces recreation of child nodes
    vmlNode(): void;
    // DOM to vdom stack resolver
    vdomPath(n: Node): IBobrilCacheNode[];
    // DOM to vdom leaf resolver
    deref(n: Node): IBobrilCacheNode;
    // adds native event to window or body, if name starts with '!' it is not native but internal event which could be emited by code by emitEvent function
    addEvent(name: string, priority: number, callback: (ev: any, target: Node, node: IBobrilCacheNode) => boolean): void;
    // emit internal event it should start with '!'
    emitEvent(name: string, ev: any, target: Node, node: IBobrilCacheNode): boolean;
    // bubble component event, returning true from event stops bubbling and returns true
    bubble(node: IBobrilCacheNode, name: string, param: any): boolean;
    // broadcast component event, returning true from event stops broadcast and returns true
    broadcast(node: IBobrilCacheNode, name: string, param: any): boolean;
    // merge components, methods will be called before already existing methods
    preEnhance(node: IBobrilNode, methods: IBobrilComponent): void;
    // merge components, methods will be called after already existing methods
    postEnhance(node: IBobrilNode, methods: IBobrilComponent): void;
    // clone IBobrilNode with attrs and attrs.style cloned deeply
    cloneNode(node: IBobrilNode): IBobrilNode;
}

interface IBobrilAttributes {
    id?: string;
    href?: string;
    value?: boolean|string|string[];
    tabIndex?: number;
    [name: string]: any;
}

interface IBobrilComponent {
    // if id of old node is different from new node it is considered completely different so init will be called before render directly
    // it does prevent calling render method twice on same node
    id?: string;
    // called before new node in vdom should be created, me members (tag, attrs, children) could be modified, ctx is initialized to { data: me.data||{}, me: me }
    init? (ctx: IBobrilCtx, me: IBobrilNode): void;
    // in case of update after shouldChange returns true, you can do any update/init tasks, ctx.data is updated to me.data and oldMe.component updated to me.component before calling this
    // in case of init this is called after init method, oldMe is equal to undefined in that case
    render? (ctx: IBobrilCtx, me: IBobrilNode, oldMe?: IBobrilCacheNode): void;
    // called after all children are rendered, but before updating own attrs
    // so this is useful for kind of layout in JS features
    postRender? (ctx: IBobrilCtx, me: IBobrilNode, oldMe?: IBobrilCacheNode): void;
    // return false when whole subtree should not be changed from last time, you can still update any me members except key, default implementation always return true
    shouldChange? (ctx: IBobrilCtx, me: IBobrilNode, oldMe: IBobrilCacheNode): boolean;
    // called from children to parents order for new nodes
    postInitDom? (ctx: IBobrilCtx, me: IBobrilCacheNode, element: HTMLElement): void;
    // called from children to parents order for updated nodes
    postUpdateDom? (ctx: IBobrilCtx, me: IBobrilCacheNode, element: HTMLElement): void;
    // called just before removing node from dom
    destroy? (ctx: IBobrilCtx, me: IBobrilNode, element: HTMLElement): void;
    // called when bubling event to parent so you could stop bubling without preventing default handling
    shouldStopBubble? (ctx: IBobrilCtx, name: string, param: Object): boolean;
    // called when broadcast wants to dive in this node so you could silence broadcast for you and your children
    shouldStopBroadcast? (ctx: IBobrilCtx, name: string, param: Object): boolean;
}

// new node should atleast have tag or component member
interface IBobrilNode {
    tag?: string;
    key?: string;
    className?: string;
    style?: any;
    attrs?: IBobrilAttributes;
    children?: IBobrilChildren;
    // set this for children to be set to their ctx.cfg, if undefined your own ctx.cfg will be used anyway
    cfg?: any;
    component?: IBobrilComponent;
    // Bobril does not touch this, it is completely for user passing custom data to component
    // It is very similar to props in ReactJs, it must be immutable, you have access to this through ctx.data
    data?: any;
}

interface IBobrilCacheNode extends IBobrilNode {
    element?: Node|Node[];
    parent?: IBobrilNode;
    // context which is something like state in React expect data member which is like props in React and me member which points back to IBobrilCacheNode
    ctx?: IBobrilCtx;
}

interface IBobrilCtx {
    // properties passed from parent component, treat it as immutable 
    data?: any;
    me?: IBobrilCacheNode;
    // properties passed from parent component automaticaly, but could be extended for children to IBobrilNode.cfg
    cfg?: any;
}
