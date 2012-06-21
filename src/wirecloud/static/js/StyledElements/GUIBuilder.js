/*global Document, EzWebExt, StyledElements*/

(function () {

    "use strict";

    var GUIBuilder, processTComponent, processTree, processRoot, extractOptions, NAMESPACE, TEMPLATE_NAMESPACE;

    NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/StyledElements';
    TEMPLATE_NAMESPACE = 'http://wirecloud.conwet.fi.upm.es/Template';

    processTComponent = function processTComponent(element, tcomponents) {
        var options, new_component;

        if (typeof tcomponents[element.localName] === 'function') {
            try {
                options = JSON.parse(element.textContent);
            } catch (e) {}

            new_component = tcomponents[element.localName](options);
        } else {
            new_component = tcomponents[element.localName];
        }

        return new_component;
    };

    processTree = function processTree(builder, element, tcomponents) {
        var i, child, component, new_component;

        for (i = 0; i < element.childNodes.length; i += 1) {
            child = element.childNodes[i];
            if (!EzWebExt.XML.isElement(child)) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents);
                component.insertInto(element, child);
                element.removeChild(child);
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                new_component = processTComponent(child, tcomponents);
                new_component.insertInto(element, child);
                element.removeChild(child);
            }  else {
                processTree(builder, child, tcomponents);
            }
        }
    };

    processRoot = function processRoot(builder, element, tcomponents) {
        var i, children, child, component;

        children = Array.prototype.slice.call(element.childNodes, 0);

        for (i = 0; i < children.length; i += 1) {
            child = children[i];
            if (!EzWebExt.XML.isElement(child)) {
                continue;
            }

            if (child.namespaceURI === NAMESPACE) {
                component = builder.build(child, tcomponents);
                children[i] = component;
            } else if (child.namespaceURI === TEMPLATE_NAMESPACE) {
                children[i] = processTComponent(child, tcomponents);
            } else {
                processTree(builder, child, tcomponents);
            }
        }

        return children;
    };

    extractOptions = function extractOptions(element) {
        var options, options_element;

        options = null;
        options_element = element.ownerDocument.evaluate('s:options', element, function () { return 'http://wirecloud.conwet.fi.upm.es/StyledElements'; }, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (options_element != null) {
            options_element.parentNode.removeChild(options_element);
            try {
                options = JSON.parse(options_element.textContent);
            } catch (e) {}
        }

        return options;
    };

    GUIBuilder = function GUIBuilder() {
        var mapping = {
            'borderlayout': function (builder, element, options, tcomponents) {
                var layout = new StyledElements.BorderLayout(options);

                var populateContainer = function populateContainer(element, xpath, container) {
                    var container_element, i, childNodes;

                    container_element = element.ownerDocument.evaluate(xpath,
                        element,
                        function () { return 'http://wirecloud.conwet.fi.upm.es/StyledElements'; },
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null).singleNodeValue;

                    if (container_element != null) {
                        options = extractOptions(container_element);
                        if (options != null && 'class' in options) {
                            container.addClassName(options['class']);
                        }

                        childNodes = processRoot(builder, container_element, tcomponents);
                        for (i = 0; i < childNodes.length; i += 1) {
                            container.appendChild(childNodes[i]);
                        }
                    }
                };

                populateContainer(element, 's:northcontainer', layout.getNorthContainer());
                populateContainer(element, 's:westcontainer', layout.getWestContainer());
                populateContainer(element, 's:centercontainer', layout.getCenterContainer());
                populateContainer(element, 's:eastcontainer', layout.getEastContainer());
                populateContainer(element, 's:southcontainer', layout.getSouthContainer());

                return layout;
            },
            'button': function (builder, element, options) {
                options = EzWebExt.merge({}, options);
                options.text = element.textContent;
                return new StyledElements.StyledButton(options);
            }
        };

        this.build = function (element, tcomponents) {
            var builder, options;

            builder = mapping[element.localName];
            options = extractOptions(element);
            return builder(this, element, options, tcomponents);
        };
    };

    GUIBuilder.prototype.parse = function parse(document, tcomponents) {
        if (typeof document === 'string') {
            document = EzWebExt.XML.parseFromString(document, 'application/xml');
        }

        if (!(document instanceof Document)) {
            throw new TypeError('document is not a Document or cannot be parsed into a Document');
        }

        return processRoot(this, document.documentElement, tcomponents);
    };

    StyledElements.GUIBuilder = GUIBuilder;
})();