/**
 * Markdown-Extra Editor
 * Copyright (c) 2013 Christoph Taubmann
 * Licensed under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

(function (w, d, undefined) {
    /**
     * define a global Object "mee" (Markdown Extra Editor)
     */
    if (!w.mee) w.mee = function () {
    };
    /**
     * initialize the current Editor
     * @param {String} id of the current HTML-Container
     * @param {Object} Options to customize Settings
     */
    mee.prototype.init = function (id, opts) {
        var that = this;

        this.ctrl = false;

        this.showComments = true;

        this.timeout = null;
        this.containerid = id;
        this.container = d.getElementById(id);


        this.live = true;
        this.touch = ('ontouchstart' in d.documentElement);

        if (opts) {
            for (e in opts) this.options[e] = opts[e];
        }
        // get the height of the container and substract space of menu (default 50px)
        var ch = this.container.clientHeight - (this.options['menuheight'] || 50);

        this.container.className += ' mee_container ' + (this.touch ? 'editor' : 'both');

        // create+append the menu
        this.container.appendChild(this[this.touch ? 'buildMenuSelect' : 'buildMenu'](this.options.menu, true));

        var at = this.container.getElementsByTagName('textarea');
        this.ta = (at[0]) ? at[0] : d.createElement('TEXTAREA');
        this.ta.className += ' mee_input';
        this.ta.style.height = ch + 'px';

        that.ta.onkeydown = function (e) {

            switch (e.keyCode) {
                case 9: // tab: insert tab
                    e.preventDefault();
                    var pos = this.selectionStart;
                    that.format(that, '\t', '');
                    this.setSelectionRange(pos + 1, pos + 1);
                    return;
                    break;
                case 13: // enter: check/set auto-indetation for some line-starts

                    var pos = this.selectionStart,
                        l = this.value.substring(0, this.selectionStart).split('\n').pop(),
                        c = ['1. ', '    1. ', '\\* ', '    \\* ', '\\\t'];

                    for (var i = 0, j = c.length; i < j; ++i) {
                        if (l.match(eval('/^' + c[i] + '/'))) {
                            var s = c[i].replace('\\', ''),
                                co = s.length + 1;
                            that.format(that, '\n' + s, '');
                            this.setSelectionRange(pos + co, pos + co);
                            e.preventDefault();
                        }
                    }
                    ;

                    break;
                case 17: // ctrl: activate listener for keys below
                    that.ctrl = true;
                    break;
                default:
                    if (that.ctrl) // shortcuts for buttons (only activated in combination with ctrl)
                    {
                        // detect ctrl+SOMETHING: here you can add some custom checks
                        if (e.keyCode == 66) {
                            that.format(that, '**', '**');
                            e.preventDefault();
                        }// b => bold
                        if (e.keyCode == 73) {
                            that.format(that, '*', '*');
                            e.preventDefault();
                        }// i => italics
                        if (e.keyCode == 72) {
                            that.transfer(that, true);
                            e.preventDefault();
                        }// h => regenerate HTML-Output
                        if (e.keyCode == 49) {
                            that.toggleScreens('editor');
                            e.preventDefault();
                        }// 1 => show Editor-Mode
                        if (e.keyCode == 50) {
                            that.toggleScreens('both');
                            e.preventDefault();
                        }// 2 => show Splitscreen-Mode
                        if (e.keyCode == 38) {
                            that.moveLine(that, -1);
                            e.preventDefault();
                        }// move Line up
                        if (e.keyCode == 40) {
                            that.moveLine(that, 1);
                            e.preventDefault();
                        }// move Line down
                        // alert(e.keyCode);e.preventDefault();// uncomment to test for new KeyCodes
                        that.ctrl = false; // reset ctrl-Listener
                    }
                    break;
            }
            ;
            // alert(e.keyCode)// uncomment to test for new KeyCodes

            // delay transfer by 1.5 sec
            if (that.timeout != null) w.clearTimeout(that.timeout);
            that.timeout = w.setTimeout(function () {
                that.transfer(that)
            }, 1500);

        };//onkeydown END

        this.container.appendChild(this.ta);

        this.pv = d.createElement('DIV');
        this.pv.className = 'mee_preview';
        this.pv.style.height = ch + 'px';
        this.container.appendChild(this.pv);

        // register listener for scroll-synchronization
        that.ta.onscroll = function () {
            that.pv.scrollTop = this.scrollTop
        }

        that.transfer(that, true);
    };//init END
    /**
     * move selected Line up or down
     * @param {Object} Menu-Structure as JS-Object
     * @param {Number} -1/1 for up/down
     */
    mee.prototype.moveLine = function (obj, dir) {
        obj.ta.focus();
        var p = obj.ta.selectionStart,
            s = obj.ta.value,
            a0 = s.substring(0, p).split("\n"),
            a1 = s.substring(p).split("\n")
        l0 = a0.pop(),
            ln = l0 + a1.shift();

        var a2 = a0.concat(a1),
            ix = a0.length + dir,
            l1 = a2.slice(0, ix).join("\n").length + l0.length + 1;
        a2.splice(ix, 0, ln);

        obj.ta.value = a2.join("\n");
        obj.ta.setSelectionRange(l1, l1);
    };
    /**
     * create the Menu as unordered List
     * @param {Object} Menu-Structure as JS-Object
     * @param {Bool} Flag set to true at first call (Root-Node)
     */
    mee.prototype.buildMenu = function (nodes, start) {
        var ul = d.createElement('UL');
        if (start) ul.className = 'mee_menu';
        for (var i = 0, j = nodes.length; i < j; ++i) {
            ul.appendChild(this.buildMenuItem(nodes[i]));
        }
        return ul;
    };
    /**
     * create Menu-Items as LI-tags
     * @param {Object} (Sub)Node(s) to define List-Item [+ Child-Branches]
     */
    mee.prototype.buildMenuItem = function (node) {
        var that = this;
        var li = document.createElement('LI');
        li.title = node.title;

        if (node.icon && node.icon.length > 2) {
            li.className = 'ui-icon-' + node.icon;
        }
        else {
            li.innerHTML = node.title;
            li.className = node.icon || '';
        }

        if (node.func) {
            li.onclick = function () {
                // clone the array
                var a = node.params.slice(0);
                // add the Object to the Parameter-Array
                a.unshift(that);
                if(that[node.func]) {
                    that[node.func].apply(this, a)
                }else if(window[node.func]) {
                    window[node.func](a[1], a[2], a[3], a[4]);
                }
            }
        }
        if (node.sub) {
            li.appendChild(this.buildMenu(node.sub, false));
        }
        return li;
    };
    /**
     * create the Menu as a select-list
     * @param {Object} Menu-Structure as JS-Object
     * @param {Bool} Flag set to true at first call (Root-Node)
     */
    mee.prototype.buildMenuSelect = function (nodes, start) {
        this.menuFunctions = {};
        var that = this;
        if (start) {
            this.sel = d.createElement('SELECT');
            this.sel.className = 'mee_select';
            this.sel.onchange = function () {
                var f = that.menuFunctions[this.value]['func'],
                    p = that.menuFunctions[this.value]['params'];
                p.unshift(that);
                that[f].apply(this, p);
            }
        }
        for (var i = 0, j = nodes.length; i < j; ++i) {
            this.sel.appendChild(this.buildMenuOption(nodes[i], i));
        }
        return this.sel;
    };
    /**
     * create Options for Select-List
     * @param {Object} (Sub)Node(s) to define Options/Optgroups
     * @param {Number} Counter to build a Reference from Values to Action-Holder (menuFunctions)
     */
    mee.prototype.buildMenuOption = function (node, no) {
        if (node.sub) {
            var o = document.createElement('OPTGROUP');
            o.label = node.title;
            for (var i = 0, j = node.sub.length; i < j; ++i) {
                o.appendChild(this.buildMenuOption(node.sub[i], no + '_' + i));
            }
            return o;
        }
        else {
            var o = document.createElement('OPTION');
            o.innerHTML = node.title;

            if (node.func) {
                o.value = no;
                this.menuFunctions[no] = {};
                this.menuFunctions[no]['func'] = node.func;
                this.menuFunctions[no]['params'] = node.params;
            }
            else {
                o.value = '';
            }
            return o;
        }
    };
    /**
     * wrap formatting around selected Text
     * @param {Object} Reference to this Instance
     * @param {String} Code to insert before selected String
     * @param {String} Code to insert after selected String
     * @param {Bool} Flag to format multiple Lines
     * @param {Number} Offset to place the Cursor if Selection is empty
     */
    mee.prototype.format = function (obj, before, after, multiline, offset) {
        obj.ta.focus();
        var s = obj.ta.selectionStart,
            e = obj.ta.selectionEnd,
            v = obj.ta.value,
            m = v.substring(s, e);

        if (before.length == 0 && after.length == 0) {
            m = m.replace(/\*/g, '').replace(/1./g, '').replace(/#/g, '').replace(/\n\s{1,}/g, '\n');
        }

        if (multiline) {
            m = m.replace(/\n/g, '\n' + before);
        }
        var b = v.substring(0, s) + before + m + after,
            pos = b.length;

        obj.ta.value = b + v.substring(e, v.length);
        obj.transfer(obj);
        obj.ta.focus();
        //pos += offset || 0;
        obj.ta.setSelectionRange(pos, pos);

    };
    /**
     * build Markdown-Code for a Table
     * @param {Object} Reference to this Instance
     */
    mee.prototype.insertTable = function (obj) {
        var cols = prompt(obj.options.labels.q_columns, '3'),
            rows = prompt(obj.options.labels.q_rows, '3');
        var rh = [], rl = [], rb = [];
        for (var i = 0, j = parseInt(cols); i < j; ++i) {
            rh.push(obj.options.labels.t_header);
            rl.push('--------------');
            rb.push(obj.options.labels.t_cell);
        }
        var str = "\n" + rh.join('|') + "\n" + rl.join('|');
        for (i = 0, j = parseInt(rows); i < j; ++i) {
            str += "\n" + rb.join('|');
        }
        obj.format(obj, '', str);
    };
    /**
     * transcode Markdown to HTML shown in Preview
     * @param {Object} Reference to this Instance
     * @param {Bool} enforce transcoding (eg. at startup)
     */
    mee.prototype.transfer = function (obj, enforce) {

        if (!obj.live) return;
        var v = obj.ta.value;

        if (enforce) obj.pv.innerHTML = '<i>' + obj.options.labels.regen_markup + '</i>';

        // if the Text is too big we should deactivate "background-transcoding"
        if (!enforce && v.length > (obj.touch ? 2000 : 10000)) return;

        var html = Markdown(v);
        html = obj.postProcess(html);

        // encode html-comments as bubbles
        if (obj.showComments) html = html.replace(/<!--(.*)-->/g, '<span class="ui-icon-comment" title="$1"></span>');
        obj.pv.innerHTML = html;
        return true;
    };


    /**
     * Post-Process HTML This Function is meant to be overloaded from Outside
     * @param {String} HTML
     * @return {String} HTML
     */
    mee.prototype.postProcess = function (html) {
        return html;
    };

    /**
     * Toggle Editor-Mode
     * @param {Object} Reference to this Instance
     * @param {String} Mode to activate ('both', 'preview', 'editor')
     */
    mee.prototype.toggleScreens = function (obj, to) {

        // enforce transfer
        if(to != 'editor') {
            obj.live = true;
            obj.transfer(obj, true)
        };
        obj.container.className = 'mee_container mee_mode_' + to;
        obj.live = (to == 'both');
        if (to == 'preview') obj.buildToc(obj, ['h1', 'h2', 'h3', 'h4', 'h5']);
    };
    /**
     * create Table of Contents inspired by: http://www.quirksmode.org/js/contents.html
     * @param {Object} Reference to this Instance
     * @param {Array} Tags/Properties to search for
     */
    mee.prototype.buildToc = function (obj, tagList) {

        var res = [];
        //obj.transfer(obj);

        for (var i = 0, j = tagList.length; i < j; ++i) {
            var els = document.querySelectorAll('#' + obj.containerid + ' > .mee_preview ' + tagList[i]);
            for (var k = 0, l = els.length; k < l; ++k) {
                res.push(els[k]);
            }
        }
        var testNode = res[0];
        if (!testNode) return [];

        if (testNode.sourceIndex) {
            res.sort(function (a, b) {
                return a.sourceIndex - b.sourceIndex;
            });
        }
        else if (testNode.compareDocumentPosition) {
            res.sort(function (a, b) {
                return 3 - (a.compareDocumentPosition(b) & 6);
            });
        }

        if (res.length > 0) {

            var r = obj.pv.getBoundingClientRect();
            var y = document.createElement('DIV');
            y.className = 'mee_tocdiv';
            y.setAttribute('style', 'opacity:0.5;top:' + r.top + 'px;left:' + (r.right - r.width / 2) + 'px;width:' + (r.width / 2) + 'px;');
            y.innerHTML = '<i onclick="this.parentNode.style.display=\'none\'" style="float:right;cursor:pointer">&otimes;</i>';

            for (var i = 0, j = res.length; i < j; ++i) {
                var tmp = document.createElement('a'),
                    div = document.createElement('div'),
                    ih = res[i].title || res[i].innerHTML;
                div.innerHTML = ih;
                ih = div.textContent || div.innerText || 'Item ' + i;

                tmp.innerHTML = ih.substring(0, 30);
                y.appendChild(tmp);
                tmp.className += ' ind' + res[i].nodeName;

                var refId = res[i].id || obj.containerid + 'tocref' + i;
                tmp.href = '#' + refId;
                res[i].id = refId;
            }
            obj.pv.appendChild(y);
        }
    };
    /**
     *
     * @param {Object} Reference to this Instance
     */
    mee.prototype.showSource = function (obj) {
        var p = document.createElement('pre');
        p.textContent = obj.pv.innerHTML;
        obj.pv.innerHTML = '';
        obj.pv.appendChild(p);
    };

    /**
     * default Options
     * to manage them just copy&paste the JSON to http://jsoneditoronline.org
     */
    mee.prototype.options = {

        menu: // Menu-JSON BEGIN

            [
                {
                    "title": "Heading",
                    "icon": "np",
                    "sub": [
                        {
                            "title": "H1",
                            "func": "format",
                            "params": [
                                "# ",
                                ""
                            ]
                        },
                        {
                            "title": "H2",
                            "func": "format",
                            "params": [
                                "## ",
                                ""
                            ]
                        },
                        {
                            "title": "H3",
                            "func": "format",
                            "params": [
                                "### ",
                                ""
                            ]
                        },
                        {
                            "title": "H4",
                            "func": "format",
                            "params": [
                                "#### ",
                                ""
                            ]
                        },
                        {
                            "title": "H5",
                            "func": "format",
                            "params": [
                                "##### ",
                                ""
                            ]
                        }
                    ]
                },
                {
                    "title": "Edit mode",
                    "sub": [
                        {
                            "title": "Dual-column mode",
                            "icon": "columns",
                            "func": "toggleScreens",
                            "params": [
                                "both"
                            ]
                        },
                        {
                            "title": "Editing mode",
                            "icon": "edit",
                            "func": "toggleScreens",
                            "params": [
                                "editor"
                            ]
                        },
                        {
                            "title": "Preview",
                            "icon": "eye",
                            "func": "toggleScreens",
                            "params": [
                                "preview"
                            ]
                        }
                    ]
                },
                {
                    "title": "Format bold (ctrl+b)",
                    "icon": "bold np",
                    "func": "format",
                    "params": [
                        "**",
                        "**"
                    ]
                },
                {
                    "title": "Format italics (ctrl+i)",
                    "icon": "italic np",
                    "func": "format",
                    "params": [
                        "*",
                        "*"
                    ]
                },
                {
                    "title": "Unordered list",
                    "icon": "list-bullet np",
                    "func": "format",
                    "params": [
                        "* ",
                        "",
                        "true"
                    ]
                },
                {
                    "title": "Ordered list",
                    "icon": "list-numbered np",
                    "func": "format",
                    "params": [
                        "1. ",
                        "",
                        "true"
                    ]
                },
                {
                    "title": "Indent 4 spaces",
                    "icon": "indent-right np",
                    "func": "format",
                    "params": [
                        "    ",
                        "",
                        "true"
                    ]
                },
                {
                    "title": "Insert table",
                    "icon": "table",
                    "func": "insertTable",
                    "params": [
                        "true"
                    ]
                },
                {
                    "title": "Remove formatting",
                    "icon": "eraser np",
                    "func": "format",
                    "params": [
                        "",
                        "",
                        "true"
                    ]
                },
                {
                    "title": "Show source",
                    "icon": "code ne",
                    "func": "showSource",
                    "params": [
                        "true"
                    ]
                },
                {
                    "title": "Get help",
                    "icon": "help-circled ne",
                    "func": "getFrame",
                    "params": [
                        "admin/package_manager/showDoc.php?file=../../wizards/markup/doc/de/markdown_reference.md"

                    ]
                }
            ]
// Menu-JSON END

// Language-Labels BEGIN
        , labels: {
            "regen_markup": "regenerate Markdown, please wait",
            "q_columns": "how many columns do you need",
            "q_rows": "how many rows do you need",
            "t_header": "Header",
            "t_cell": "Cell Content",
            "": ""
        }
// Language-Labels END

    }// Options END

})(window, document);
