
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class ClientResponseError extends Error{constructor(e){super("ClientResponseError"),this.url="",this.status=0,this.response={},this.isAbort=!1,this.originalError=null,Object.setPrototypeOf(this,ClientResponseError.prototype),null!==e&&"object"==typeof e&&(this.url="string"==typeof e.url?e.url:"",this.status="number"==typeof e.status?e.status:0,this.isAbort=!!e.isAbort,this.originalError=e.originalError,null!==e.response&&"object"==typeof e.response?this.response=e.response:null!==e.data&&"object"==typeof e.data?this.response=e.data:this.response={}),this.originalError||e instanceof ClientResponseError||(this.originalError=e),"undefined"!=typeof DOMException&&e instanceof DOMException&&(this.isAbort=!0),this.name="ClientResponseError "+this.status,this.message=this.response?.message,this.message||(this.isAbort?this.message="The request was autocancelled. You can find more info in https://github.com/pocketbase/js-sdk#auto-cancellation.":this.originalError?.cause?.message?.includes("ECONNREFUSED ::1")?this.message="Failed to connect to the PocketBase server. Try changing the SDK URL from localhost to 127.0.0.1 (https://github.com/pocketbase/js-sdk/issues/21).":this.message="Something went wrong while processing your request.");}get data(){return this.response}toJSON(){return {...this}}}const e=/^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;function cookieParse(e,t){const s={};if("string"!=typeof e)return s;const i=Object.assign({},t||{}).decode||defaultDecode;let n=0;for(;n<e.length;){const t=e.indexOf("=",n);if(-1===t)break;let r=e.indexOf(";",n);if(-1===r)r=e.length;else if(r<t){n=e.lastIndexOf(";",t-1)+1;continue}const o=e.slice(n,t).trim();if(void 0===s[o]){let n=e.slice(t+1,r).trim();34===n.charCodeAt(0)&&(n=n.slice(1,-1));try{s[o]=i(n);}catch(e){s[o]=n;}}n=r+1;}return s}function cookieSerialize(t,s,i){const n=Object.assign({},i||{}),r=n.encode||defaultEncode;if(!e.test(t))throw new TypeError("argument name is invalid");const o=r(s);if(o&&!e.test(o))throw new TypeError("argument val is invalid");let a=t+"="+o;if(null!=n.maxAge){const e=n.maxAge-0;if(isNaN(e)||!isFinite(e))throw new TypeError("option maxAge is invalid");a+="; Max-Age="+Math.floor(e);}if(n.domain){if(!e.test(n.domain))throw new TypeError("option domain is invalid");a+="; Domain="+n.domain;}if(n.path){if(!e.test(n.path))throw new TypeError("option path is invalid");a+="; Path="+n.path;}if(n.expires){if(!function isDate(e){return "[object Date]"===Object.prototype.toString.call(e)||e instanceof Date}(n.expires)||isNaN(n.expires.valueOf()))throw new TypeError("option expires is invalid");a+="; Expires="+n.expires.toUTCString();}if(n.httpOnly&&(a+="; HttpOnly"),n.secure&&(a+="; Secure"),n.priority){switch("string"==typeof n.priority?n.priority.toLowerCase():n.priority){case"low":a+="; Priority=Low";break;case"medium":a+="; Priority=Medium";break;case"high":a+="; Priority=High";break;default:throw new TypeError("option priority is invalid")}}if(n.sameSite){switch("string"==typeof n.sameSite?n.sameSite.toLowerCase():n.sameSite){case!0:a+="; SameSite=Strict";break;case"lax":a+="; SameSite=Lax";break;case"strict":a+="; SameSite=Strict";break;case"none":a+="; SameSite=None";break;default:throw new TypeError("option sameSite is invalid")}}return a}function defaultDecode(e){return -1!==e.indexOf("%")?decodeURIComponent(e):e}function defaultEncode(e){return encodeURIComponent(e)}let t;function getTokenPayload(e){if(e)try{const s=decodeURIComponent(t(e.split(".")[1]).split("").map((function(e){return "%"+("00"+e.charCodeAt(0).toString(16)).slice(-2)})).join(""));return JSON.parse(s)||{}}catch(e){}return {}}function isTokenExpired(e,t=0){let s=getTokenPayload(e);return !(Object.keys(s).length>0&&(!s.exp||s.exp-t>Date.now()/1e3))}t="function"==typeof atob?atob:e=>{let t=String(e).replace(/=+$/,"");if(t.length%4==1)throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");for(var s,i,n=0,r=0,o="";i=t.charAt(r++);~i&&(s=n%4?64*s+i:i,n++%4)?o+=String.fromCharCode(255&s>>(-2*n&6)):0)i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(i);return o};const s="pb_auth";class BaseAuthStore{constructor(){this.baseToken="",this.baseModel=null,this._onChangeCallbacks=[];}get token(){return this.baseToken}get model(){return this.baseModel}get isValid(){return !isTokenExpired(this.token)}get isAdmin(){return "admin"===getTokenPayload(this.token).type}get isAuthRecord(){return "authRecord"===getTokenPayload(this.token).type}save(e,t){this.baseToken=e||"",this.baseModel=t||null,this.triggerChange();}clear(){this.baseToken="",this.baseModel=null,this.triggerChange();}loadFromCookie(e,t=s){const i=cookieParse(e||"")[t]||"";let n={};try{n=JSON.parse(i),(null===typeof n||"object"!=typeof n||Array.isArray(n))&&(n={});}catch(e){}this.save(n.token||"",n.model||null);}exportToCookie(e,t=s){const i={secure:!0,sameSite:!0,httpOnly:!0,path:"/"},n=getTokenPayload(this.token);i.expires=n?.exp?new Date(1e3*n.exp):new Date("1970-01-01"),e=Object.assign({},i,e);const r={token:this.token,model:this.model?JSON.parse(JSON.stringify(this.model)):null};let o=cookieSerialize(t,JSON.stringify(r),e);const a="undefined"!=typeof Blob?new Blob([o]).size:o.length;if(r.model&&a>4096){r.model={id:r?.model?.id,email:r?.model?.email};const s=["collectionId","username","verified"];for(const e in this.model)s.includes(e)&&(r.model[e]=this.model[e]);o=cookieSerialize(t,JSON.stringify(r),e);}return o}onChange(e,t=!1){return this._onChangeCallbacks.push(e),t&&e(this.token,this.model),()=>{for(let t=this._onChangeCallbacks.length-1;t>=0;t--)if(this._onChangeCallbacks[t]==e)return delete this._onChangeCallbacks[t],void this._onChangeCallbacks.splice(t,1)}}triggerChange(){for(const e of this._onChangeCallbacks)e&&e(this.token,this.model);}}class LocalAuthStore extends BaseAuthStore{constructor(e="pocketbase_auth"){super(),this.storageFallback={},this.storageKey=e,this._bindStorageEvent();}get token(){return (this._storageGet(this.storageKey)||{}).token||""}get model(){return (this._storageGet(this.storageKey)||{}).model||null}save(e,t){this._storageSet(this.storageKey,{token:e,model:t}),super.save(e,t);}clear(){this._storageRemove(this.storageKey),super.clear();}_storageGet(e){if("undefined"!=typeof window&&window?.localStorage){const t=window.localStorage.getItem(e)||"";try{return JSON.parse(t)}catch(e){return t}}return this.storageFallback[e]}_storageSet(e,t){if("undefined"!=typeof window&&window?.localStorage){let s=t;"string"!=typeof t&&(s=JSON.stringify(t)),window.localStorage.setItem(e,s);}else this.storageFallback[e]=t;}_storageRemove(e){"undefined"!=typeof window&&window?.localStorage&&window.localStorage?.removeItem(e),delete this.storageFallback[e];}_bindStorageEvent(){"undefined"!=typeof window&&window?.localStorage&&window.addEventListener&&window.addEventListener("storage",(e=>{if(e.key!=this.storageKey)return;const t=this._storageGet(this.storageKey)||{};super.save(t.token||"",t.model||null);}));}}class BaseService{constructor(e){this.client=e;}}class SettingsService extends BaseService{async getAll(e){return e=Object.assign({method:"GET"},e),this.client.send("/api/settings",e)}async update(e,t){return t=Object.assign({method:"PATCH",body:e},t),this.client.send("/api/settings",t)}async testS3(e="storage",t){return t=Object.assign({method:"POST",body:{filesystem:e}},t),this.client.send("/api/settings/test/s3",t).then((()=>!0))}async testEmail(e,t,s){return s=Object.assign({method:"POST",body:{email:e,template:t}},s),this.client.send("/api/settings/test/email",s).then((()=>!0))}async generateAppleClientSecret(e,t,s,i,n,r){return r=Object.assign({method:"POST",body:{clientId:e,teamId:t,keyId:s,privateKey:i,duration:n}},r),this.client.send("/api/settings/apple/generate-client-secret",r)}}class CrudService extends BaseService{decode(e){return e}async getFullList(e,t){if("number"==typeof e)return this._getFullList(e,t);let s=500;return (t=Object.assign({},e,t)).batch&&(s=t.batch,delete t.batch),this._getFullList(s,t)}async getList(e=1,t=30,s){return (s=Object.assign({method:"GET"},s)).query=Object.assign({page:e,perPage:t},s.query),this.client.send(this.baseCrudPath,s).then((e=>(e.items=e.items?.map((e=>this.decode(e)))||[],e)))}async getFirstListItem(e,t){return (t=Object.assign({requestKey:"one_by_filter_"+this.baseCrudPath+"_"+e},t)).query=Object.assign({filter:e,skipTotal:1},t.query),this.getList(1,1,t).then((e=>{if(!e?.items?.length)throw new ClientResponseError({status:404,response:{code:404,message:"The requested resource wasn't found.",data:{}}});return e.items[0]}))}async getOne(e,t){if(!e)throw new ClientResponseError({url:this.client.buildUrl(this.baseCrudPath+"/"),status:404,response:{code:404,message:"Missing required record id.",data:{}}});return t=Object.assign({method:"GET"},t),this.client.send(this.baseCrudPath+"/"+encodeURIComponent(e),t).then((e=>this.decode(e)))}async create(e,t){return t=Object.assign({method:"POST",body:e},t),this.client.send(this.baseCrudPath,t).then((e=>this.decode(e)))}async update(e,t,s){return s=Object.assign({method:"PATCH",body:t},s),this.client.send(this.baseCrudPath+"/"+encodeURIComponent(e),s).then((e=>this.decode(e)))}async delete(e,t){return t=Object.assign({method:"DELETE"},t),this.client.send(this.baseCrudPath+"/"+encodeURIComponent(e),t).then((()=>!0))}_getFullList(e=500,t){(t=t||{}).query=Object.assign({skipTotal:1},t.query);let s=[],request=async i=>this.getList(i,e||500,t).then((e=>{const t=e.items;return s=s.concat(t),t.length==e.perPage?request(i+1):s}));return request(1)}}function normalizeLegacyOptionsArgs(e,t,s,i){const n=void 0!==i;return n||void 0!==s?n?(console.warn(e),t.body=Object.assign({},t.body,s),t.query=Object.assign({},t.query,i),t):Object.assign(t,s):t}function resetAutoRefresh(e){e._resetAutoRefresh?.();}class AdminService extends CrudService{get baseCrudPath(){return "/api/admins"}async update(e,t,s){return super.update(e,t,s).then((e=>(this.client.authStore.model?.id===e.id&&void 0===this.client.authStore.model?.collectionId&&this.client.authStore.save(this.client.authStore.token,e),e)))}async delete(e,t){return super.delete(e,t).then((t=>(t&&this.client.authStore.model?.id===e&&void 0===this.client.authStore.model?.collectionId&&this.client.authStore.clear(),t)))}authResponse(e){const t=this.decode(e?.admin||{});return e?.token&&e?.admin&&this.client.authStore.save(e.token,t),Object.assign({},e,{token:e?.token||"",admin:t})}async authWithPassword(e,t,s,i){let n={method:"POST",body:{identity:e,password:t}};n=normalizeLegacyOptionsArgs("This form of authWithPassword(email, pass, body?, query?) is deprecated. Consider replacing it with authWithPassword(email, pass, options?).",n,s,i);const r=n.autoRefreshThreshold;delete n.autoRefreshThreshold,n.autoRefresh||resetAutoRefresh(this.client);let o=await this.client.send(this.baseCrudPath+"/auth-with-password",n);return o=this.authResponse(o),r&&function registerAutoRefresh(e,t,s,i){resetAutoRefresh(e);const n=e.beforeSend,r=e.authStore.model,o=e.authStore.onChange(((t,s)=>{(!t||s?.id!=r?.id||(s?.collectionId||r?.collectionId)&&s?.collectionId!=r?.collectionId)&&resetAutoRefresh(e);}));e._resetAutoRefresh=function(){o(),e.beforeSend=n,delete e._resetAutoRefresh;},e.beforeSend=async(r,o)=>{const a=e.authStore.token;if(o.query?.autoRefresh)return n?n(r,o):{url:r,sendOptions:o};let c=e.authStore.isValid;if(c&&isTokenExpired(e.authStore.token,t))try{await s();}catch(e){c=!1;}c||await i();const l=o.headers||{};for(let t in l)if("authorization"==t.toLowerCase()&&a==l[t]&&e.authStore.token){l[t]=e.authStore.token;break}return o.headers=l,n?n(r,o):{url:r,sendOptions:o}};}(this.client,r,(()=>this.authRefresh({autoRefresh:!0})),(()=>this.authWithPassword(e,t,Object.assign({autoRefresh:!0},n)))),o}async authRefresh(e,t){let s={method:"POST"};return s=normalizeLegacyOptionsArgs("This form of authRefresh(body?, query?) is deprecated. Consider replacing it with authRefresh(options?).",s,e,t),this.client.send(this.baseCrudPath+"/auth-refresh",s).then(this.authResponse.bind(this))}async requestPasswordReset(e,t,s){let i={method:"POST",body:{email:e}};return i=normalizeLegacyOptionsArgs("This form of requestPasswordReset(email, body?, query?) is deprecated. Consider replacing it with requestPasswordReset(email, options?).",i,t,s),this.client.send(this.baseCrudPath+"/request-password-reset",i).then((()=>!0))}async confirmPasswordReset(e,t,s,i,n){let r={method:"POST",body:{token:e,password:t,passwordConfirm:s}};return r=normalizeLegacyOptionsArgs("This form of confirmPasswordReset(resetToken, password, passwordConfirm, body?, query?) is deprecated. Consider replacing it with confirmPasswordReset(resetToken, password, passwordConfirm, options?).",r,i,n),this.client.send(this.baseCrudPath+"/confirm-password-reset",r).then((()=>!0))}}const i=["requestKey","$cancelKey","$autoCancel","fetch","headers","body","query","params","cache","credentials","headers","integrity","keepalive","method","mode","redirect","referrer","referrerPolicy","signal","window"];function normalizeUnknownQueryParams(e){if(e){e.query=e.query||{};for(let t in e)i.includes(t)||(e.query[t]=e[t],delete e[t]);}}class RealtimeService extends BaseService{constructor(){super(...arguments),this.clientId="",this.eventSource=null,this.subscriptions={},this.lastSentSubscriptions=[],this.maxConnectTimeout=15e3,this.reconnectAttempts=0,this.maxReconnectAttempts=1/0,this.predefinedReconnectIntervals=[200,300,500,1e3,1200,1500,2e3],this.pendingConnects=[];}get isConnected(){return !!this.eventSource&&!!this.clientId&&!this.pendingConnects.length}async subscribe(e,t,s){if(!e)throw new Error("topic must be set.");let i=e;if(s){normalizeUnknownQueryParams(s);const e="options="+encodeURIComponent(JSON.stringify({query:s.query,headers:s.headers}));i+=(i.includes("?")?"&":"?")+e;}const listener=function(e){const s=e;let i;try{i=JSON.parse(s?.data);}catch{}t(i||{});};return this.subscriptions[i]||(this.subscriptions[i]=[]),this.subscriptions[i].push(listener),this.isConnected?1===this.subscriptions[i].length?await this.submitSubscriptions():this.eventSource?.addEventListener(i,listener):await this.connect(),async()=>this.unsubscribeByTopicAndListener(e,listener)}async unsubscribe(e){let t=!1;if(e){const s=this.getSubscriptionsByTopic(e);for(let e in s)if(this.hasSubscriptionListeners(e)){for(let t of this.subscriptions[e])this.eventSource?.removeEventListener(e,t);delete this.subscriptions[e],t||(t=!0);}}else this.subscriptions={};this.hasSubscriptionListeners()?t&&await this.submitSubscriptions():this.disconnect();}async unsubscribeByPrefix(e){let t=!1;for(let s in this.subscriptions)if((s+"?").startsWith(e)){t=!0;for(let e of this.subscriptions[s])this.eventSource?.removeEventListener(s,e);delete this.subscriptions[s];}t&&(this.hasSubscriptionListeners()?await this.submitSubscriptions():this.disconnect());}async unsubscribeByTopicAndListener(e,t){let s=!1;const i=this.getSubscriptionsByTopic(e);for(let e in i){if(!Array.isArray(this.subscriptions[e])||!this.subscriptions[e].length)continue;let i=!1;for(let s=this.subscriptions[e].length-1;s>=0;s--)this.subscriptions[e][s]===t&&(i=!0,delete this.subscriptions[e][s],this.subscriptions[e].splice(s,1),this.eventSource?.removeEventListener(e,t));i&&(this.subscriptions[e].length||delete this.subscriptions[e],s||this.hasSubscriptionListeners(e)||(s=!0));}this.hasSubscriptionListeners()?s&&await this.submitSubscriptions():this.disconnect();}hasSubscriptionListeners(e){if(this.subscriptions=this.subscriptions||{},e)return !!this.subscriptions[e]?.length;for(let e in this.subscriptions)if(this.subscriptions[e]?.length)return !0;return !1}async submitSubscriptions(){if(this.clientId)return this.addAllSubscriptionListeners(),this.lastSentSubscriptions=this.getNonEmptySubscriptionKeys(),this.client.send("/api/realtime",{method:"POST",body:{clientId:this.clientId,subscriptions:this.lastSentSubscriptions},requestKey:this.getSubscriptionsCancelKey()}).catch((e=>{if(!e?.isAbort)throw e}))}getSubscriptionsCancelKey(){return "realtime_"+this.clientId}getSubscriptionsByTopic(e){const t={};e=e.includes("?")?e:e+"?";for(let s in this.subscriptions)(s+"?").startsWith(e)&&(t[s]=this.subscriptions[s]);return t}getNonEmptySubscriptionKeys(){const e=[];for(let t in this.subscriptions)this.subscriptions[t].length&&e.push(t);return e}addAllSubscriptionListeners(){if(this.eventSource){this.removeAllSubscriptionListeners();for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.addEventListener(e,t);}}removeAllSubscriptionListeners(){if(this.eventSource)for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.removeEventListener(e,t);}async connect(){if(!(this.reconnectAttempts>0))return new Promise(((e,t)=>{this.pendingConnects.push({resolve:e,reject:t}),this.pendingConnects.length>1||this.initConnect();}))}initConnect(){this.disconnect(!0),clearTimeout(this.connectTimeoutId),this.connectTimeoutId=setTimeout((()=>{this.connectErrorHandler(new Error("EventSource connect took too long."));}),this.maxConnectTimeout),this.eventSource=new EventSource(this.client.buildUrl("/api/realtime")),this.eventSource.onerror=e=>{this.connectErrorHandler(new Error("Failed to establish realtime connection."));},this.eventSource.addEventListener("PB_CONNECT",(e=>{const t=e;this.clientId=t?.lastEventId,this.submitSubscriptions().then((async()=>{let e=3;for(;this.hasUnsentSubscriptions()&&e>0;)e--,await this.submitSubscriptions();})).then((()=>{for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[],this.reconnectAttempts=0,clearTimeout(this.reconnectTimeoutId),clearTimeout(this.connectTimeoutId);const t=this.getSubscriptionsByTopic("PB_CONNECT");for(let s in t)for(let i of t[s])i(e);})).catch((e=>{this.clientId="",this.connectErrorHandler(e);}));}));}hasUnsentSubscriptions(){const e=this.getNonEmptySubscriptionKeys();if(e.length!=this.lastSentSubscriptions.length)return !0;for(const t of e)if(!this.lastSentSubscriptions.includes(t))return !0;return !1}connectErrorHandler(e){if(clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),!this.clientId&&!this.reconnectAttempts||this.reconnectAttempts>this.maxReconnectAttempts){for(let t of this.pendingConnects)t.reject(new ClientResponseError(e));return this.pendingConnects=[],void this.disconnect()}this.disconnect(!0);const t=this.predefinedReconnectIntervals[this.reconnectAttempts]||this.predefinedReconnectIntervals[this.predefinedReconnectIntervals.length-1];this.reconnectAttempts++,this.reconnectTimeoutId=setTimeout((()=>{this.initConnect();}),t);}disconnect(e=!1){if(clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),this.removeAllSubscriptionListeners(),this.client.cancelRequest(this.getSubscriptionsCancelKey()),this.eventSource?.close(),this.eventSource=null,this.clientId="",!e){this.reconnectAttempts=0;for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[];}}}class RecordService extends CrudService{constructor(e,t){super(e),this.collectionIdOrName=t;}get baseCrudPath(){return this.baseCollectionPath+"/records"}get baseCollectionPath(){return "/api/collections/"+encodeURIComponent(this.collectionIdOrName)}async subscribe(e,t,s){if(!e)throw new Error("Missing topic.");if(!t)throw new Error("Missing subscription callback.");return this.client.realtime.subscribe(this.collectionIdOrName+"/"+e,t,s)}async unsubscribe(e){return e?this.client.realtime.unsubscribe(this.collectionIdOrName+"/"+e):this.client.realtime.unsubscribeByPrefix(this.collectionIdOrName)}async getFullList(e,t){if("number"==typeof e)return super.getFullList(e,t);const s=Object.assign({},e,t);return super.getFullList(s)}async getList(e=1,t=30,s){return super.getList(e,t,s)}async getFirstListItem(e,t){return super.getFirstListItem(e,t)}async getOne(e,t){return super.getOne(e,t)}async create(e,t){return super.create(e,t)}async update(e,t,s){return super.update(e,t,s).then((e=>(this.client.authStore.model?.id!==e?.id||this.client.authStore.model?.collectionId!==this.collectionIdOrName&&this.client.authStore.model?.collectionName!==this.collectionIdOrName||this.client.authStore.save(this.client.authStore.token,e),e)))}async delete(e,t){return super.delete(e,t).then((t=>(!t||this.client.authStore.model?.id!==e||this.client.authStore.model?.collectionId!==this.collectionIdOrName&&this.client.authStore.model?.collectionName!==this.collectionIdOrName||this.client.authStore.clear(),t)))}authResponse(e){const t=this.decode(e?.record||{});return this.client.authStore.save(e?.token,t),Object.assign({},e,{token:e?.token||"",record:t})}async listAuthMethods(e){return e=Object.assign({method:"GET"},e),this.client.send(this.baseCollectionPath+"/auth-methods",e).then((e=>Object.assign({},e,{usernamePassword:!!e?.usernamePassword,emailPassword:!!e?.emailPassword,authProviders:Array.isArray(e?.authProviders)?e?.authProviders:[]})))}async authWithPassword(e,t,s,i){let n={method:"POST",body:{identity:e,password:t}};return n=normalizeLegacyOptionsArgs("This form of authWithPassword(usernameOrEmail, pass, body?, query?) is deprecated. Consider replacing it with authWithPassword(usernameOrEmail, pass, options?).",n,s,i),this.client.send(this.baseCollectionPath+"/auth-with-password",n).then((e=>this.authResponse(e)))}async authWithOAuth2Code(e,t,s,i,n,r,o){let a={method:"POST",body:{provider:e,code:t,codeVerifier:s,redirectUrl:i,createData:n}};return a=normalizeLegacyOptionsArgs("This form of authWithOAuth2Code(provider, code, codeVerifier, redirectUrl, createData?, body?, query?) is deprecated. Consider replacing it with authWithOAuth2Code(provider, code, codeVerifier, redirectUrl, createData?, options?).",a,r,o),this.client.send(this.baseCollectionPath+"/auth-with-oauth2",a).then((e=>this.authResponse(e)))}async authWithOAuth2(...e){if(e.length>1||"string"==typeof e?.[0])return console.warn("PocketBase: This form of authWithOAuth2() is deprecated and may get removed in the future. Please replace with authWithOAuth2Code() OR use the authWithOAuth2() realtime form as shown in https://pocketbase.io/docs/authentication/#oauth2-integration."),this.authWithOAuth2Code(e?.[0]||"",e?.[1]||"",e?.[2]||"",e?.[3]||"",e?.[4]||{},e?.[5]||{},e?.[6]||{});const t=e?.[0]||{},s=(await this.listAuthMethods()).authProviders.find((e=>e.name===t.provider));if(!s)throw new ClientResponseError(new Error(`Missing or invalid provider "${t.provider}".`));const i=this.client.buildUrl("/api/oauth2-redirect"),n=new RealtimeService(this.client);let r=null;function cleanup(){r?.close(),n.unsubscribe();}return t.urlCallback||(r=openBrowserPopup(void 0)),new Promise((async(e,o)=>{try{await n.subscribe("@oauth2",(async r=>{const a=n.clientId;try{if(!r.state||a!==r.state)throw new Error("State parameters don't match.");if(r.error||!r.code)throw new Error("OAuth2 redirect error or missing code: "+r.error);const n=Object.assign({},t);delete n.provider,delete n.scopes,delete n.createData,delete n.urlCallback;const o=await this.authWithOAuth2Code(s.name,r.code,s.codeVerifier,i,t.createData,n);e(o);}catch(e){o(new ClientResponseError(e));}cleanup();}));const a={state:n.clientId};t.scopes?.length&&(a.scope=t.scopes.join(" "));const c=this._replaceQueryParams(s.authUrl+i,a);let l=t.urlCallback||function(e){r?r.location.href=e:r=openBrowserPopup(e);};await l(c);}catch(e){cleanup(),o(new ClientResponseError(e));}}))}async authRefresh(e,t){let s={method:"POST"};return s=normalizeLegacyOptionsArgs("This form of authRefresh(body?, query?) is deprecated. Consider replacing it with authRefresh(options?).",s,e,t),this.client.send(this.baseCollectionPath+"/auth-refresh",s).then((e=>this.authResponse(e)))}async requestPasswordReset(e,t,s){let i={method:"POST",body:{email:e}};return i=normalizeLegacyOptionsArgs("This form of requestPasswordReset(email, body?, query?) is deprecated. Consider replacing it with requestPasswordReset(email, options?).",i,t,s),this.client.send(this.baseCollectionPath+"/request-password-reset",i).then((()=>!0))}async confirmPasswordReset(e,t,s,i,n){let r={method:"POST",body:{token:e,password:t,passwordConfirm:s}};return r=normalizeLegacyOptionsArgs("This form of confirmPasswordReset(token, password, passwordConfirm, body?, query?) is deprecated. Consider replacing it with confirmPasswordReset(token, password, passwordConfirm, options?).",r,i,n),this.client.send(this.baseCollectionPath+"/confirm-password-reset",r).then((()=>!0))}async requestVerification(e,t,s){let i={method:"POST",body:{email:e}};return i=normalizeLegacyOptionsArgs("This form of requestVerification(email, body?, query?) is deprecated. Consider replacing it with requestVerification(email, options?).",i,t,s),this.client.send(this.baseCollectionPath+"/request-verification",i).then((()=>!0))}async confirmVerification(e,t,s){let i={method:"POST",body:{token:e}};return i=normalizeLegacyOptionsArgs("This form of confirmVerification(token, body?, query?) is deprecated. Consider replacing it with confirmVerification(token, options?).",i,t,s),this.client.send(this.baseCollectionPath+"/confirm-verification",i).then((()=>{const t=getTokenPayload(e),s=this.client.authStore.model;return s&&!s.verified&&s.id===t.id&&s.collectionId===t.collectionId&&(s.verified=!0,this.client.authStore.save(this.client.authStore.token,s)),!0}))}async requestEmailChange(e,t,s){let i={method:"POST",body:{newEmail:e}};return i=normalizeLegacyOptionsArgs("This form of requestEmailChange(newEmail, body?, query?) is deprecated. Consider replacing it with requestEmailChange(newEmail, options?).",i,t,s),this.client.send(this.baseCollectionPath+"/request-email-change",i).then((()=>!0))}async confirmEmailChange(e,t,s,i){let n={method:"POST",body:{token:e,password:t}};return n=normalizeLegacyOptionsArgs("This form of confirmEmailChange(token, password, body?, query?) is deprecated. Consider replacing it with confirmEmailChange(token, password, options?).",n,s,i),this.client.send(this.baseCollectionPath+"/confirm-email-change",n).then((()=>{const t=getTokenPayload(e),s=this.client.authStore.model;return s&&s.id===t.id&&s.collectionId===t.collectionId&&this.client.authStore.clear(),!0}))}async listExternalAuths(e,t){return t=Object.assign({method:"GET"},t),this.client.send(this.baseCrudPath+"/"+encodeURIComponent(e)+"/external-auths",t)}async unlinkExternalAuth(e,t,s){return s=Object.assign({method:"DELETE"},s),this.client.send(this.baseCrudPath+"/"+encodeURIComponent(e)+"/external-auths/"+encodeURIComponent(t),s).then((()=>!0))}_replaceQueryParams(e,t={}){let s=e,i="";e.indexOf("?")>=0&&(s=e.substring(0,e.indexOf("?")),i=e.substring(e.indexOf("?")+1));const n={},r=i.split("&");for(const e of r){if(""==e)continue;const t=e.split("=");n[decodeURIComponent(t[0].replace(/\+/g," "))]=decodeURIComponent((t[1]||"").replace(/\+/g," "));}for(let e in t)t.hasOwnProperty(e)&&(null==t[e]?delete n[e]:n[e]=t[e]);i="";for(let e in n)n.hasOwnProperty(e)&&(""!=i&&(i+="&"),i+=encodeURIComponent(e.replace(/%20/g,"+"))+"="+encodeURIComponent(n[e].replace(/%20/g,"+")));return ""!=i?s+"?"+i:s}}function openBrowserPopup(e){if("undefined"==typeof window||!window?.open)throw new ClientResponseError(new Error("Not in a browser context - please pass a custom urlCallback function."));let t=1024,s=768,i=window.innerWidth,n=window.innerHeight;t=t>i?i:t,s=s>n?n:s;let r=i/2-t/2,o=n/2-s/2;return window.open(e,"popup_window","width="+t+",height="+s+",top="+o+",left="+r+",resizable,menubar=no")}class CollectionService extends CrudService{get baseCrudPath(){return "/api/collections"}async import(e,t=!1,s){return s=Object.assign({method:"PUT",body:{collections:e,deleteMissing:t}},s),this.client.send(this.baseCrudPath+"/import",s).then((()=>!0))}}class LogService extends BaseService{async getList(e=1,t=30,s){return (s=Object.assign({method:"GET"},s)).query=Object.assign({page:e,perPage:t},s.query),this.client.send("/api/logs",s)}async getOne(e,t){if(!e)throw new ClientResponseError({url:this.client.buildUrl("/api/logs/"),status:404,response:{code:404,message:"Missing required log id.",data:{}}});return t=Object.assign({method:"GET"},t),this.client.send("/api/logs/"+encodeURIComponent(e),t)}async getStats(e){return e=Object.assign({method:"GET"},e),this.client.send("/api/logs/stats",e)}}class HealthService extends BaseService{async check(e){return e=Object.assign({method:"GET"},e),this.client.send("/api/health",e)}}class FileService extends BaseService{getUrl(e,t,s={}){if(!t||!e?.id||!e?.collectionId&&!e?.collectionName)return "";const i=[];i.push("api"),i.push("files"),i.push(encodeURIComponent(e.collectionId||e.collectionName)),i.push(encodeURIComponent(e.id)),i.push(encodeURIComponent(t));let n=this.client.buildUrl(i.join("/"));if(Object.keys(s).length){!1===s.download&&delete s.download;const e=new URLSearchParams(s);n+=(n.includes("?")?"&":"?")+e;}return n}async getToken(e){return e=Object.assign({method:"POST"},e),this.client.send("/api/files/token",e).then((e=>e?.token||""))}}class BackupService extends BaseService{async getFullList(e){return e=Object.assign({method:"GET"},e),this.client.send("/api/backups",e)}async create(e,t){return t=Object.assign({method:"POST",body:{name:e}},t),this.client.send("/api/backups",t).then((()=>!0))}async upload(e,t){return t=Object.assign({method:"POST",body:e},t),this.client.send("/api/backups/upload",t).then((()=>!0))}async delete(e,t){return t=Object.assign({method:"DELETE"},t),this.client.send(`/api/backups/${encodeURIComponent(e)}`,t).then((()=>!0))}async restore(e,t){return t=Object.assign({method:"POST"},t),this.client.send(`/api/backups/${encodeURIComponent(e)}/restore`,t).then((()=>!0))}getDownloadUrl(e,t){return this.client.buildUrl(`/api/backups/${encodeURIComponent(t)}?token=${encodeURIComponent(e)}`)}}class Client{constructor(e="/",t,s="en-US"){this.cancelControllers={},this.recordServices={},this.enableAutoCancellation=!0,this.baseUrl=e,this.lang=s,this.authStore=t||new LocalAuthStore,this.admins=new AdminService(this),this.collections=new CollectionService(this),this.files=new FileService(this),this.logs=new LogService(this),this.settings=new SettingsService(this),this.realtime=new RealtimeService(this),this.health=new HealthService(this),this.backups=new BackupService(this);}collection(e){return this.recordServices[e]||(this.recordServices[e]=new RecordService(this,e)),this.recordServices[e]}autoCancellation(e){return this.enableAutoCancellation=!!e,this}cancelRequest(e){return this.cancelControllers[e]&&(this.cancelControllers[e].abort(),delete this.cancelControllers[e]),this}cancelAllRequests(){for(let e in this.cancelControllers)this.cancelControllers[e].abort();return this.cancelControllers={},this}filter(e,t){if(!t)return e;for(let s in t){let i=t[s];switch(typeof i){case"boolean":case"number":i=""+i;break;case"string":i="'"+i.replace(/'/g,"\\'")+"'";break;default:i=null===i?"null":i instanceof Date?"'"+i.toISOString().replace("T"," ")+"'":"'"+JSON.stringify(i).replace(/'/g,"\\'")+"'";}e=e.replaceAll("{:"+s+"}",i);}return e}getFileUrl(e,t,s={}){return this.files.getUrl(e,t,s)}buildUrl(e){let t=this.baseUrl;return "undefined"==typeof window||!window.location||t.startsWith("https://")||t.startsWith("http://")||(t=window.location.origin?.endsWith("/")?window.location.origin.substring(0,window.location.origin.length-1):window.location.origin||"",this.baseUrl.startsWith("/")||(t+=window.location.pathname||"/",t+=t.endsWith("/")?"":"/"),t+=this.baseUrl),e&&(t+=t.endsWith("/")?"":"/",t+=e.startsWith("/")?e.substring(1):e),t}async send(e,t){t=this.initSendOptions(e,t);let s=this.buildUrl(e);if(this.beforeSend){const e=Object.assign({},await this.beforeSend(s,t));void 0!==e.url||void 0!==e.options?(s=e.url||s,t=e.options||t):Object.keys(e).length&&(t=e,console?.warn&&console.warn("Deprecated format of beforeSend return: please use `return { url, options }`, instead of `return options`."));}if(void 0!==t.query){const e=this.serializeQueryParams(t.query);e&&(s+=(s.includes("?")?"&":"?")+e),delete t.query;}"application/json"==this.getHeader(t.headers,"Content-Type")&&t.body&&"string"!=typeof t.body&&(t.body=JSON.stringify(t.body));return (t.fetch||fetch)(s,t).then((async e=>{let t={};try{t=await e.json();}catch(e){}if(this.afterSend&&(t=await this.afterSend(e,t)),e.status>=400)throw new ClientResponseError({url:e.url,status:e.status,data:t});return t})).catch((e=>{throw new ClientResponseError(e)}))}initSendOptions(e,t){if((t=Object.assign({method:"GET"},t)).body=this.convertToFormDataIfNeeded(t.body),normalizeUnknownQueryParams(t),t.query=Object.assign({},t.params,t.query),void 0===t.requestKey&&(!1===t.$autoCancel||!1===t.query.$autoCancel?t.requestKey=null:(t.$cancelKey||t.query.$cancelKey)&&(t.requestKey=t.$cancelKey||t.query.$cancelKey)),delete t.$autoCancel,delete t.query.$autoCancel,delete t.$cancelKey,delete t.query.$cancelKey,null!==this.getHeader(t.headers,"Content-Type")||this.isFormData(t.body)||(t.headers=Object.assign({},t.headers,{"Content-Type":"application/json"})),null===this.getHeader(t.headers,"Accept-Language")&&(t.headers=Object.assign({},t.headers,{"Accept-Language":this.lang})),this.authStore.token&&null===this.getHeader(t.headers,"Authorization")&&(t.headers=Object.assign({},t.headers,{Authorization:this.authStore.token})),this.enableAutoCancellation&&null!==t.requestKey){const s=t.requestKey||(t.method||"GET")+e;delete t.requestKey,this.cancelRequest(s);const i=new AbortController;this.cancelControllers[s]=i,t.signal=i.signal;}return t}convertToFormDataIfNeeded(e){if("undefined"==typeof FormData||void 0===e||"object"!=typeof e||null===e||this.isFormData(e)||!this.hasBlobField(e))return e;const t=new FormData;for(const s in e){const i=e[s];if("object"!=typeof i||this.hasBlobField({data:i})){const e=Array.isArray(i)?i:[i];for(let i of e)t.append(s,i);}else {let e={};e[s]=i,t.append("@jsonPayload",JSON.stringify(e));}}return t}hasBlobField(e){for(const t in e){const s=Array.isArray(e[t])?e[t]:[e[t]];for(const e of s)if("undefined"!=typeof Blob&&e instanceof Blob||"undefined"!=typeof File&&e instanceof File)return !0}return !1}getHeader(e,t){e=e||{},t=t.toLowerCase();for(let s in e)if(s.toLowerCase()==t)return e[s];return null}isFormData(e){return e&&("FormData"===e.constructor.name||"undefined"!=typeof FormData&&e instanceof FormData)}serializeQueryParams(e){const t=[];for(const s in e){if(null===e[s])continue;const i=e[s],n=encodeURIComponent(s);if(Array.isArray(i))for(const e of i)t.push(n+"="+encodeURIComponent(e));else i instanceof Date?t.push(n+"="+encodeURIComponent(i.toISOString())):null!==typeof i&&"object"==typeof i?t.push(n+"="+encodeURIComponent(JSON.stringify(i))):t.push(n+"="+encodeURIComponent(i));}return t.join("&")}}

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const pb = new Client('https://tddd27project.pockethost.io/'); // remote
    const currentUser = writable(pb.authStore.model);
    pb.authStore.onChange((auth) => {
        console.log('authStore changed', auth);
        currentUser.set(pb.authStore.model);
    });

    /* src/comp/Tasks.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/comp/Tasks.svelte";

    function create_fragment$2(ctx) {
    	let div11;
    	let form0;
    	let h20;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let button0;
    	let t4;
    	let div0;
    	let button1;
    	let span0;
    	let t6;
    	let span1;
    	let t8;
    	let span2;
    	let t10;
    	let button2;
    	let span3;
    	let t12;
    	let span4;
    	let t14;
    	let span5;
    	let t16;
    	let button3;
    	let span6;
    	let t18;
    	let span7;
    	let t20;
    	let span8;
    	let t22;
    	let h21;
    	let t24;
    	let ul;
    	let li0;
    	let div3;
    	let form1;
    	let div1;
    	let label1;
    	let t26;
    	let input1;
    	let t27;
    	let div2;
    	let button4;
    	let t28;
    	let span9;
    	let t30;
    	let button5;
    	let t31;
    	let span10;
    	let t33;
    	let li1;
    	let div6;
    	let div4;
    	let input2;
    	let t34;
    	let label2;
    	let t36;
    	let div5;
    	let button6;
    	let t37;
    	let span11;
    	let t39;
    	let button7;
    	let t40;
    	let span12;
    	let t42;
    	let li2;
    	let div9;
    	let div7;
    	let input3;
    	let t43;
    	let label3;
    	let t45;
    	let div8;
    	let button8;
    	let t46;
    	let span13;
    	let t48;
    	let button9;
    	let t49;
    	let span14;
    	let t51;
    	let hr;
    	let t52;
    	let div10;
    	let button10;
    	let t54;
    	let button11;

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			form0 = element("form");
    			h20 = element("h2");
    			label0 = element("label");
    			label0.textContent = "What needs to be done?";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t4 = space();
    			div0 = element("div");
    			button1 = element("button");
    			span0 = element("span");
    			span0.textContent = "Show";
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "All";
    			t8 = space();
    			span2 = element("span");
    			span2.textContent = "tasks";
    			t10 = space();
    			button2 = element("button");
    			span3 = element("span");
    			span3.textContent = "Show";
    			t12 = space();
    			span4 = element("span");
    			span4.textContent = "Active";
    			t14 = space();
    			span5 = element("span");
    			span5.textContent = "tasks";
    			t16 = space();
    			button3 = element("button");
    			span6 = element("span");
    			span6.textContent = "Show";
    			t18 = space();
    			span7 = element("span");
    			span7.textContent = "Completed";
    			t20 = space();
    			span8 = element("span");
    			span8.textContent = "tasks";
    			t22 = space();
    			h21 = element("h2");
    			h21.textContent = "2 out of 3 items completed";
    			t24 = space();
    			ul = element("ul");
    			li0 = element("li");
    			div3 = element("div");
    			form1 = element("form");
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "New name for 'Create a Svelte starter app'";
    			t26 = space();
    			input1 = element("input");
    			t27 = space();
    			div2 = element("div");
    			button4 = element("button");
    			t28 = text("Cancel\n                ");
    			span9 = element("span");
    			span9.textContent = "renaming Create a Svelte starter app";
    			t30 = space();
    			button5 = element("button");
    			t31 = text("Save\n                ");
    			span10 = element("span");
    			span10.textContent = "new name for Create a Svelte starter app";
    			t33 = space();
    			li1 = element("li");
    			div6 = element("div");
    			div4 = element("div");
    			input2 = element("input");
    			t34 = space();
    			label2 = element("label");
    			label2.textContent = "Create your first component";
    			t36 = space();
    			div5 = element("div");
    			button6 = element("button");
    			t37 = text("Edit\n              ");
    			span11 = element("span");
    			span11.textContent = "Create your first component";
    			t39 = space();
    			button7 = element("button");
    			t40 = text("Delete\n              ");
    			span12 = element("span");
    			span12.textContent = "Create your first component";
    			t42 = space();
    			li2 = element("li");
    			div9 = element("div");
    			div7 = element("div");
    			input3 = element("input");
    			t43 = space();
    			label3 = element("label");
    			label3.textContent = "Complete the rest of the tutorial";
    			t45 = space();
    			div8 = element("div");
    			button8 = element("button");
    			t46 = text("Edit\n              ");
    			span13 = element("span");
    			span13.textContent = "Complete the rest of the tutorial";
    			t48 = space();
    			button9 = element("button");
    			t49 = text("Delete\n              ");
    			span14 = element("span");
    			span14.textContent = "Complete the rest of the tutorial";
    			t51 = space();
    			hr = element("hr");
    			t52 = space();
    			div10 = element("div");
    			button10 = element("button");
    			button10.textContent = "Check all";
    			t54 = space();
    			button11 = element("button");
    			button11.textContent = "Remove completed";
    			attr_dev(label0, "for", "todo-0");
    			attr_dev(label0, "class", "label__lg");
    			add_location(label0, file$2, 5, 8, 129);
    			attr_dev(h20, "class", "label-wrapper");
    			add_location(h20, file$2, 4, 6, 94);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "todo-0");
    			attr_dev(input0, "autocomplete", "off");
    			attr_dev(input0, "class", "input input__lg");
    			add_location(input0, file$2, 7, 6, 218);
    			attr_dev(button0, "type", "submit");
    			button0.disabled = "";
    			attr_dev(button0, "class", "btn btn__primary btn__lg");
    			add_location(button0, file$2, 8, 6, 301);
    			add_location(form0, file$2, 3, 4, 81);
    			attr_dev(span0, "class", "visually-hidden");
    			add_location(span0, file$2, 16, 8, 550);
    			add_location(span1, file$2, 17, 8, 600);
    			attr_dev(span2, "class", "visually-hidden");
    			add_location(span2, file$2, 18, 8, 625);
    			attr_dev(button1, "class", "btn toggle-btn");
    			attr_dev(button1, "aria-pressed", "true");
    			add_location(button1, file$2, 15, 6, 490);
    			attr_dev(span3, "class", "visually-hidden");
    			add_location(span3, file$2, 21, 8, 751);
    			add_location(span4, file$2, 22, 8, 801);
    			attr_dev(span5, "class", "visually-hidden");
    			add_location(span5, file$2, 23, 8, 829);
    			attr_dev(button2, "class", "btn toggle-btn");
    			attr_dev(button2, "aria-pressed", "false");
    			add_location(button2, file$2, 20, 6, 690);
    			attr_dev(span6, "class", "visually-hidden");
    			add_location(span6, file$2, 26, 8, 955);
    			add_location(span7, file$2, 27, 8, 1005);
    			attr_dev(span8, "class", "visually-hidden");
    			add_location(span8, file$2, 28, 8, 1036);
    			attr_dev(button3, "class", "btn toggle-btn");
    			attr_dev(button3, "aria-pressed", "false");
    			add_location(button3, file$2, 25, 6, 894);
    			attr_dev(div0, "class", "filters btn-group stack-exception");
    			add_location(div0, file$2, 14, 4, 436);
    			attr_dev(h21, "id", "list-heading");
    			add_location(h21, file$2, 33, 4, 1138);
    			attr_dev(label1, "for", "todo-1");
    			attr_dev(label1, "class", "todo-label");
    			add_location(label1, file$2, 42, 14, 1479);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "todo-1");
    			attr_dev(input1, "autocomplete", "off");
    			attr_dev(input1, "class", "todo-text");
    			add_location(input1, file$2, 45, 14, 1615);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$2, 41, 12, 1440);
    			attr_dev(span9, "class", "visually-hidden");
    			add_location(span9, file$2, 54, 16, 1905);
    			attr_dev(button4, "class", "btn todo-cancel");
    			attr_dev(button4, "type", "button");
    			add_location(button4, file$2, 52, 14, 1819);
    			attr_dev(span10, "class", "visually-hidden");
    			add_location(span10, file$2, 58, 16, 2112);
    			attr_dev(button5, "class", "btn btn__primary todo-edit");
    			attr_dev(button5, "type", "submit");
    			add_location(button5, file$2, 56, 14, 2017);
    			attr_dev(div2, "class", "btn-group");
    			add_location(div2, file$2, 51, 12, 1781);
    			attr_dev(form1, "class", "stack-small");
    			add_location(form1, file$2, 40, 10, 1401);
    			attr_dev(div3, "class", "stack-small");
    			add_location(div3, file$2, 39, 8, 1365);
    			attr_dev(li0, "class", "todo");
    			add_location(li0, file$2, 38, 6, 1339);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "id", "todo-2");
    			input2.checked = true;
    			add_location(input2, file$2, 69, 12, 2402);
    			attr_dev(label2, "for", "todo-2");
    			attr_dev(label2, "class", "todo-label");
    			add_location(label2, file$2, 70, 12, 2460);
    			attr_dev(div4, "class", "c-cb");
    			add_location(div4, file$2, 68, 10, 2371);
    			attr_dev(span11, "class", "visually-hidden");
    			add_location(span11, file$2, 77, 14, 2694);
    			attr_dev(button6, "type", "button");
    			attr_dev(button6, "class", "btn");
    			add_location(button6, file$2, 75, 12, 2626);
    			attr_dev(span12, "class", "visually-hidden");
    			add_location(span12, file$2, 81, 14, 2875);
    			attr_dev(button7, "type", "button");
    			attr_dev(button7, "class", "btn btn__danger");
    			add_location(button7, file$2, 79, 12, 2793);
    			attr_dev(div5, "class", "btn-group");
    			add_location(div5, file$2, 74, 10, 2590);
    			attr_dev(div6, "class", "stack-small");
    			add_location(div6, file$2, 67, 8, 2335);
    			attr_dev(li1, "class", "todo");
    			add_location(li1, file$2, 66, 6, 2309);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "id", "todo-3");
    			add_location(input3, file$2, 91, 12, 3130);
    			attr_dev(label3, "for", "todo-3");
    			attr_dev(label3, "class", "todo-label");
    			add_location(label3, file$2, 92, 12, 3180);
    			attr_dev(div7, "class", "c-cb");
    			add_location(div7, file$2, 90, 10, 3099);
    			attr_dev(span13, "class", "visually-hidden");
    			add_location(span13, file$2, 99, 14, 3420);
    			attr_dev(button8, "type", "button");
    			attr_dev(button8, "class", "btn");
    			add_location(button8, file$2, 97, 12, 3352);
    			attr_dev(span14, "class", "visually-hidden");
    			add_location(span14, file$2, 103, 14, 3607);
    			attr_dev(button9, "type", "button");
    			attr_dev(button9, "class", "btn btn__danger");
    			add_location(button9, file$2, 101, 12, 3525);
    			attr_dev(div8, "class", "btn-group");
    			add_location(div8, file$2, 96, 10, 3316);
    			attr_dev(div9, "class", "stack-small");
    			add_location(div9, file$2, 89, 8, 3063);
    			attr_dev(li2, "class", "todo");
    			add_location(li2, file$2, 88, 6, 3037);
    			attr_dev(ul, "role", "list");
    			attr_dev(ul, "class", "todo-list stack-large");
    			attr_dev(ul, "aria-labelledby", "list-heading");
    			add_location(ul, file$2, 36, 4, 1218);
    			add_location(hr, file$2, 110, 4, 3761);
    			attr_dev(button10, "type", "button");
    			attr_dev(button10, "class", "btn btn__primary");
    			add_location(button10, file$2, 114, 6, 3830);
    			attr_dev(button11, "type", "button");
    			attr_dev(button11, "class", "btn btn__primary");
    			add_location(button11, file$2, 115, 6, 3902);
    			attr_dev(div10, "class", "btn-group");
    			add_location(div10, file$2, 113, 4, 3800);
    			attr_dev(div11, "class", "todoapp stack-large");
    			add_location(div11, file$2, 1, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, form0);
    			append_dev(form0, h20);
    			append_dev(h20, label0);
    			append_dev(form0, t1);
    			append_dev(form0, input0);
    			append_dev(form0, t2);
    			append_dev(form0, button0);
    			append_dev(div11, t4);
    			append_dev(div11, div0);
    			append_dev(div0, button1);
    			append_dev(button1, span0);
    			append_dev(button1, t6);
    			append_dev(button1, span1);
    			append_dev(button1, t8);
    			append_dev(button1, span2);
    			append_dev(div0, t10);
    			append_dev(div0, button2);
    			append_dev(button2, span3);
    			append_dev(button2, t12);
    			append_dev(button2, span4);
    			append_dev(button2, t14);
    			append_dev(button2, span5);
    			append_dev(div0, t16);
    			append_dev(div0, button3);
    			append_dev(button3, span6);
    			append_dev(button3, t18);
    			append_dev(button3, span7);
    			append_dev(button3, t20);
    			append_dev(button3, span8);
    			append_dev(div11, t22);
    			append_dev(div11, h21);
    			append_dev(div11, t24);
    			append_dev(div11, ul);
    			append_dev(ul, li0);
    			append_dev(li0, div3);
    			append_dev(div3, form1);
    			append_dev(form1, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t26);
    			append_dev(div1, input1);
    			append_dev(form1, t27);
    			append_dev(form1, div2);
    			append_dev(div2, button4);
    			append_dev(button4, t28);
    			append_dev(button4, span9);
    			append_dev(div2, t30);
    			append_dev(div2, button5);
    			append_dev(button5, t31);
    			append_dev(button5, span10);
    			append_dev(ul, t33);
    			append_dev(ul, li1);
    			append_dev(li1, div6);
    			append_dev(div6, div4);
    			append_dev(div4, input2);
    			append_dev(div4, t34);
    			append_dev(div4, label2);
    			append_dev(div6, t36);
    			append_dev(div6, div5);
    			append_dev(div5, button6);
    			append_dev(button6, t37);
    			append_dev(button6, span11);
    			append_dev(div5, t39);
    			append_dev(div5, button7);
    			append_dev(button7, t40);
    			append_dev(button7, span12);
    			append_dev(ul, t42);
    			append_dev(ul, li2);
    			append_dev(li2, div9);
    			append_dev(div9, div7);
    			append_dev(div7, input3);
    			append_dev(div7, t43);
    			append_dev(div7, label3);
    			append_dev(div9, t45);
    			append_dev(div9, div8);
    			append_dev(div8, button8);
    			append_dev(button8, t46);
    			append_dev(button8, span13);
    			append_dev(div8, t48);
    			append_dev(div8, button9);
    			append_dev(button9, t49);
    			append_dev(button9, span14);
    			append_dev(div11, t51);
    			append_dev(div11, hr);
    			append_dev(div11, t52);
    			append_dev(div11, div10);
    			append_dev(div10, button10);
    			append_dev(div10, t54);
    			append_dev(div10, button11);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tasks', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tasks> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tasks extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tasks",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/comp/Login.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/comp/Login.svelte";

    // (35:2) {:else}
    function create_else_block(ctx) {
    	let form;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let input2;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			input2 = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Sign Up";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Login";
    			attr_dev(input0, "placeholder", "Username");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$1, 36, 6, 823);
    			attr_dev(input1, "placeholder", "Full name");
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$1, 42, 6, 927);
    			attr_dev(input2, "placeholder", "Password");
    			attr_dev(input2, "type", "password");
    			add_location(input2, file$1, 48, 6, 1030);
    			add_location(button0, file$1, 53, 6, 1141);
    			add_location(button1, file$1, 54, 6, 1190);
    			add_location(form, file$1, 35, 4, 785);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input0);
    			set_input_value(input0, /*username*/ ctx[0]);
    			append_dev(form, t0);
    			append_dev(form, input1);
    			set_input_value(input1, /*name*/ ctx[2]);
    			append_dev(form, t1);
    			append_dev(form, input2);
    			set_input_value(input2, /*password*/ ctx[1]);
    			append_dev(form, t2);
    			append_dev(form, button0);
    			append_dev(form, t4);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(button0, "click", /*signUp*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*login*/ ctx[4], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[7]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				set_input_value(input0, /*username*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 4 && input1.value !== /*name*/ ctx[2]) {
    				set_input_value(input1, /*name*/ ctx[2]);
    			}

    			if (dirty & /*password*/ 2 && input2.value !== /*password*/ ctx[1]) {
    				set_input_value(input2, /*password*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(35:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#if $currentUser}
    function create_if_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*$currentUser*/ ctx[3].username + "";
    	let t1;
    	let t2;
    	let button;
    	let t4;
    	let tasks;
    	let current;
    	let mounted;
    	let dispose;
    	tasks = new Tasks({ $$inline: true });

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Signed in as ");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Sign Out";
    			t4 = space();
    			create_component(tasks.$$.fragment);
    			add_location(button, file$1, 31, 6, 704);
    			add_location(p, file$1, 29, 4, 650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, button);
    			insert_dev(target, t4, anchor);
    			mount_component(tasks, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*signOut*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$currentUser*/ 8) && t1_value !== (t1_value = /*$currentUser*/ ctx[3].username + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tasks.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tasks.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t4);
    			destroy_component(tasks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:2) {#if $currentUser}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$currentUser*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentUser;
    	validate_store(currentUser, 'currentUser');
    	component_subscribe($$self, currentUser, $$value => $$invalidate(3, $currentUser = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let username;
    	let password;
    	let name;

    	async function login() {
    		await pb.collection('users').authWithPassword(username, password);
    	}

    	async function signUp() {
    		try {
    			const data = {
    				username,
    				password,
    				passwordConfirm: password,
    				name
    			};

    			const createdUser = await pb.collection('users').create(data);
    			await login();
    		} catch(err) {
    			console.error(err);
    		}
    	}

    	function signOut() {
    		pb.authStore.clear();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function submit_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(0, username);
    	}

    	function input1_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function input2_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	$$self.$capture_state = () => ({
    		currentUser,
    		pb,
    		Tasks,
    		username,
    		password,
    		name,
    		login,
    		signUp,
    		signOut,
    		$currentUser
    	});

    	$$self.$inject_state = $$props => {
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('password' in $$props) $$invalidate(1, password = $$props.password);
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		password,
    		name,
    		$currentUser,
    		login,
    		signUp,
    		signOut,
    		submit_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(login.$$.fragment);
    			attr_dev(main, "class", "svelte-1knh9dm");
    			add_location(main, file, 7, 0, 206);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(login, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(login);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Login, Tasks, currentUser });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
