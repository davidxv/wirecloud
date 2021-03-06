/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global Wirecloud*/

(function () {

    "use strict";

    var ContextManager = function ContextManager(contextInstance, context_description) {
        Object.defineProperty(this, 'instance', {value: contextInstance});

        var context = {};
        var handlers = [];

        Object.freeze(context_description);
        for (var key in context_description) {
            context_description[key];
            if (typeof context_description[key] === 'object' && 'value' in context_description[key]) {
                context[key] = context_description[key].value;
            } else {
                context[key] = null;
            }
        }

        Object.defineProperty(this, 'getAvailableContext', {
            value: function getAvailableContext() {
                return context_description;
            }
        });

        Object.defineProperty(this, 'addCallback', {
            value: function addCallback(handler) {
                if (typeof handler !== 'function') {
                    throw new TypeError();
                }

                handlers.push(handler);
            }
        });

        Object.defineProperty(this, 'removeCallback', {
            value: function removeCallback(handler) {
                var index;

                if (typeof handler !== 'function') {
                    throw new TypeError();
                }

                index = handlers.indexOf(handler);
                if (index !== -1) {
                    handlers.splice(index, 1);
                }
            }
        });

        Object.defineProperty(this, 'get', {
            value: function get(key) {
                return context[key];
            }
        });

        Object.defineProperty(this, 'modify', {
            value: function get(values) {
                var key, i;

                if (typeof values !== 'object') {
                    throw new TypeError();
                }

                for (key in values) {
                    if (!context.hasOwnProperty(key)) {
                        throw new TypeError(key);
                    }
                }

                for (key in values) {
                    context[key] = values[key];
                }

                for (i = 0; i < handlers.length; i += 1) {
                    try {
                        handlers[i](values);
                    } catch (e) {}
                }
            }
        });
    };

    Wirecloud.ContextManager = ContextManager;

})();
