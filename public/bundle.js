
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Payform.svelte generated by Svelte v3.5.1 */

    const file = "src/Payform.svelte";

    function create_fragment(ctx) {
    	var h1, t1, div13, div5, div4, img, img_src_value, t2, div3, div0, t3, t4, div1, t5, t6, div2, span0, t7, t8, span1, t9, span1_class_value, t10, span2, t11, div4_class_value, t12, div12, form, label0, t13, t14, input0, t15, div6, t16, t17, label1, t19, input1, t20, div10, div8, div7, t22, input2, input3, t23, div9, span3, t25, input4, t26, div11, dispose;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Nuevo método de pago";
    			t1 = space();
    			div13 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			img = element("img");
    			t2 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t3 = text(ctx.cardnumber);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(ctx.name);
    			t6 = space();
    			div2 = element("div");
    			span0 = element("span");
    			t7 = text(ctx.month);
    			t8 = space();
    			span1 = element("span");
    			t9 = text("/");
    			t10 = space();
    			span2 = element("span");
    			t11 = text(ctx.year);
    			t12 = space();
    			div12 = element("div");
    			form = element("form");
    			label0 = element("label");
    			t13 = text("Número de tarjeta");
    			t14 = space();
    			input0 = element("input");
    			t15 = space();
    			div6 = element("div");
    			t16 = text("El número es incorrecto");
    			t17 = space();
    			label1 = element("label");
    			label1.textContent = "Nombre del tarjetahabiente";
    			t19 = space();
    			input1 = element("input");
    			t20 = space();
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div7.textContent = "Fecha de vencimiento";
    			t22 = space();
    			input2 = element("input");
    			input3 = element("input");
    			t23 = space();
    			div9 = element("div");
    			span3 = element("span");
    			span3.textContent = "Código CVV";
    			t25 = space();
    			input4 = element("input");
    			t26 = space();
    			div11 = element("div");
    			div11.textContent = "agregar método de pago";
    			h1.className = "svelte-uh8fe5";
    			add_location(h1, file, 128, 0, 2426);
    			img.className = "card__logo svelte-uh8fe5";
    			img.src = img_src_value = ctx.firstNumber == '4' ? './visa.png' : ctx.firstNumber == '5' ? './mc.png' : ctx.firstNumber == '3' ? './amex.png' : '';
    			img.alt = "";
    			add_location(img, file, 132, 12, 2646);
    			div0.className = "card__number svelte-uh8fe5";
    			add_location(div0, file, 134, 16, 2847);
    			div1.className = "card__name svelte-uh8fe5";
    			add_location(div1, file, 135, 16, 2908);
    			span0.className = "card__day";
    			add_location(span0, file, 137, 20, 3006);
    			span1.className = span1_class_value = "" + (ctx.month != '' ? slash='show' : slash='oculto') + " svelte-uh8fe5";
    			add_location(span1, file, 137, 59, 3045);
    			span2.className = "card__year";
    			add_location(span2, file, 138, 20, 3132);
    			div2.className = "card__date svelte-uh8fe5";
    			add_location(div2, file, 136, 16, 2961);
    			div3.className = "card__data svelte-uh8fe5";
    			add_location(div3, file, 133, 12, 2806);
    			div4.className = div4_class_value = "card " + (ctx.firstNumber == '4' ? 'c__visa' : ctx.firstNumber == '5' ? 'c__mc' :ctx.firstNumber == '3' ? 'c__amex' : 'c__grey') + " svelte-uh8fe5";
    			add_location(div4, file, 131, 8, 2507);
    			div5.className = "column svelte-uh8fe5";
    			add_location(div5, file, 130, 4, 2478);
    			label0.className = "" + ctx.colortxt + " svelte-uh8fe5";
    			add_location(label0, file, 145, 12, 3292);
    			set_style(input0, "width", "100%");
    			attr(input0, "type", "text");
    			input0.className = "" + ctx.colorborde + " svelte-uh8fe5";
    			add_location(input0, file, 146, 12, 3354);
    			div6.className = "" + ctx.onexists + " svelte-uh8fe5";
    			add_location(div6, file, 146, 94, 3436);
    			label1.htmlFor = "";
    			add_location(label1, file, 147, 12, 3500);
    			set_style(input1, "width", "100%");
    			attr(input1, "type", "text");
    			add_location(input1, file, 148, 12, 3561);
    			add_location(div7, file, 151, 20, 3711);
    			attr(input2, "type", "text");
    			input2.className = "input-mes svelte-uh8fe5";
    			add_location(input2, file, 152, 20, 3763);
    			attr(input3, "type", "text");
    			input3.className = "input-year svelte-uh8fe5";
    			add_location(input3, file, 152, 76, 3819);
    			div8.className = "column-date svelte-uh8fe5";
    			add_location(div8, file, 150, 16, 3665);
    			add_location(span3, file, 155, 20, 3960);
    			attr(input4, "type", "text");
    			input4.className = "input-cvv svelte-uh8fe5";
    			add_location(input4, file, 156, 20, 4004);
    			div9.className = "column-cvv svelte-uh8fe5";
    			add_location(div9, file, 154, 16, 3915);
    			div10.className = "row svelte-uh8fe5";
    			add_location(div10, file, 149, 12, 3631);
    			div11.className = "btn-add svelte-uh8fe5";
    			add_location(div11, file, 159, 12, 4096);
    			add_location(form, file, 144, 8, 3272);
    			div12.className = "column svelte-uh8fe5";
    			add_location(div12, file, 143, 4, 3243);
    			div13.className = "row svelte-uh8fe5";
    			add_location(div13, file, 129, 0, 2456);

    			dispose = [
    				listen(input0, "input", ctx.input0_input_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "input", ctx.input2_input_handler),
    				listen(input3, "input", ctx.input3_input_handler),
    				listen(div11, "click", ctx.validateForm)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t1, anchor);
    			insert(target, div13, anchor);
    			append(div13, div5);
    			append(div5, div4);
    			append(div4, img);
    			append(div4, t2);
    			append(div4, div3);
    			append(div3, div0);
    			append(div0, t3);
    			append(div3, t4);
    			append(div3, div1);
    			append(div1, t5);
    			append(div3, t6);
    			append(div3, div2);
    			append(div2, span0);
    			append(span0, t7);
    			append(div2, t8);
    			append(div2, span1);
    			append(span1, t9);
    			append(div2, t10);
    			append(div2, span2);
    			append(span2, t11);
    			append(div13, t12);
    			append(div13, div12);
    			append(div12, form);
    			append(form, label0);
    			append(label0, t13);
    			append(form, t14);
    			append(form, input0);

    			input0.value = ctx.cardnumber;

    			append(form, t15);
    			append(form, div6);
    			append(div6, t16);
    			append(form, t17);
    			append(form, label1);
    			append(form, t19);
    			append(form, input1);

    			input1.value = ctx.name;

    			append(form, t20);
    			append(form, div10);
    			append(div10, div8);
    			append(div8, div7);
    			append(div8, t22);
    			append(div8, input2);

    			input2.value = ctx.month;

    			append(div8, input3);

    			input3.value = ctx.year;

    			append(div10, t23);
    			append(div10, div9);
    			append(div9, span3);
    			append(div9, t25);
    			append(div9, input4);
    			append(form, t26);
    			append(form, div11);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.firstNumber) && img_src_value !== (img_src_value = ctx.firstNumber == '4' ? './visa.png' : ctx.firstNumber == '5' ? './mc.png' : ctx.firstNumber == '3' ? './amex.png' : '')) {
    				img.src = img_src_value;
    			}

    			if (changed.cardnumber) {
    				set_data(t3, ctx.cardnumber);
    			}

    			if (changed.name) {
    				set_data(t5, ctx.name);
    			}

    			if (changed.month) {
    				set_data(t7, ctx.month);
    			}

    			if ((changed.month) && span1_class_value !== (span1_class_value = "" + (ctx.month != '' ? slash='show' : slash='oculto') + " svelte-uh8fe5")) {
    				span1.className = span1_class_value;
    			}

    			if (changed.year) {
    				set_data(t11, ctx.year);
    			}

    			if ((changed.firstNumber) && div4_class_value !== (div4_class_value = "card " + (ctx.firstNumber == '4' ? 'c__visa' : ctx.firstNumber == '5' ? 'c__mc' :ctx.firstNumber == '3' ? 'c__amex' : 'c__grey') + " svelte-uh8fe5")) {
    				div4.className = div4_class_value;
    			}

    			if (changed.colortxt) {
    				label0.className = "" + ctx.colortxt + " svelte-uh8fe5";
    			}

    			if (changed.cardnumber && (input0.value !== ctx.cardnumber)) input0.value = ctx.cardnumber;

    			if (changed.colorborde) {
    				input0.className = "" + ctx.colorborde + " svelte-uh8fe5";
    			}

    			if (changed.onexists) {
    				div6.className = "" + ctx.onexists + " svelte-uh8fe5";
    			}

    			if (changed.name && (input1.value !== ctx.name)) input1.value = ctx.name;
    			if (changed.month && (input2.value !== ctx.month)) input2.value = ctx.month;
    			if (changed.year && (input3.value !== ctx.year)) input3.value = ctx.year;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t1);
    				detach(div13);
    			}

    			run_all(dispose);
    		}
    	};
    }

    let slash = 'oculto';

    function instance($$self, $$props, $$invalidate) {
    	let cardnumber = '';
        let name = '';
        let month = '';
        let year = '';

        let onexists = 'oculto';
        let colortxt = 'black';
        let colorborde = '';

        function validateForm(){
            if(cardnumber.length < 19 || cardnumber.length > 19){
                $$invalidate('onexists', onexists = 'visible');
                $$invalidate('colortxt', colortxt = 'red');
                $$invalidate('colorborde', colorborde = 'redborder');
            }
        }

    	function input0_input_handler() {
    		cardnumber = this.value;
    		$$invalidate('cardnumber', cardnumber);
    	}

    	function input1_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	function input2_input_handler() {
    		month = this.value;
    		$$invalidate('month', month);
    	}

    	function input3_input_handler() {
    		year = this.value;
    		$$invalidate('year', year);
    	}

    	let firstNumber;

    	$$self.$$.update = ($$dirty = { cardnumber: 1 }) => {
    		if ($$dirty.cardnumber) { $$invalidate('firstNumber', firstNumber = cardnumber.slice(0,1)); }
    	};

    	return {
    		cardnumber,
    		name,
    		month,
    		year,
    		onexists,
    		colortxt,
    		colorborde,
    		validateForm,
    		firstNumber,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	};
    }

    class Payform extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.5.1 */

    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	var payform = new Payform({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			payform.$$.fragment.c();
    			div.className = "container svelte-1957g7e";
    			add_location(div, file$1, 17, 0, 209);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(payform, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			payform.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			payform.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			payform.$destroy();
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
